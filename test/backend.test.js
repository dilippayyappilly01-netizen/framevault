const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { Readable, Writable } = require('node:stream');
const { createAppServer } = require('../server');

function startTestServer(overrides = {}, deps = {}) {
  const app = createAppServer({
    DATABASE_PATH: ':memory:',
    PORT: '3000',
    ORIGINKIT_SECRET: 'test-signing-secret-32-bytes-minimum-123456',
    LICENSE_CURRENCY: 'USD',
    LICENSE_PRICE_CENTS: '499',
    LICENSE_PRICE_DISPLAY: '',
    RAZORPAY_KEY_ID: '',
    RAZORPAY_KEY_SECRET: '',
    RAZORPAY_WEBHOOK_SECRET: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    TURSO_DATABASE_URL: '',
    TURSO_AUTH_TOKEN: '',
    ...overrides
  }, deps);
  return {
    ...app,
    baseUrl: app.server,
    close: async () => {
      app.shutdown();
    }
  };
}

function request(server, pathAndQuery, options = {}) {
  return new Promise((resolve, reject) => {
    const method = options.method || 'GET';
    const rawHeaders = {};
    for (const [k, v] of Object.entries(options.headers || {})) {
      rawHeaders[k.toLowerCase()] = v;
    }
    if (!rawHeaders.host) rawHeaders.host = '127.0.0.1:3000';

    const bodyBuf =
      options.body === undefined
        ? Buffer.alloc(0)
        : Buffer.isBuffer(options.body)
          ? options.body
          : Buffer.from(String(options.body), 'utf8');

    const req = new Readable({
      read() {
        if (bodyBuf.length > 0) this.push(bodyBuf);
        this.push(null);
      }
    });
    req.url = pathAndQuery;
    req.method = method;
    req.headers = rawHeaders;
    req.socket = { remoteAddress: '127.0.0.1', encrypted: false };

    const chunks = [];
    const resHeaders = {};
    const res = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        callback();
      }
    });
    res.statusCode = 200;
    res.headersSent = false;
    res.writeHead = (statusCode, headers = {}) => {
      res.statusCode = statusCode;
      res.headersSent = true;
      for (const [k, v] of Object.entries(headers)) {
        resHeaders[k.toLowerCase()] = v;
      }
      return res;
    };
    res.setHeader = (k, v) => {
      resHeaders[k.toLowerCase()] = v;
    };
    res.getHeader = (k) => resHeaders[k.toLowerCase()];

    res.on('finish', () => {
      const buf = Buffer.concat(chunks);
      const text = buf.toString('utf8');
      let json = null;
      try {
        json = JSON.parse(text);
      } catch (_) {}
      resolve({
        status: res.statusCode,
        headers: resHeaders,
        text,
        json
      });
    });
    res.on('error', reject);

    server.emit('request', req, res);
  });
}

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) return '';
  const first = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  return first.split(';')[0];
}

