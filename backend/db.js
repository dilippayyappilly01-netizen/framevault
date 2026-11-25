const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const { createTursoClient } = require('./turso');

function mapLicenseRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    licenseKey: row.license_key,
    email: row.email,
    amountCents: row.amount_cents,
    currency: row.currency,
    method: row.method,
    externalId: row.external_id,
    paymentIntentId: row.payment_intent_id,
    active: Boolean(row.active),
    paidAt: row.created_at,
    revokedAt: row.revoked_at || null
  };
}

function generateLicenseKey() {
  const hex = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `OK-PRO-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

function createDatabase(config) {
  const isMemory = config.databasePath === ':memory:';
  if (!isMemory) {
    fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
  }

  const db = new DatabaseSync(config.databasePath);
  if (!isMemory) {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS licenses (
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
    );

    CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(lower(email));
    CREATE INDEX IF NOT EXISTS idx_licenses_payment_intent ON licenses(payment_intent_id);

    CREATE TABLE IF NOT EXISTS stripe_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      processed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS export_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT NOT NULL,
      component_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const stmtGetSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  const stmtSetSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const stmtCountLicenses = db.prepare('SELECT COUNT(*) AS cnt FROM licenses');
  const stmtFindByKey = db.prepare('SELECT * FROM licenses WHERE license_key = ?');
  const stmtFindByExternalId = db.prepare('SELECT * FROM licenses WHERE external_id = ?');
  const stmtFindActiveByEmail = db.prepare(
    'SELECT * FROM licenses WHERE lower(email) = lower(?) AND active = 1 ORDER BY id DESC'
  );
  const stmtInsertLicense = db.prepare(`
    INSERT INTO licenses (
      license_key, email, amount_cents, currency, method, external_id, payment_intent_id, active, created_at, revoked_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const stmtRevokeByKey = db.prepare(
    'UPDATE licenses SET active = 0, revoked_at = ? WHERE license_key = ? AND active = 1'
  );
  const stmtRevokeByPaymentIntent = db.prepare(
    'UPDATE licenses SET active = 0, revoked_at = ? WHERE payment_intent_id = ? AND active = 1'
  );
  const stmtInsertStripeEvent = db.prepare(
    'INSERT OR IGNORE INTO stripe_events (event_id, event_type, processed_at) VALUES (?, ?, ?)'
  );
  const stmtLogExport = db.prepare(
    'INSERT INTO export_logs (license_key, component_id, created_at) VALUES (?, ?, ?)'
  );
  const stmtExportStats = db.prepare(
    'SELECT COUNT(*) AS total FROM export_logs WHERE license_key = ?'
  );

  // One-time migration from legacy .ok-licenses.json if DB is brand new
  if (!isMemory && config.legacyLicenseFile && fs.existsSync(config.legacyLicenseFile)) {
    try {
      const existingCount = stmtCountLicenses.get().cnt;
      const existingSecret = stmtGetSetting.get('signing_secret');
      if (existingCount === 0 && !existingSecret) {
        const legacy = JSON.parse(fs.readFileSync(config.legacyLicenseFile, 'utf8'));
        if (legacy && typeof legacy === 'object') {
          if (legacy.secret && !config.signingSecretEnv) {
            stmtSetSetting.run('signing_secret', String(legacy.secret));
          }
          if (Array.isArray(legacy.licenses)) {
            for (const lic of legacy.licenses) {
              if (!lic || !lic.licenseKey) continue;
              const externalId = lic.method === 'stripe' ? lic.externalId : null;
              try {
                stmtInsertLicense.run(
                  String(lic.licenseKey),
                  String(lic.email || 'customer@framevault.dev').trim().toLowerCase(),
                  Number(lic.amountCents || config.licensePriceCents),
                  String(lic.currency || 'usd'),
                  String(lic.method || 'local-card'),
                  externalId,
                  null,
                  lic.active === false ? 0 : 1,
                  String(lic.paidAt || new Date().toISOString()),
                  lic.active === false ? new Date().toISOString() : null
                );
              } catch (_) {
                // Skip duplicate legacy entries
              }
            }
          }
        }
      }
    } catch (_) {
      // Ignore malformed legacy license file
    }
  }

  const turso = createTursoClient(config);

  // Resolve HMAC signing secret (env takes precedence; otherwise persistent DB secret)
  function getSigningSecret() {
    if (config.signingSecretEnv) {
      return config.signingSecretEnv;
    }
    const row = stmtGetSetting.get('signing_secret');
    if (row && row.value) return row.value;
    const generated = crypto.randomBytes(32).toString('hex');
    stmtSetSetting.run('signing_secret', generated);
    return generated;
  }

  let signingSecret = getSigningSecret();

  // Hydrate local SQLite from Turso cloud DB on startup (survives Render Free Tier restarts)
  const ready = turso.enabled
    ? turso
        .hydrateLocalDb(db)
        .then(res => {
          if (!config.signingSecretEnv) {
            const hydratedSecret = stmtGetSetting.get('signing_secret')?.value;
            if (hydratedSecret) {
              signingSecret = hydratedSecret;
            } else {
              turso.enqueueWrite(
                'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
                ['signing_secret', signingSecret]
              );
            }
          }
          return res;
        })
        .catch(err => ({ hydrated: false, error: err.message }))
    : Promise.resolve({ hydrated: false, licenseCount: 0 });

  function issueLicense({
    email,
    amountCents = config.licensePriceCents,
    currency = 'usd',
    method = 'demo-card',
    externalId = null,
    paymentIntentId = null
  }) {
    const cleanExternalId = externalId ? String(externalId).trim() : null;
    if (cleanExternalId) {
      const existing = stmtFindByExternalId.get(cleanExternalId);
      if (existing) {
        return { license: mapLicenseRow(existing), created: false };
      }
    }

    const cleanEmail = String(email || 'customer@framevault.dev')
      .trim()
      .toLowerCase()
      .slice(0, 140);
    const now = new Date().toISOString();

    for (let attempt = 0; attempt < 5; attempt++) {
      const licenseKey = generateLicenseKey();
      try {
        stmtInsertLicense.run(
          licenseKey,
          cleanEmail,
          Number(amountCents),
          String(currency || 'usd').toLowerCase(),
          String(method),
          cleanExternalId,
          paymentIntentId ? String(paymentIntentId) : null,
          1,
          now,
          null
        );
        const inserted = stmtFindByKey.get(licenseKey);
        turso.enqueueWrite(
          `INSERT OR IGNORE INTO licenses (
            license_key, email, amount_cents, currency, method, external_id, payment_intent_id, active, created_at, revoked_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            licenseKey,
            cleanEmail,
            Number(amountCents),
            String(currency || 'usd').toLowerCase(),
            String(method),
            cleanExternalId,
            paymentIntentId ? String(paymentIntentId) : null,
            1,
            now,
            null
          ]
        );
        return { license: mapLicenseRow(inserted), created: true };
      } catch (err) {
        if (cleanExternalId) {
          const raceExisting = stmtFindByExternalId.get(cleanExternalId);
          if (raceExisting) {
            return { license: mapLicenseRow(raceExisting), created: false };
          }
        }
        if (attempt === 4) throw err;
      }
    }
    throw new Error('Failed to issue license');
  }

  function isOwnerKeyMatch(candidate) {
    const configured = String(config.ownerLicenseKey || '').trim();
    if (configured.length < 12) return false;
    const raw = String(candidate || '').trim();
    const a = Buffer.from(raw, 'utf8');
    const b = Buffer.from(configured, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  function findActiveLicenseByKey(licenseKey) {
    if (!licenseKey) return null;
    if (isOwnerKeyMatch(licenseKey)) {
      return {
        id: 0,
        licenseKey: config.ownerLicenseKey,
        displayKey: 'OWNER-ACCESS',
        email: 'owner@framevault.dev',
        method: 'owner-key',
        active: true,
        isOwner: true,
        amountCents: 0,
        currency: config.licenseCurrency,
        createdAt: new Date(0).toISOString()
      };
    }
    const row = stmtFindByKey.get(String(licenseKey).trim());
    if (!row || !row.active) return null;
    return mapLicenseRow(row);
  }

  function findLicenseByExternalId(externalId) {
    if (!externalId) return null;
    return mapLicenseRow(stmtFindByExternalId.get(String(externalId).trim()));
  }

  function findActiveLicensesByEmail(email) {
    if (!email) return [];
    const rows = stmtFindActiveByEmail.all(String(email).trim().toLowerCase());
    return rows.map(mapLicenseRow);
  }

  function revokeLicenseByKey(licenseKey) {
    const now = new Date().toISOString();
    const key = String(licenseKey).trim();
    const res = stmtRevokeByKey.run(now, key);
    if (res.changes > 0) {
      turso.enqueueWrite(
        'UPDATE licenses SET active = 0, revoked_at = ? WHERE license_key = ? AND active = 1',
        [now, key]
      );
    }
    return res.changes > 0;
  }

  function revokeLicenseByPaymentIntent(paymentIntentId) {
    if (!paymentIntentId) return false;
    const now = new Date().toISOString();
    const pid = String(paymentIntentId).trim();
    const res = stmtRevokeByPaymentIntent.run(now, pid);
    if (res.changes > 0) {
      turso.enqueueWrite(
        'UPDATE licenses SET active = 0, revoked_at = ? WHERE payment_intent_id = ? AND active = 1',
        [now, pid]
      );
    }
    return res.changes > 0;
  }

  function recordStripeEvent(eventId, eventType) {
    const now = new Date().toISOString();
    const eid = String(eventId);
    const etype = String(eventType || 'unknown');
    const res = stmtInsertStripeEvent.run(eid, etype, now);
    if (res.changes > 0) {
      turso.enqueueWrite(
        'INSERT OR IGNORE INTO stripe_events (event_id, event_type, processed_at) VALUES (?, ?, ?)',
        [eid, etype, now]
      );
    }
    return res.changes > 0;
  }

  function logExport(licenseKey, componentId) {
    try {
      const now = new Date().toISOString();
      stmtLogExport.run(String(licenseKey), String(componentId || 'unknown'), now);
      turso.enqueueWrite(
        'INSERT INTO export_logs (license_key, component_id, created_at) VALUES (?, ?, ?)',
        [String(licenseKey), String(componentId || 'unknown'), now]
      );
    } catch (_) {
      // Non-fatal telemetry error
    }
  }

  function getExportCount(licenseKey) {
    return stmtExportStats.get(String(licenseKey))?.total || 0;
  }

  function close() {
    db.close();
  }

  return {
    get signingSecret() {
      return signingSecret;
    },
    ready,
    flush: () => turso.flush(),
    tursoStatus: () => turso.getStatus(),
    issueLicense,
    findActiveLicenseByKey,
    findLicenseByExternalId,
    findActiveLicensesByEmail,
    revokeLicenseByKey,
    revokeLicenseByPaymentIntent,
    recordStripeEvent,
    logExport,
    getExportCount,
    close
  };
}

module.exports = { createDatabase, generateLicenseKey };
