function normalizeTursoEndpoint(rawUrl) {
  const s = String(rawUrl || '').trim().replace(/\/+$/, '');
  if (!s) return '';
  let httpUrl = s;
  if (httpUrl.startsWith('libsql://')) {
    httpUrl = 'https://' + httpUrl.slice('libsql://'.length);
  } else if (httpUrl.startsWith('wss://')) {
    httpUrl = 'https://' + httpUrl.slice('wss://'.length);
  } else if (httpUrl.startsWith('ws://')) {
    httpUrl = 'http://' + httpUrl.slice('ws://'.length);
  }
  return httpUrl.endsWith('/v2/pipeline') ? httpUrl : `${httpUrl}/v2/pipeline`;
}

function toHranaArg(val) {
  if (val === null || val === undefined) return { type: 'null' };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { type: 'integer', value: String(val) };
    return { type: 'float', value: val };
  }
  if (typeof val === 'boolean') return { type: 'integer', value: val ? '1' : '0' };
  return { type: 'text', value: String(val) };
}

function parseHranaCell(cell) {
  if (!cell || cell.type === 'null') return null;
  if (cell.type === 'integer') return Number(cell.value);
  if (cell.type === 'float') return Number(cell.value);
  return cell.value ?? null;
}

function parseHranaRows(executeResult) {
  const cols = (executeResult?.cols || []).map(c => c.name);
  const rows = executeResult?.rows || [];
  return rows.map(row => {
    const obj = {};
    for (let i = 0; i < cols.length; i++) {
      obj[cols[i]] = parseHranaCell(row[i]);
    }
    return obj;
  });
}

function createTursoClient(config) {
  const endpoint = normalizeTursoEndpoint(config.tursoDatabaseUrl);
  const authToken = String(config.tursoAuthToken || '').trim();
  const enabled = Boolean(endpoint && authToken);

  let writeChain = Promise.resolve();
  let lastError = null;
  let hydrated = false;

  async function executePipeline(statements) {
    if (!enabled) return [];
    const requests = statements.map(st => ({
      type: 'execute',
      stmt: {
        sql: st.sql,
        ...(Array.isArray(st.args) && st.args.length > 0
          ? { args: st.args.map(toHranaArg) }
          : {})
      }
    }));
    requests.push({ type: 'close' });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Turso HTTP ${res.status}: ${txt.slice(0, 200)}`);
    }

    const data = await res.json();
    const results = data?.results || [];
    const out = [];
    for (let i = 0; i < statements.length; i++) {
      const item = results[i];
      if (!item || item.type === 'error') {
        throw new Error(item?.error?.message || `Turso SQL error at statement ${i}`);
      }
      out.push(parseHranaRows(item.response?.result));
    }
    return out;
  }

  function enqueueWrite(sql, args = []) {
    if (!enabled) return Promise.resolve();
    const run = async () => {
      try {
        await executePipeline([{ sql, args }]);
        lastError = null;
      } catch (err) {
        // Retry once on transient network blip
        try {
          await executePipeline([{ sql, args }]);
          lastError = null;
        } catch (err2) {
          lastError = err2.message || String(err2);
        }
      }
    };
    writeChain = writeChain.then(run, run);
    return writeChain;
  }

  async function hydrateLocalDb(localDb) {
    if (!enabled) return { hydrated: false, licenseCount: 0 };

    const schemaStatements = [
      {
        sql: `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS licenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          license_key TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          amount_cents INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'usd',
          method TEXT NOT NULL,
          external_id TEXT UNIQUE,
          payment_intent_id TEXT,
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          revoked_at TEXT
        )`
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS stripe_events (
          event_id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          processed_at TEXT NOT NULL
        )`
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS export_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          license_key TEXT NOT NULL,
          component_id TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`
      }
    ];

    await executePipeline(schemaStatements);

    const [settingsRows, licenseRows, eventRows] = await executePipeline([
      { sql: 'SELECT key, value FROM settings' },
      {
        sql: 'SELECT license_key, email, amount_cents, currency, method, external_id, payment_intent_id, active, created_at, revoked_at FROM licenses ORDER BY id ASC'
      },
      { sql: 'SELECT event_id, event_type, processed_at FROM stripe_events' }
    ]);

    const upsertSetting = localDb.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const s of settingsRows) {
      if (s.key && s.value != null) upsertSetting.run(String(s.key), String(s.value));
    }

    const upsertLicense = localDb.prepare(`
      INSERT INTO licenses (
        license_key, email, amount_cents, currency, method, external_id, payment_intent_id, active, created_at, revoked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(license_key) DO UPDATE SET
        active = excluded.active,
        revoked_at = excluded.revoked_at
    `);
    for (const r of licenseRows) {
      if (!r.license_key) continue;
      try {
        upsertLicense.run(
          String(r.license_key),
          String(r.email || 'customer@framevault.dev'),
          Number(r.amount_cents || config.licensePriceCents),
          String(r.currency || 'usd'),
          String(r.method || 'razorpay'),
          r.external_id != null ? String(r.external_id) : null,
          r.payment_intent_id != null ? String(r.payment_intent_id) : null,
          Number(r.active ? 1 : 0),
          String(r.created_at || new Date().toISOString()),
          r.revoked_at != null ? String(r.revoked_at) : null
        );
      } catch (_) {
        // Skip conflicting rows
      }
    }

    const upsertEvent = localDb.prepare(
      'INSERT OR IGNORE INTO stripe_events (event_id, event_type, processed_at) VALUES (?, ?, ?)'
    );
    for (const ev of eventRows) {
      if (ev.event_id) {
        upsertEvent.run(
          String(ev.event_id),
          String(ev.event_type || 'unknown'),
          String(ev.processed_at || new Date().toISOString())
        );
      }
    }

    hydrated = true;
    lastError = null;
    return { hydrated: true, licenseCount: licenseRows.length };
  }

  return {
    enabled,
    endpoint,
    executePipeline,
    enqueueWrite,
    hydrateLocalDb,
    flush: () => writeChain,
    getStatus: () => ({ enabled, hydrated, lastError })
  };
}

module.exports = {
  normalizeTursoEndpoint,
  createTursoClient
};