function signStripeWebhookPayload(payloadStr, secret, timestampSec = Math.floor(Date.now() / 1000)) {
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${timestampSec}.${payloadStr}`, 'utf8')
    .digest('hex');
  return `t=${timestampSec},v1=${sig}`;
}

test('health check and static file security boundaries', async () => {
  const srv = await startTestServer({ NODE_ENV: 'development' });
  try {
    const health = await request(srv.baseUrl, '/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.json.ok, true);
    assert.equal(health.json.db, 'sqlite');
    assert.equal(health.json.components, 50);
    assert.equal(health.headers['x-content-type-options'], 'nosniff');
    assert.equal(health.headers['x-frame-options'], 'SAMEORIGIN');

    // Sensitive files MUST be blocked (403)
    const blockedPaths = [
      '/server.js',
      '/start.bat',
      '/package.json',
      '/.env.example',
      '/.ok-licenses.json',
      '/backend/db.js',
      '/backend/config.js',
      '/mcp-server/package.json',
      '/test/backend.test.js'
    ];
    for (const p of blockedPaths) {
      const res = await request(srv.baseUrl, p);
      assert.equal(res.status, 403, `Expected 403 for ${p}, got ${res.status}`);
    }

    // Public frontend files work
    const indexRes = await request(srv.baseUrl, '/');
    assert.equal(indexRes.status, 200);
    assert.match(indexRes.text, /FrameVault/);

    // Raw HTML & React TSX under /designs/ are both blocked with 402 when unpaid
    const rawDesignRes = await request(srv.baseUrl, '/designs/orbs/orb%201/index.html');
    assert.equal(rawDesignRes.status, 402);
    const rawTsxRes = await request(srv.baseUrl, '/designs/orbs/orb%201/Orb1.tsx');
    assert.equal(rawTsxRes.status, 402);
    const scriptsRes = await request(srv.baseUrl, '/scripts/generate-tsx.js');
    assert.equal(scriptsRes.status, 403);
  } finally {
    await srv.close();
  }
});

test('paywall leak closed: catalog endpoints never expose htmlSource or htmlPath', async () => {
  const srv = await startTestServer({ NODE_ENV: 'development' });
  try {
    const libRes = await request(srv.baseUrl, '/api/library');
    assert.equal(libRes.status, 200);
    assert.equal(libRes.json.unlocked, false);
    assert.equal(libRes.json.components.length, 50);
    for (const comp of libRes.json.components) {
      assert.equal('htmlSource' in comp, false, `htmlSource leaked on ${comp.id}`);
      assert.equal('htmlPath' in comp, false, `htmlPath leaked on ${comp.id}`);
    }

    const scriptRes = await request(srv.baseUrl, '/components-data.js');
    assert.equal(scriptRes.status, 200);
    assert.equal(scriptRes.text.includes('"htmlSource"'), false);
    assert.equal(scriptRes.text.includes('<!DOCTYPE html>'), false);
  } finally {
    await srv.close();
  }
});

test('iframe preview endpoint enforces iframe dest and compiles customized state', async () => {
  const srv = await startTestServer({ NODE_ENV: 'development' });
  try {
    // Direct document navigation & headerless CLI scraping blocked
    const directRes = await request(srv.baseUrl, '/api/preview/orbs__orb-1', {
      headers: { 'Sec-Fetch-Dest': 'document' }
    });
    assert.equal(directRes.status, 403);
    const cliRes = await request(srv.baseUrl, '/api/preview/orbs__orb-1');
    assert.equal(cliRes.status, 403);

    // Embedded iframe request succeeds with root-relative base href
    const iframeRes = await request(srv.baseUrl, '/api/preview/orbs__orb-1', {
      headers: { 'Sec-Fetch-Dest': 'iframe' }
    });
    assert.equal(iframeRes.status, 200);
    assert.match(iframeRes.text, /<base href="\/designs\/orbs\/orb%201\/">/);
    assert.match(iframeRes.text, /window\.__OK_STATE__/);

    // Server-side recompile preview token
    const comp = srv.catalog.byId.get('orbs__orb-1');
    const customCps = JSON.parse(JSON.stringify(comp.controlParameterSet));
    customCps.htmlProperties.documentTitle.value = 'Custom Preview Orb';

    const postRes = await request(srv.baseUrl, '/api/preview/orbs__orb-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ controlParameterSet: customCps })
    });
    assert.equal(postRes.status, 200);
    assert.ok(postRes.json.previewUrl);

    const customIframeRes = await request(srv.baseUrl, postRes.json.previewUrl, {
      headers: { 'Sec-Fetch-Dest': 'iframe' }
    });
    assert.equal(customIframeRes.status, 200);
    assert.match(customIframeRes.text, /<title>Custom Preview Orb<\/title>/);
  } finally {
    await srv.close();
  }
});

test('demo checkout unlocks /api/source and /api/export-html in development mode', async () => {
  const srv = await startTestServer({ NODE_ENV: 'development' });
  try {
    // Locked before payment
    const lockedSrc = await request(srv.baseUrl, '/api/source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'orbs__orb-1' })
    });
    assert.equal(lockedSrc.status, 402);

    const lockedExp = await request(srv.baseUrl, '/api/export-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'orbs__orb-1' })
    });
    assert.equal(lockedExp.status, 402);

    // Complete local demo checkout
    const payRes = await request(srv.baseUrl, '/api/checkout/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'buyer@studio.dev',
        cardholder: 'Alex Morgan',
        cardNumber: '4242 4242 4242 4242',
        expiry: '12 / 28',
        cvc: '424'
      })
    });
    assert.equal(payRes.status, 200);
    assert.equal(payRes.json.unlocked, true);
    assert.match(payRes.json.licenseKey, /^OK-PRO-/);

    const cookie = extractCookie(payRes.headers['set-cookie']);
    assert.ok(cookie.startsWith('ok_access='));

    // Source & export now succeed
    const comp = srv.catalog.byId.get('orbs__orb-1');
    const customCps = JSON.parse(JSON.stringify(comp.controlParameterSet));
    customCps.htmlProperties.documentTitle.value = 'Exported Orb Title';

    const srcRes = await request(srv.baseUrl, '/api/source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ id: 'orbs__orb-1', controlParameterSet: customCps })
    });
    assert.equal(srcRes.status, 200);
    assert.match(srcRes.json.html, /<title>Exported Orb Title<\/title>/);
    assert.equal(srcRes.json.html.includes('<base href='), false);

    const expRes = await request(srv.baseUrl, '/api/export-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ id: 'orbs__orb-1', controlParameterSet: customCps })
    });
    assert.equal(expRes.status, 200);
    assert.match(expRes.headers['content-disposition'], /attachment; filename="orbs-orb-1-custom\.html"/);
    assert.match(expRes.text, /<title>Exported Orb Title<\/title>/);
    assert.equal(srv.db.getExportCount(payRes.json.licenseKey), 1);

    // Raw /designs/ HTML & React TSX also accessible with valid license
    const rawRes = await request(srv.baseUrl, '/designs/orbs/orb%201/index.html', {
      headers: { Cookie: cookie }
    });
    assert.equal(rawRes.status, 200);
    const rawTsx = await request(srv.baseUrl, '/designs/orbs/orb%201/Orb1.tsx', {
      headers: { Cookie: cookie }
    });
    assert.equal(rawTsx.status, 200);
    assert.match(rawTsx.text, /'use client'/);
    assert.match(rawTsx.text, /export function Orb1/);

    // /api/source and /api/export-html also compile customized React TypeScript (.tsx)
    const tsxSrcRes = await request(srv.baseUrl, '/api/source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ id: 'orbs__orb-1', format: 'tsx', controlParameterSet: customCps })
    });
    assert.equal(tsxSrcRes.status, 200);
    assert.equal(tsxSrcRes.json.format, 'tsx');
    assert.equal(tsxSrcRes.json.filename, 'Orb1.tsx');
    assert.match(tsxSrcRes.json.tsx, /Exported Orb Title/);
    assert.match(tsxSrcRes.json.tsx, /export interface Orb1Props/);

    const tsxExpRes = await request(srv.baseUrl, '/api/export-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ id: 'orbs__orb-1', format: 'tsx', controlParameterSet: customCps })
    });
    assert.equal(tsxExpRes.status, 200);
    assert.match(tsxExpRes.headers['content-disposition'], /Orb1\.tsx/);
    assert.match(tsxExpRes.text, /export function Orb1/);

    // Editable Figma endpoints: blocked without cookie (402), unlocked with paid cookie
    const lockedFigma = await request(srv.baseUrl, '/api/figma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'orbs__orb-1' })
    });
    assert.equal(lockedFigma.status, 402);

    const figmaRes = await request(srv.baseUrl, '/api/figma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ id: 'orbs__orb-1', preset: 'desktop', controlParameterSet: customCps })
    });
    assert.equal(figmaRes.status, 200);
    assert.equal(figmaRes.json.filenameSvg, 'Orb1-figma.svg');
    assert.match(figmaRes.json.svg, /<svg id="Orb1_Frame"/);
    assert.match(figmaRes.json.svg, /Exported Orb Title/);
    assert.match(figmaRes.json.tokensJson, /"framevault"/);

    const figmaDownload = await request(srv.baseUrl, '/api/export-figma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ id: 'orbs__orb-1', format: 'svg', preset: 'card', controlParameterSet: customCps })
    });
    assert.equal(figmaDownload.status, 200);
    assert.match(figmaDownload.headers['content-disposition'], /Orb1-figma\.svg/);
    assert.equal(figmaDownload.headers['content-type'], 'image/svg+xml; charset=utf-8');
  } finally {
    await srv.close();
  }
});

test('production / Stripe mode disables demo checkout and enforces Stripe webhooks + restore + refunds', async () => {
  const webhookSecret = 'whsec_test_secret_1234567890';
  const srv = await startTestServer({
    NODE_ENV: 'production',
    STRIPE_SECRET_KEY: 'sk_test_fake_key',
    STRIPE_WEBHOOK_SECRET: webhookSecret
  });

  try {
    // Demo checkout MUST be rejected with 403
    const demoAttempt = await request(srv.baseUrl, '/api/checkout/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'attacker@evil.dev',
        cardholder: 'Free Rider',
        cardNumber: '4242 4242 4242 4242',
        expiry: '12 / 28',
        cvc: '424'
      })
    });
    assert.equal(demoAttempt.status, 403);

    // Webhook rejects invalid signature
    const checkoutEvent = JSON.stringify({
      id: 'evt_checkout_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_live_abc123',
          payment_status: 'paid',
          amount_total: 499,
          currency: 'usd',
          payment_intent: 'pi_live_999',
          customer_details: { email: 'realbuyer@example.com' }
        }
      }
    });

    const badSigRes = await request(srv.baseUrl, '/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=12345,v1=deadbeef'
      },
      body: checkoutEvent
    });
    assert.equal(badSigRes.status, 400);

    // Webhook accepts valid signed event and issues license in SQLite
    const validSig = signStripeWebhookPayload(checkoutEvent, webhookSecret);
    const okWebhookRes = await request(srv.baseUrl, '/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': validSig
      },
      body: checkoutEvent
    });
    assert.equal(okWebhookRes.status, 200);
    assert.equal(okWebhookRes.json.received, true);

    // Replaying exact same event is idempotent
    const dupWebhookRes = await request(srv.baseUrl, '/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': validSig
      },
      body: checkoutEvent
    });
    assert.equal(dupWebhookRes.status, 200);
    assert.equal(dupWebhookRes.json.duplicate, true);

    const issuedLicense = srv.db.findLicenseByExternalId('cs_live_abc123');
    assert.ok(issuedLicense);
    assert.equal(issuedLicense.email, 'realbuyer@example.com');
    assert.equal(issuedLicense.active, true);

    // Restore license on a new browser with wrong email fails (403)
    const wrongEmailRestore = await request(srv.baseUrl, '/api/license/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey: issuedLicense.licenseKey,
        email: 'wrong@example.com'
      })
    });
    assert.equal(wrongEmailRestore.status, 403);

    // Restore with matching email succeeds and sets Secure cookie (NODE_ENV=production)
    const restoreRes = await request(srv.baseUrl, '/api/license/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey: issuedLicense.licenseKey,
        email: 'realbuyer@example.com'
      })
    });
    assert.equal(restoreRes.status, 200);
    assert.equal(restoreRes.json.unlocked, true);
    const rawSetCookie = String(restoreRes.headers['set-cookie']);
    assert.match(rawSetCookie, /HttpOnly/);
    assert.match(rawSetCookie, /Secure/);

    const cookie = extractCookie(restoreRes.headers['set-cookie']);

    // Locking on this device clears cookie WITHOUT revoking a paid Stripe license
    const lockRes = await request(srv.baseUrl, '/api/license/lock', {
      method: 'POST',
      headers: { Cookie: cookie }
    });
    assert.equal(lockRes.status, 200);
    assert.ok(srv.db.findActiveLicenseByKey(issuedLicense.licenseKey), 'Paid Stripe license should stay active');

    // Refund webhook automatically revokes the license
    const refundEvent = JSON.stringify({
      id: 'evt_refund_1',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_live_999',
          payment_intent: 'pi_live_999'
        }
      }
    });
    const refundSig = signStripeWebhookPayload(refundEvent, webhookSecret);
    const refundRes = await request(srv.baseUrl, '/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': refundSig
      },
      body: refundEvent
    });
    assert.equal(refundRes.status, 200);
    assert.equal(srv.db.findActiveLicenseByKey(issuedLicense.licenseKey), null);

    // Previously issued cookie is now immediately rejected
    const afterRefundStatus = await request(srv.baseUrl, '/api/access-status', {
      headers: { Cookie: cookie }
    });
    assert.equal(afterRefundStatus.status, 200);
    assert.equal(afterRefundStatus.json.unlocked, false);
  } finally {
    await srv.close();
  }
});

test('rate limiting protects license restore endpoint from brute force', async () => {
  const srv = await startTestServer({ NODE_ENV: 'development' });
  try {
    let hit429 = false;
    for (let i = 0; i < 12; i++) {
      const res = await request(srv.baseUrl, '/api/license/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: 'OK-PRO-0000-0000-0000-0000' })
      });
      if (res.status === 429) {
        hit429 = true;
        assert.ok(res.headers['retry-after']);
        break;
      }
    }
    assert.equal(hit429, true, 'Expected 429 Too Many Requests after exceeding restore rate limit');
  } finally {
    await srv.close();
  }
});

test('SQLite file persistence survives restart and serves /api/mcp-info + design assets', async () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'originkit-db-'));
  const dbPath = path.join(tmpDir, 'originkit.sqlite');

  try {
    // 1. First server instance issues a license and writes to SQLite on disk
    const srv1 = createAppServer({
      NODE_ENV: 'development',
      DATABASE_PATH: dbPath,
      ORIGINKIT_SECRET: 'persist-test-secret-0123456789abcdef'
    });
    const issued = srv1.db.issueLicense({
      email: 'persist@studio.dev',
      method: 'stripe',
      externalId: 'cs_persist_1'
    });
    assert.equal(issued.created, true);

    // Verify /api/mcp-info works and redacts MCP config & SKILL.md when unpaid
    const mcpRes = await request(srv1.server, '/api/mcp-info');
    assert.equal(mcpRes.status, 200);
    assert.equal(mcpRes.json.ready, true);
    assert.equal(mcpRes.json.locked, true);
    assert.equal(mcpRes.json.skillMarkdown, '');
    assert.ok(mcpRes.json.indexedCount >= 50);

    // Verify carousel image asset under /designs/ is served cleanly
    const imgRes = await request(srv1.server, '/designs/carasols/carasol%201/images/1.jpg');
    assert.equal(imgRes.status, 200);
    assert.equal(imgRes.headers['content-type'], 'image/jpeg');

    srv1.shutdown();

    // 2. Second server instance reopens same SQLite file and still finds the license
    const srv2 = createAppServer({
      NODE_ENV: 'development',
      DATABASE_PATH: dbPath,
      ORIGINKIT_SECRET: 'persist-test-secret-0123456789abcdef'
    });
    const found = srv2.db.findActiveLicenseByKey(issued.license.licenseKey);
    assert.ok(found);
    assert.equal(found.email, 'persist@studio.dev');
    srv2.shutdown();
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('performance: Brotli compression, ETag 304, lite catalog, and lazy /api/component/:id/params', async () => {
  const srv = await startTestServer({ NODE_ENV: 'development' });
  try {
    // 1. Lite components-data.js is dramatically smaller (< 30 KB raw) and supports Brotli + ETag 304
    const rawCatalog = await request(srv.baseUrl, '/components-data.js');
    assert.equal(rawCatalog.status, 200);
    assert.ok(Buffer.byteLength(rawCatalog.text, 'utf8') < 30_000, 'Lite catalog should be under 30 KB');
    assert.ok(rawCatalog.headers.etag);

    const brCatalog = await request(srv.baseUrl, '/components-data.js', {
      headers: { 'Accept-Encoding': 'br, gzip' }
    });
    assert.equal(brCatalog.status, 200);
    assert.equal(brCatalog.headers['content-encoding'], 'br');
    assert.ok(Number(brCatalog.headers['content-length']) < 8000, 'Brotli catalog should be under 8 KB');

    const notModified = await request(srv.baseUrl, '/components-data.js', {
      headers: { 'If-None-Match': rawCatalog.headers.etag }
    });
    assert.equal(notModified.status, 304);

    // 2. Lazy params endpoint serves full controlParameterSet on demand
    const paramsRes = await request(srv.baseUrl, '/api/component/orbs__orb-1/params');
    assert.equal(paramsRes.status, 200);
    assert.equal(paramsRes.json.id, 'orbs__orb-1');
    assert.ok(paramsRes.json.controlParameterSet?.speeds?.animationSpeed);

    // 3. Cached default iframe preview supports Brotli + ETag 304
    const prev1 = await request(srv.baseUrl, '/api/preview/orbs__orb-1', {
      headers: { 'Sec-Fetch-Dest': 'iframe', 'Accept-Encoding': 'br' }
    });
    assert.equal(prev1.status, 200);
    assert.equal(prev1.headers['content-encoding'], 'br');
    assert.ok(prev1.headers.etag);

    const prev304 = await request(srv.baseUrl, '/api/preview/orbs__orb-1', {
      headers: { 'Sec-Fetch-Dest': 'iframe', 'If-None-Match': prev1.headers.etag }
    });
    assert.equal(prev304.status, 304);
  } finally {
    await srv.close();
  }
});

test('Razorpay mode: disables demo checkout, verifies HMAC payment & webhook, and revokes on refund', async () => {
  const keySecret = 'rzp_test_secret_987654321';
  const webhookSecret = 'rzp_whsec_test_123456789';

  const srv = await startTestServer(
    {
      NODE_ENV: 'development',
      RAZORPAY_KEY_ID: 'rzp_test_framevault01',
      RAZORPAY_KEY_SECRET: keySecret,
      RAZORPAY_WEBHOOK_SECRET: webhookSecret,
      LICENSE_CURRENCY: 'INR',
      LICENSE_PRICE_CENTS: '39900'
    },
    {
      razorpay: {
        createOrder: async (cfg, opts) => ({
          id: 'order_TestOrder001',
          amount: cfg.licensePriceCents,
          currency: cfg.licenseCurrency,
          notes: { email: opts.email }
        }),
        fetchPayment: async (paymentId) => ({
          id: paymentId,
          order_id: 'order_TestOrder001',
          amount: 39900,
          currency: 'INR',
          status: 'captured',
          email: 'buyer@framevault.in'
        })
      }
    }
  );

  try {
    // 1. Access status reports Razorpay enabled, INR price formatted, demo disabled
    const status = await request(srv.baseUrl, '/api/access-status');
    assert.equal(status.status, 200);
    assert.equal(status.json.razorpayConfigured, true);
    assert.equal(status.json.demoCheckoutEnabled, false);
    assert.equal(status.json.price, '₹399');
    assert.equal(status.json.currency, 'INR');

    // 2. Demo card checkout is blocked (403) when Razorpay is configured
    const demoBlocked = await request(srv.baseUrl, '/api/checkout/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bypass@evil.dev' })
    });
    assert.equal(demoBlocked.status, 403);

    // 3. Checkout session creates a Razorpay order
    const orderRes = await request(srv.baseUrl, '/api/checkout/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'buyer@framevault.in' })
    });
    assert.equal(orderRes.status, 200);
    assert.equal(orderRes.json.mode, 'razorpay');
    assert.equal(orderRes.json.orderId, 'order_TestOrder001');
    assert.equal(orderRes.json.amount, 39900);
    assert.equal(orderRes.json.currency, 'INR');

    // 4. Forged Razorpay signature is rejected (400)
    const badVerify = await request(srv.baseUrl, '/api/checkout/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_TestOrder001',
        razorpay_payment_id: 'pay_TestPay001',
        razorpay_signature: 'deadbeef'
      })
    });
    assert.equal(badVerify.status, 400);

    // 5. Valid HMAC-SHA256 payment signature issues license & unlocks downloads
    const validSig = crypto
      .createHmac('sha256', keySecret)
      .update('order_TestOrder001|pay_TestPay001')
      .digest('hex');

    const okVerify = await request(srv.baseUrl, '/api/checkout/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_TestOrder001',
        razorpay_payment_id: 'pay_TestPay001',
        razorpay_signature: validSig,
        email: 'buyer@framevault.in'
      })
    });
    assert.equal(okVerify.status, 200);
    assert.equal(okVerify.json.unlocked, true);
    assert.equal(okVerify.json.method, 'razorpay');
    assert.ok(okVerify.json.licenseKey.startsWith('OK-PRO-'));
    const cookieHeader = String(okVerify.headers['set-cookie'] || '').split(';')[0];
    assert.ok(cookieHeader.includes('ok_access='));

    // 6. Webhook: invalid signature rejected (400)
    const capturePayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_WebhookPay002',
            order_id: 'order_WebhookOrder002',
            amount: 39900,
            currency: 'INR',
            email: 'webhookbuyer@framevault.in'
          }
        }
      }
    });
    const badWh = await request(srv.baseUrl, '/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': 'invalid'
      },
      body: capturePayload
    });
    assert.equal(badWh.status, 400);

    // 7. Webhook: valid payment.captured fulfills & duplicate is idempotent
    const captureSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(capturePayload, 'utf8')
      .digest('hex');

    const okWh = await request(srv.baseUrl, '/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': captureSig,
        'X-Razorpay-Event-Id': 'evt_rzp_capture_002'
      },
      body: capturePayload
    });
    assert.equal(okWh.status, 200);
    assert.equal(okWh.json.received, true);
    assert.ok(srv.db.findLicenseByExternalId('order_WebhookOrder002')?.active);

    const dupWh = await request(srv.baseUrl, '/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': captureSig,
        'X-Razorpay-Event-Id': 'evt_rzp_capture_002'
      },
      body: capturePayload
    });
    assert.equal(dupWh.status, 200);
    assert.equal(dupWh.json.duplicate, true);

    // 8. Webhook: refund.processed revokes the license immediately
    const refundPayload = JSON.stringify({
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: 'rfnd_Test001',
            payment_id: 'pay_TestPay001'
          }
        }
      }
    });
    const refundSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(refundPayload, 'utf8')
      .digest('hex');

    const refundRes = await request(srv.baseUrl, '/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': refundSig,
        'X-Razorpay-Event-Id': 'evt_rzp_refund_001'
      },
      body: refundPayload
    });
    assert.equal(refundRes.status, 200);

    const afterRefund = await request(srv.baseUrl, '/api/access-status', {
      headers: { Cookie: cookieHeader }
    });
    assert.equal(afterRefund.json.unlocked, false);
  } finally {
    await srv.close();
  }
});

test('Remote Streamable HTTP MCP (/api/mcp) requires license Bearer key and serves remote config when PUBLIC_URL is set', async () => {
  const srv = await startTestServer({
    NODE_ENV: 'development',
    PUBLIC_URL: 'https://framevault.dev'
  });

  try {
    // 1. Unauthenticated /api/mcp request is rejected with 401
    const unauthRes = await request(srv.baseUrl, '/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' })
    });
    assert.equal(unauthRes.status, 401);

    // 2. Issue a paid license
    const { license } = srv.db.issueLicense({
      email: 'remote@framevault.dev',
      method: 'razorpay',
      externalId: 'order_remote_mcp_1',
      paymentIntentId: 'pay_remote_mcp_1'
    });

    // 3. Authenticated initialize + tools/list + get_component (tsx) + resources/read
    const initRes = await request(srv.baseUrl, '/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${license.licenseKey}`
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' })
    });
    assert.equal(initRes.status, 200);
    assert.equal(initRes.json.result.serverInfo.name, 'framevault-ui-mcp');

    const getTsxRes = await request(srv.baseUrl, '/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${license.licenseKey}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'get_component', arguments: { id: 'orbs/orb-1', format: 'tsx' } }
      })
    });
    assert.equal(getTsxRes.status, 200);
    assert.match(getTsxRes.json.result.content[0].text, /export function Orb1/);

    const guideRes = await request(srv.baseUrl, '/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${license.licenseKey}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'resources/read',
        params: { uri: 'ui://guidelines/design-system' }
      })
    });
    assert.equal(guideRes.status, 200);
    assert.match(guideRes.json.result.contents[0].text, /FrameVault UI Design System Guidelines/);

    // 4. Paid /api/mcp-info returns universal remote URL config (no local C:\ paths!)
    const restoreRes = await request(srv.baseUrl, '/api/license/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: license.licenseKey, email: 'remote@framevault.dev' })
    });
    const cookie = String(restoreRes.headers['set-cookie'] || '').split(';')[0];

    const mcpInfoRes = await request(srv.baseUrl, '/api/mcp-info', {
      headers: { Cookie: cookie }
    });
    assert.equal(mcpInfoRes.status, 200);
    assert.equal(mcpInfoRes.json.transport, 'streamable-http');
    assert.equal(mcpInfoRes.json.remoteMcpUrl, 'https://framevault.dev/api/mcp');
    assert.match(mcpInfoRes.json.configs.claude.json, /https:\/\/framevault\.dev\/api\/mcp/);
    assert.match(mcpInfoRes.json.configs.claude.json, new RegExp(license.licenseKey));
  } finally {
    await srv.close();
  }
});

test('Turso cloud SQLite sync persists licenses & revocations across ephemeral Render Free Tier restarts', async () => {
  const http = require('node:http');
  const { DatabaseSync } = require('node:sqlite');

  // Mock Turso Hrana HTTP v2 server backed by an in-memory SQLite DB
  const cloudDb = new DatabaseSync(':memory:');
  const expectedToken = 'turso_test_token_abc123';

  const mockTurso = http.createServer((req, res) => {
    if (req.url !== '/v2/pipeline' || req.method !== 'POST') {
      res.writeHead(404);
      return res.end('not found');
    }
    if (req.headers.authorization !== `Bearer ${expectedToken}`) {
      res.writeHead(401);
      return res.end('unauthorized');
    }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const results = [];
      for (const item of body.requests || []) {
        if (item.type === 'close') {
          results.push({ type: 'ok', response: { type: 'close' } });
          continue;
        }
        const sql = item.stmt.sql;
        const args = (item.stmt.args || []).map(a => {
          if (a.type === 'null') return null;
          if (a.type === 'integer') return Number(a.value);
          if (a.type === 'float') return Number(a.value);
          return a.value;
        });
        try {
          if (/^\s*SELECT\b/i.test(sql)) {
            const rows = cloudDb.prepare(sql).all(...args);
            const colNames = rows.length > 0 ? Object.keys(rows[0]) : [];
            results.push({
              type: 'ok',
              response: {
                type: 'execute',
                result: {
                  cols: colNames.map(name => ({ name })),
                  rows: rows.map(r =>
                    colNames.map(c => {
                      const v = r[c];
                      if (v === null || v === undefined) return { type: 'null' };
                      if (typeof v === 'number') return { type: 'integer', value: String(v) };
                      return { type: 'text', value: String(v) };
                    })
                  )
                }
              }
            });
          } else {
            if (args.length > 0) cloudDb.prepare(sql).run(...args);
            else cloudDb.exec(sql);
            results.push({
              type: 'ok',
              response: { type: 'execute', result: { cols: [], rows: [] } }
            });
          }
        } catch (err) {
          results.push({ type: 'error', error: { message: err.message } });
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ results }));
    });
  });

  await new Promise(resolve => mockTurso.listen(0, '127.0.0.1', resolve));
  const { port } = mockTurso.address();
  const tursoUrl = `http://127.0.0.1:${port}`;

  try {
    // Boot #1: fresh ephemeral :memory: DB issues 2 licenses and revokes 1
    const srv1 = await startTestServer({
      TURSO_DATABASE_URL: tursoUrl,
      TURSO_AUTH_TOKEN: expectedToken
    });
    await srv1.db.ready;
    const lic1 = srv1.db.issueLicense({
      email: 'kept@framevault.dev',
      method: 'razorpay',
      externalId: 'order_turso_1',
      paymentIntentId: 'pay_turso_1'
    }).license;
    const lic2 = srv1.db.issueLicense({
      email: 'refunded@framevault.dev',
      method: 'razorpay',
      externalId: 'order_turso_2',
      paymentIntentId: 'pay_turso_2'
    }).license;
    srv1.db.revokeLicenseByPaymentIntent('pay_turso_2');
    await srv1.db.flush();
    await srv1.close();

    // Boot #2: brand-new empty :memory: DB (simulating Render Free Tier wipe) hydrates from Turso
    const srv2 = await startTestServer({
      TURSO_DATABASE_URL: tursoUrl,
      TURSO_AUTH_TOKEN: expectedToken
    });
    const hydrateInfo = await srv2.db.ready;
    assert.equal(hydrateInfo.hydrated, true);
    assert.equal(hydrateInfo.licenseCount, 2);

    const restored1 = srv2.db.findActiveLicenseByKey(lic1.licenseKey);
    assert.ok(restored1, 'Paid license should survive ephemeral container wipe via Turso');
    assert.equal(restored1.email, 'kept@framevault.dev');

    const restored2 = srv2.db.findActiveLicenseByKey(lic2.licenseKey);
    assert.equal(restored2, null, 'Revoked license must remain revoked after Turso hydration');

    const health = await request(srv2.baseUrl, '/api/health');
    assert.equal(health.json.db, 'sqlite+turso');
    assert.equal(health.json.tursoHydrated, true);

    await srv2.close();
  } finally {
    mockTurso.close();
    cloudDb.close();
  }
});
