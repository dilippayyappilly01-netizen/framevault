const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const { createConfig } = require('./backend/config');
const { createDatabase } = require('./backend/db');
const {
  isRequestSecure,
  buildAccessCookieHeader,
  buildClearCookieHeader,
  verifyLicenseFromRequest
} = require('./backend/auth');
const { RateLimiter, getClientIp } = require('./backend/rateLimit');
const {
  resolveOrigin,
  createCheckoutSession,
  fetchCheckoutSession,
  verifyWebhookSignature
} = require('./backend/stripe');
const razorpayDefault = require('./backend/razorpay');
const { sendLicenseReceiptEmail } = require('./backend/email');
const { loadCatalog, compileComponentHtml, makeCompressedAsset } = require('./backend/compiler');
const { convertHtmlToReactTsx } = require('./backend/reactConverter');
const { buildFigmaBundle } = require('./backend/figmaExporter');
const { handleMcpJsonRpc } = require('./backend/remoteMcp');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.tsx': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2'
};

const PUBLIC_ROOT_FILES = new Set(['/index.html', '/styles.css', '/app.js']);
const ALLOWED_DESIGN_ASSET_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.mp4',
  '.woff2',
  '.html',
  '.tsx'
]);

const SENSITIVE_PREFIXES = [
  '/.',
  '/backend',
  '/data',
  '/test',
  '/scripts',
  '/mcp-server',
  '/node_modules'
];
const SENSITIVE_FILES = new Set([
  '/server.js',
  '/start.bat',
  '/package.json',
  '/package-lock.json',
  '/orb-1-adapted.html'
]);

function applySecurityHeaders(req, res, config, extra = {}) {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...extra
  };
  if (isRequestSecure(req, config)) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return headers;
}

function pickEncoding(req) {
  const ae = String(req.headers['accept-encoding'] || '').toLowerCase();
  if (ae.includes('br')) return 'br';
  if (ae.includes('gzip')) return 'gzip';
  return null;
}

function sendCompressedAsset(req, res, config, asset, contentType, extraHeaders = {}) {
  const ifNoneMatch = String(req.headers['if-none-match'] || '').trim();
  if (ifNoneMatch && asset.etag && ifNoneMatch === asset.etag) {
    res.writeHead(
      304,
      applySecurityHeaders(req, res, config, {
        ETag: asset.etag,
        Vary: 'Accept-Encoding',
        ...extraHeaders
      })
    );
    return res.end();
  }

  const enc = pickEncoding(req);
  const body = enc === 'br' ? asset.br : enc === 'gzip' ? asset.gzip : asset.raw;
  const headers = {
    'Content-Type': contentType,
    'Content-Length': body.length,
    ETag: asset.etag,
    Vary: 'Accept-Encoding',
    ...extraHeaders
  };
  if (enc) headers['Content-Encoding'] = enc;

  res.writeHead(200, applySecurityHeaders(req, res, config, headers));
  return res.end(req.method === 'HEAD' ? undefined : body);
}

function sendJson(req, res, config, status, data, extraHeaders = {}) {
  const raw = Buffer.from(JSON.stringify(data), 'utf8');
  const enc = raw.length >= 1024 ? pickEncoding(req) : null;
  let body = raw;
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders
  };
  if (enc === 'br') {
    body = zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } });
    headers['Content-Encoding'] = 'br';
    headers.Vary = 'Accept-Encoding';
  } else if (enc === 'gzip') {
    body = zlib.gzipSync(raw, { level: 5 });
    headers['Content-Encoding'] = 'gzip';
    headers.Vary = 'Accept-Encoding';
  }
  headers['Content-Length'] = body.length;
  res.writeHead(status, applySecurityHeaders(req, res, config, headers));
  res.end(body);
}

function readRawBody(req, maxBytes = 6 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        const err = new Error('Payload too large');
        err.statusCode = 413;
        reject(err);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJsonBody(req, maxBytes = 6 * 1024 * 1024) {
  const rawBuf = await readRawBody(req, maxBytes);
  if (rawBuf.length === 0) return {};
  try {
    return JSON.parse(rawBuf.toString('utf8'));
  } catch (_) {
    const err = new Error('Invalid JSON body');
    err.statusCode = 400;
    throw err;
  }
}

function createPreviewStore(maxEntries = 120, ttlMs = 60_000) {
  const map = new Map();

  function set(compId, controlParameterSet) {
    const now = Date.now();
    for (const [k, v] of map.entries()) {
      if (now - v.createdAt > ttlMs) map.delete(k);
    }
    while (map.size >= maxEntries) {
      const oldestKey = map.keys().next().value;
      map.delete(oldestKey);
    }
    const token = crypto.randomBytes(16).toString('hex');
    map.set(token, { compId, controlParameterSet, createdAt: now });
    return token;
  }

  function get(token, compId) {
    if (!token) return null;
    const entry = map.get(token);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > ttlMs || entry.compId !== compId) {
      map.delete(token);
      return null;
    }
    return entry.controlParameterSet;
  }

  return { set, get, clear: () => map.clear() };
}

function createAppServer(configOverrides = {}, deps = {}) {
  const rootDir = __dirname;
  const config = createConfig(rootDir, configOverrides);
  const razorpay = { ...razorpayDefault, ...(deps.razorpay || {}) };
  const db = createDatabase(config);
  const catalog = loadCatalog(config.catalogFile);
  const rateLimiter = new RateLimiter();
  const previewStore = createPreviewStore();
  const staticAssetCache = new Map();
  let mcpInfoCache = null;
  const startedAt = Date.now();

  function getCachedStaticFile(resolvedPath) {
    const stat = fs.statSync(resolvedPath);
    if (!stat.isFile()) return null;
    const prev = staticAssetCache.get(resolvedPath);
    if (prev && prev.mtimeMs === stat.mtimeMs && prev.size === stat.size) {
      return prev.asset;
    }
    const asset = makeCompressedAsset(fs.readFileSync(resolvedPath));
    staticAssetCache.set(resolvedPath, { mtimeMs: stat.mtimeMs, size: stat.size, asset });
    return asset;
  }

  function enforceRateLimit(req, res, bucketName, limit, windowMs) {
    const ip = getClientIp(req, config.trustProxy);
    const result = rateLimiter.check(`${bucketName}:${ip}`, limit, windowMs);
    if (!result.allowed) {
      sendJson(
        req,
        res,
        config,
        429,
        { error: 'Too many requests. Please wait and try again.' },
        { 'Retry-After': String(result.retryAfterSec) }
      );
      return false;
    }
    return true;
  }

  async function handleApi(req, res, safeUrl, fullUrl) {
    // 1. Health check
    if (safeUrl === '/api/health' && req.method === 'GET') {
      return sendJson(req, res, config, 200, {
        ok: true,
        db: 'sqlite',
        components: catalog.components.length,
        sections: catalog.sections.length,
        stripeConfigured: config.stripeConfigured,
        webhookConfigured: config.webhookConfigured,
        razorpayConfigured: config.razorpayConfigured,
        razorpayWebhookConfigured: config.razorpayWebhookConfigured,
        currency: config.licenseCurrency,
        demoCheckoutEnabled: config.demoCheckoutEnabled,
        emailConfigured: Boolean(config.resendApiKey),
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000)
      }, { 'Cache-Control': 'no-store' });
    }

    // 2. Access status + idempotent Stripe Checkout redirect verification
    if (safeUrl === '/api/access-status' && req.method === 'GET') {
      const querySessionId = fullUrl.searchParams.get('session_id');
      let license = verifyLicenseFromRequest(req, db);
      let newCookieHeader = null;

      if (!license && config.stripeConfigured && querySessionId) {
        if (!enforceRateLimit(req, res, 'stripe-verify', 20, 15 * 60_000)) return;
        try {
          // Check DB first for idempotency (e.g. already issued by webhook or earlier redirect)
          const existing = db.findLicenseByExternalId(querySessionId);
          if (existing && existing.active) {
            license = existing;
            newCookieHeader = buildAccessCookieHeader(license.licenseKey, req, config, db.signingSecret);
          } else if (!existing) {
            const session = await fetchCheckoutSession(querySessionId, config);
            if (
              session.payment_status === 'paid' &&
              Number(session.amount_total) >= config.licensePriceCents
            ) {
              const issued = db.issueLicense({
                email: session.customer_details?.email || session.customer_email || 'stripe-customer@framevault.dev',
                amountCents: Number(session.amount_total) || config.licensePriceCents,
                currency: session.currency || 'usd',
                method: 'stripe',
                externalId: session.id,
                paymentIntentId: typeof session.payment_intent === 'string'
                  ? session.payment_intent
                  : session.payment_intent?.id || null
              });
              license = issued.license;
              newCookieHeader = buildAccessCookieHeader(license.licenseKey, req, config, db.signingSecret);
              if (issued.created) {
                sendLicenseReceiptEmail(config, license).catch(() => {});
              }
            }
          }
        } catch (_) {
          // Keep unlocked: false if Stripe verification fails
        }
      }

      const headers = { 'Cache-Control': 'no-store' };
      if (newCookieHeader) headers['Set-Cookie'] = newCookieHeader;

      return sendJson(req, res, config, 200, {
        unlocked: Boolean(license),
        priceCents: config.licensePriceCents,
        currency: config.licenseCurrency,
        price: config.licensePriceDisplay,
        stripeConfigured: config.stripeConfigured,
        razorpayConfigured: config.razorpayConfigured,
        demoCheckoutEnabled: config.demoCheckoutEnabled,
        emailConfigured: Boolean(config.resendApiKey),
        licenseKey: license ? license.licenseKey : null,
        email: license ? license.email : null,
        method: license ? license.method : null
      }, headers);
    }

    // 3. Create Checkout Session (Stripe when configured, local demo only when allowed)
    if (safeUrl === '/api/checkout/session' && req.method === 'POST') {
      if (!enforceRateLimit(req, res, 'checkout-session', 20, 15 * 60_000)) return;

      let body = {};
      try {
        body = await readJsonBody(req, 16 * 1024);
      } catch (err) {
        return sendJson(req, res, config, err.statusCode || 400, { error: err.message });
      }

      if (config.razorpayConfigured) {
        const email = String(body.email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return sendJson(req, res, config, 400, {
            error: 'Enter a valid email address for your license receipt.'
          });
        }
        try {
          const order = await razorpay.createOrder(config, { email });
          return sendJson(req, res, config, 200, {
            mode: 'razorpay',
            keyId: config.razorpayKeyId,
            orderId: order.id,
            amount: Number(order.amount) || config.licensePriceCents,
            currency: order.currency || config.licenseCurrency,
            price: config.licensePriceDisplay,
            name: 'FrameVault',
            description: 'FrameVault All-Access Component Library (50 Components)',
            email
          });
        } catch (err) {
          return sendJson(req, res, config, 502, {
            error: err.message || 'Unable to reach Razorpay API'
          });
        }
      }

      if (config.stripeConfigured) {
        try {
          const session = await createCheckoutSession(req, config, { email: body.email });
          return sendJson(req, res, config, 200, { mode: 'stripe', checkoutUrl: session.url });
        } catch (err) {
          return sendJson(req, res, config, 502, { error: err.message || 'Unable to reach Stripe API' });
        }
      }

      if (!config.demoCheckoutEnabled) {
        return sendJson(req, res, config, 503, {
          error: 'Payments are not configured yet. Please set RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET or STRIPE_SECRET_KEY on the server.'
        });
      }

      return sendJson(req, res, config, 200, {
        mode: 'local',
        amountCents: config.licensePriceCents,
        price: config.licensePriceDisplay
      });
    }

    // 4. Local Demo Checkout (STRICTLY disabled when Stripe is configured or NODE_ENV=production)
    if (safeUrl === '/api/checkout/complete' && req.method === 'POST') {
      if (!config.demoCheckoutEnabled) {
        return sendJson(req, res, config, 403, {
          error: 'Demo checkout is disabled in production. Complete payment via Stripe Checkout.'
        });
      }
      if (!enforceRateLimit(req, res, 'checkout-demo', 15, 15 * 60_000)) return;

      let body;
      try {
        body = await readJsonBody(req, 64 * 1024);
      } catch (err) {
        return sendJson(req, res, config, err.statusCode || 400, { error: err.message });
      }

      const email = String(body.email || '').trim().toLowerCase();
      const cardholder = String(body.cardholder || '').trim();
      const digits = String(body.cardNumber || '').replace(/\D/g, '');
      const expiry = String(body.expiry || '').trim();
      const cvc = String(body.cvc || '').replace(/\D/g, '');

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(req, res, config, 400, { error: 'Enter a valid email address for your receipt.' });
      }
      if (cardholder.length < 2) {
        return sendJson(req, res, config, 400, { error: 'Enter the cardholder name.' });
      }
      if (digits.length < 13 || digits.length > 19) {
        return sendJson(req, res, config, 400, { error: 'Enter a valid 16-digit card number.' });
      }
      if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(expiry)) {
        return sendJson(req, res, config, 400, { error: 'Enter expiry in MM / YY format.' });
      }
      if (cvc.length < 3 || cvc.length > 4) {
        return sendJson(req, res, config, 400, { error: 'Enter a valid 3 or 4 digit CVC.' });
      }

      const { license } = db.issueLicense({
        email,
        amountCents: config.licensePriceCents,
        currency: 'usd',
        method: 'demo-card',
        externalId: null
      });
      const cookie = buildAccessCookieHeader(license.licenseKey, req, config, db.signingSecret);

      return sendJson(req, res, config, 200, {
        unlocked: true,
        price: config.licensePriceDisplay,
        licenseKey: license.licenseKey,
        email: license.email,
        method: license.method
      }, { 'Set-Cookie': cookie });
    }

    // 4B. Razorpay Payment Verification (HMAC-SHA256 signature + Razorpay API check + idempotent license)
    if (safeUrl === '/api/checkout/razorpay/verify' && req.method === 'POST') {
      if (!config.razorpayConfigured) {
        return sendJson(req, res, config, 503, { error: 'Razorpay is not configured on the server.' });
      }
      if (!enforceRateLimit(req, res, 'razorpay-verify', 20, 15 * 60_000)) return;

      let body;
      try {
        body = await readJsonBody(req, 32 * 1024);
      } catch (err) {
        return sendJson(req, res, config, err.statusCode || 400, { error: err.message });
      }

      const orderId = String(body.razorpay_order_id || '').trim();
      const paymentId = String(body.razorpay_payment_id || '').trim();
      const signature = String(body.razorpay_signature || '').trim();
      const fallbackEmail = String(body.email || '').trim().toLowerCase();

      const sigCheck = razorpay.verifyPaymentSignature(
        orderId,
        paymentId,
        signature,
        config.razorpayKeySecret
      );
      if (!sigCheck.valid) {
        return sendJson(req, res, config, 400, { error: sigCheck.error });
      }

      let license = db.findLicenseByExternalId(orderId);
      if (license && !license.active) {
        return sendJson(req, res, config, 403, { error: 'License for this order has been revoked.' });
      }

      if (!license) {
        let payment;
        try {
          payment = await razorpay.fetchPayment(paymentId, config);
        } catch (err) {
          return sendJson(req, res, config, 502, {
            error: err.message || 'Unable to verify payment with Razorpay.'
          });
        }

        const validStatus = payment.status === 'captured' || payment.status === 'authorized';
        const validOrder = !payment.order_id || payment.order_id === orderId;
        const validAmount = Number(payment.amount) >= config.licensePriceCents;
        if (!validStatus || !validOrder || !validAmount) {
          return sendJson(req, res, config, 400, {
            error: 'Razorpay payment status or amount could not be verified.'
          });
        }

        const verifiedEmail =
          payment.email ||
          payment.notes?.email ||
          fallbackEmail ||
          'razorpay-customer@framevault.dev';

        const issued = db.issueLicense({
          email: verifiedEmail,
          amountCents: Number(payment.amount) || config.licensePriceCents,
          currency: String(payment.currency || config.licenseCurrency).toLowerCase(),
          method: 'razorpay',
          externalId: orderId,
          paymentIntentId: paymentId
        });
        license = issued.license;
        if (issued.created) {
          sendLicenseReceiptEmail(config, license).catch(() => {});
        }
      }

      const cookie = buildAccessCookieHeader(license.licenseKey, req, config, db.signingSecret);
      return sendJson(req, res, config, 200, {
        unlocked: true,
        price: config.licensePriceDisplay,
        currency: config.licenseCurrency,
        licenseKey: license.licenseKey,
        email: license.email,
        method: license.method
      }, { 'Set-Cookie': cookie });
    }

    // 5. Stripe Webhook (HMAC-SHA256 verified, idempotent, handles fulfillment + refunds/disputes)
    if (safeUrl === '/api/webhooks/stripe' && req.method === 'POST') {
      if (!config.webhookConfigured) {
        return sendJson(req, res, config, 503, { error: 'Stripe webhook secret not configured' });
      }

      let rawBuf;
      try {
        rawBuf = await readRawBody(req, 1024 * 1024);
      } catch (err) {
        return sendJson(req, res, config, err.statusCode || 400, { error: err.message });
      }

      const sigHeader = req.headers['stripe-signature'];
      const verification = verifyWebhookSignature(rawBuf, sigHeader, config.stripeWebhookSecret);
      if (!verification.valid) {
        return sendJson(req, res, config, 400, { error: verification.error });
      }

      let event;
      try {
        event = JSON.parse(rawBuf.toString('utf8'));
      } catch (_) {
        return sendJson(req, res, config, 400, { error: 'Invalid webhook JSON payload' });
      }

      if (!event || !event.id || !event.type) {
        return sendJson(req, res, config, 400, { error: 'Missing Stripe event id or type' });
      }

      const isNewEvent = db.recordStripeEvent(event.id, event.type);
      if (!isNewEvent) {
        return sendJson(req, res, config, 200, { received: true, duplicate: true });
      }

      const obj = event.data?.object || {};
      if (
        event.type === 'checkout.session.completed' ||
        event.type === 'checkout.session.async_payment_succeeded'
      ) {
        if (
          obj.payment_status === 'paid' &&
          Number(obj.amount_total) >= config.licensePriceCents
        ) {
          const issued = db.issueLicense({
            email: obj.customer_details?.email || obj.customer_email || 'stripe-customer@framevault.dev',
            amountCents: Number(obj.amount_total) || config.licensePriceCents,
            currency: obj.currency || 'usd',
            method: 'stripe-webhook',
            externalId: obj.id,
            paymentIntentId: typeof obj.payment_intent === 'string'
              ? obj.payment_intent
              : obj.payment_intent?.id || null
          });
          if (issued.created) {
            sendLicenseReceiptEmail(config, issued.license).catch(() => {});
          }
        }
      } else if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
        const paymentIntentId = typeof obj.payment_intent === 'string'
          ? obj.payment_intent
          : obj.payment_intent?.id || null;
        if (paymentIntentId) {
          db.revokeLicenseByPaymentIntent(paymentIntentId);
        }
      }

      return sendJson(req, res, config, 200, { received: true, eventId: event.id });
    }

    // 5B. Razorpay Webhook (HMAC-SHA256 verified, idempotent, handles fulfillment + refunds/disputes)
    if (safeUrl === '/api/webhooks/razorpay' && req.method === 'POST') {
      if (!config.razorpayWebhookConfigured) {
        return sendJson(req, res, config, 503, { error: 'Razorpay webhook secret not configured' });
      }

      let rawBuf;
      try {
        rawBuf = await readRawBody(req, 1024 * 1024);
      } catch (err) {
        return sendJson(req, res, config, err.statusCode || 400, { error: err.message });
      }

      const sigHeader = req.headers['x-razorpay-signature'];
      const verification = razorpay.verifyWebhookSignature(
        rawBuf,
        sigHeader,
        config.razorpayWebhookSecret
      );
      if (!verification.valid) {
        return sendJson(req, res, config, 400, { error: verification.error });
      }

      let event;
      try {
        event = JSON.parse(rawBuf.toString('utf8'));
      } catch (_) {
        return sendJson(req, res, config, 400, { error: 'Invalid webhook JSON payload' });
      }

      if (!event || !event.event) {
        return sendJson(req, res, config, 400, { error: 'Missing Razorpay event name' });
      }

      const eventId =
        String(req.headers['x-razorpay-event-id'] || '').trim() ||
        `rzp_${crypto.createHash('sha256').update(rawBuf).digest('hex').slice(0, 24)}`;

      const isNewEvent = db.recordStripeEvent(`rzp:${eventId}`, event.event);
      if (!isNewEvent) {
        return sendJson(req, res, config, 200, { received: true, duplicate: true });
      }

      const paymentEntity = event.payload?.payment?.entity || {};
      const orderEntity = event.payload?.order?.entity || {};
      const refundEntity = event.payload?.refund?.entity || {};
      const disputeEntity = event.payload?.dispute?.entity || {};

      if (event.event === 'payment.captured' || event.event === 'order.paid') {
        const amount = Number(paymentEntity.amount || orderEntity.amount_paid || orderEntity.amount || 0);
        const orderId = paymentEntity.order_id || orderEntity.id || paymentEntity.id || null;
        const paymentId = paymentEntity.id || null;
        const email =
          paymentEntity.email ||
          paymentEntity.notes?.email ||
          orderEntity.notes?.email ||
          'razorpay-customer@framevault.dev';

        if (orderId && amount >= config.licensePriceCents) {
          const issued = db.issueLicense({
            email,
            amountCents: amount,
            currency: String(paymentEntity.currency || orderEntity.currency || config.licenseCurrency).toLowerCase(),
            method: 'razorpay-webhook',
            externalId: orderId,
            paymentIntentId: paymentId
          });
          if (issued.created) {
            sendLicenseReceiptEmail(config, issued.license).catch(() => {});
          }
        }
      } else if (
        event.event === 'refund.processed' ||
        event.event === 'refund.created' ||
        event.event === 'payment.dispute.created'
      ) {
        const paymentId =
          refundEntity.payment_id ||
          disputeEntity.payment_id ||
          paymentEntity.id ||
          null;
        if (paymentId) {
          db.revokeLicenseByPaymentIntent(paymentId);
        }
      }

      return sendJson(req, res, config, 200, { received: true, eventId });
    }

    // 6. License Restore (restore access across devices/browsers via License Key + Email, or Resend)
    if (safeUrl === '/api/license/restore' && req.method === 'POST') {
      if (!enforceRateLimit(req, res, 'license-restore', 10, 15 * 60_000)) return;

      let body;
      try {
        body = await readJsonBody(req, 16 * 1024);
      } catch (err) {
        return sendJson(req, res, config, err.statusCode || 400, { error: err.message });
      }

      const email = String(body.email || '').trim().toLowerCase();
      const licenseKey = String(body.licenseKey || '').trim().toUpperCase();
      const wantsResend = Boolean(body.resend);

      if (wantsResend) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return sendJson(req, res, config, 400, { error: 'Enter a valid email address.' });
        }
        if (!config.resendApiKey) {
          return sendJson(req, res, config, 503, {
            error: 'Email delivery is not configured. Enter your license key directly to restore access.'
          });
        }
        const matches = db.findActiveLicensesByEmail(email);
        if (matches.length > 0) {
          sendLicenseReceiptEmail(config, matches[0]).catch(() => {});
        }
        // Always return generic success message to prevent email enumeration
        return sendJson(req, res, config, 200, {
          sent: true,
          message: 'If an active license exists for that email, we sent your license key.'
        });
      }

      if (!licenseKey || !/^OK-PRO-[A-Z0-9-]{8,32}$/.test(licenseKey)) {
        return sendJson(req, res, config, 400, { error: 'Enter a valid FrameVault license key (OK-PRO-...).' });
      }

      const license = db.findActiveLicenseByKey(licenseKey);
      if (!license) {
        return sendJson(req, res, config, 404, { error: 'License key not found or no longer active.' });
      }
      if (email && license.email.toLowerCase() !== email) {
        return sendJson(req, res, config, 403, { error: 'Email does not match this license key.' });
      }

      const cookie = buildAccessCookieHeader(license.licenseKey, req, config, db.signingSecret);
      return sendJson(req, res, config, 200, {
        unlocked: true,
        licenseKey: license.licenseKey,
        email: license.email,
        method: license.method
      }, { 'Set-Cookie': cookie });
    }

    // 7. Lock / Sign out access on this device (only revokes demo-card keys; paid Stripe keys stay restorable)
    if (safeUrl === '/api/license/lock' && req.method === 'POST') {
      const existing = verifyLicenseFromRequest(req, db);
      if (existing && (existing.method === 'demo-card' || existing.method === 'local-card')) {
        db.revokeLicenseByKey(existing.licenseKey);
      }
      return sendJson(req, res, config, 200, { unlocked: false }, {
        'Set-Cookie': buildClearCookieHeader(req, config)
      });
    }

    // 8. Sanitized Public Catalog (NEVER exposes htmlSource or htmlPath!)
    if (safeUrl === '/api/library' && req.method === 'GET') {
      const license = verifyLicenseFromRequest(req, db);
      const payload = catalog.buildPublicCatalog(Boolean(license));
      return sendJson(req, res, config, 200, payload, { 'Cache-Control': 'no-store' });
    }

    // 8B. Lazy per-component controlParameterSet (keeps initial catalog tiny ~20 KB!)
    if (safeUrl.startsWith('/api/component/') && safeUrl.endsWith('/params') && req.method === 'GET') {
      const compId = safeUrl.slice('/api/component/'.length, -'/params'.length);
      const asset = catalog.getParamsAsset(compId);
      if (!asset) {
        return sendJson(req, res, config, 404, { error: 'Component not found' });
      }
      return sendCompressedAsset(req, res, config, asset, 'application/json; charset=utf-8', {
        'Cache-Control': 'public, max-age=3600'
      });
    }

    // 9. Live Interactive Iframe Preview (GET /api/preview/:id and POST /api/preview/:id)
    if (safeUrl.startsWith('/api/preview/')) {
      const compId = safeUrl.slice('/api/preview/'.length);
      const comp = catalog.byId.get(compId);
      if (!comp) {
        return sendJson(req, res, config, 404, { error: 'Component not found' });
      }

      if (req.method === 'POST') {
        if (!enforceRateLimit(req, res, 'preview-compile', 180, 60_000)) return;
        let body;
        try {
          body = await readJsonBody(req, 8 * 1024 * 1024);
        } catch (err) {
          return sendJson(req, res, config, err.statusCode || 400, { error: err.message });
        }
        const token = previewStore.set(compId, body.controlParameterSet || null);
        return sendJson(req, res, config, 200, {
          previewUrl: `/api/preview/${encodeURIComponent(compId)}?token=${encodeURIComponent(token)}`
        }, { 'Cache-Control': 'no-store' });
      }

      if (req.method === 'GET') {
        // Block direct browser navigation & CLI scraping of preview endpoint; only allow same-origin iframe embedding
        const fetchDest = String(req.headers['sec-fetch-dest'] || '').toLowerCase();
        const referer = String(req.headers.referer || '');
        const host = String(req.headers.host || '');
        const hasSameOriginReferer = Boolean(referer && host && referer.includes(host));
        if (fetchDest !== 'iframe' && !(!fetchDest && hasSameOriginReferer)) {
          return sendJson(req, res, config, 403, {
            error: 'Preview endpoint can only be loaded inside an embedded iframe.'
          });
        }
        const token = fullUrl.searchParams.get('token');
        const userCps = token ? previewStore.get(token, compId) : null;
        if (!userCps) {
          const cachedAsset = catalog.getDefaultPreviewAsset(compId);
          return sendCompressedAsset(req, res, config, cachedAsset, 'text/html; charset=utf-8', {
            'Content-Security-Policy': "frame-ancestors 'self'",
            'Cache-Control': 'private, max-age=300'
          });
        }
        const previewHtml = compileComponentHtml(comp, userCps, { forIframe: true });
        const customAsset = makeCompressedAsset(previewHtml);
        return sendCompressedAsset(req, res, config, customAsset, 'text/html; charset=utf-8', {
          'Content-Security-Policy': "frame-ancestors 'self'",
          'Cache-Control': 'private, no-store'
        });
      }
    }

    // 10. Licensed Clean Source Inspection / Copy HTML (POST /api/source)
    if (safeUrl === '/api/source' && req.method === 'POST') {
      const license = verifyLicenseFromRequest(req, db);
      if (!license) {
        return sendJson(req, res, config, 402, {
          error: `All-Access Pass (${config.licensePriceDisplay}) required to inspect or copy component HTML.`,
          priceCents: config.licensePriceCents,
          price: config.licensePriceDisplay
        });
      }
      if (!enforceRateLimit(req, res, 'source-read', 120, 60_000)) return;

      let body;
      try {
        body = await readJsonBody(req, 8 * 1024 * 1024);
      } catch (err) {
        return sendJson(req, res, config, err.statusCode || 400, { error: err.message });
      }

      const comp = catalog.byId.get(String(body.id || ''));
      if (!comp) {
        return sendJson(req, res, config, 404, { error: 'Component not found' });
      }

      const format = String(body.format || 'html').trim().toLowerCase() === 'tsx' ? 'tsx' : 'html';
      const html = compileComponentHtml(comp, body.controlParameterSet || null, { forIframe: false });
      if (format === 'tsx') {
        const reactOut = convertHtmlToReactTsx(html, {
          section: comp.section,
          name: comp.name,
          id: comp.id
        });
        return sendJson(
          req,
          res,
          config,
          200,
          {
            format: 'tsx',
            code: reactOut.tsx,
            tsx: reactOut.tsx,
            html,
            componentName: reactOut.componentName,
            filename: reactOut.filename
          },
          { 'Cache-Control': 'no-store' }
        );
      }
      const filename = `${comp.section}-${comp.name.replace(/\s+/g, '-')}-custom.html`;
      return sendJson(req, res, config, 200, { format: 'html', code: html, html, filename }, { 'Cache-Control': 'no-store' });
    }

    // 11. Licensed Standalone .HTML / React .TSX Export (POST /api/export-html or /api/export-code)
    if ((safeUrl === '/api/export-html' || safeUrl === '/api/export-code') && req.method === 'POST') {
      const license = verifyLicenseFromRequest(req, db);
      if (!license) {
        return sendJson(req, res, config, 402, {
          error: `All-Access Pass (${config.licensePriceDisplay}) payment required to download component code.`,
          priceCents: config.licensePriceCents,
          price: config.licensePriceDisplay
        });
      }
      if (!enforceRateLimit(req, res, 'export-html', 60, 60_000)) return;

      let body;
      try {
        body = await readJsonBody(req, 8 * 1024 * 1024);
      } catch (err) {
        return sendJson(req, res, config, err.statusCode || 400, { error: err.message });
      }

      const format = String(body.format || 'html').trim().toLowerCase() === 'tsx' ? 'tsx' : 'html';
      let html = '';
      let compMeta = null;
      let componentId = 'custom';
      let defaultName = 'component-custom.html';

      if (body.id) {
        const comp = catalog.byId.get(String(body.id));
        if (!comp) {
          return sendJson(req, res, config, 404, { error: 'Component not found' });
        }
        compMeta = comp;
        componentId = comp.id;
        defaultName = `${comp.section}-${comp.name.replace(/\s+/g, '-')}-custom.html`;
        html = compileComponentHtml(comp, body.controlParameterSet || null, { forIframe: false });
      } else if (body.html) {
        html = String(body.html);
      }

      if (!html) {
        return sendJson(req, res, config, 400, { error: 'Missing component id or HTML payload' });
      }

      db.logExport(license.licenseKey, `${componentId}:${format}`);

      let outContent = html;
      let contentType = 'text/html; charset=utf-8';
      let safeFilename;

      if (format === 'tsx') {
        const reactOut = convertHtmlToReactTsx(html, {
          section: compMeta?.section,
          name: compMeta?.name,
          id: compMeta?.id
        });
        outContent = reactOut.tsx;
        contentType = 'text/plain; charset=utf-8';
        const rawTsx = path
          .basename(String(body.filename || reactOut.filename))
          .replace(/[^a-zA-Z0-9._-]/g, '-');
        safeFilename = rawTsx.toLowerCase().endsWith('.tsx')
          ? rawTsx
          : `${rawTsx.replace(/\.html$/i, '')}.tsx`;
      } else {
        const rawName = path
          .basename(String(body.filename || defaultName))
          .replace(/[^a-zA-Z0-9._-]/g, '-');
        safeFilename = rawName.toLowerCase().endsWith('.html') ? rawName : `${rawName}.html`;
      }

      res.writeHead(
        200,
        applySecurityHeaders(req, res, config, {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${safeFilename}"`,
          'Content-Length': Buffer.byteLength(outContent, 'utf8'),
          'Cache-Control': 'no-store'
        })
      );
      return res.end(outContent);
    }

    // 11B. Licensed Editable Figma Bundle (POST /api/figma — returns editable SVG + Design Tokens JSON)
    if (safeUrl === '/api/figma' && req.method === 'POST') {
      const license = verifyLicenseFromRequest(req, db);
      if (!license) {
        return sendJson(req, res, config, 402, {
          error: `All-Access Pass (${config.licensePriceDisplay}) required to copy or export editable Figma layers.`,
          priceCents: config.licensePriceCents,
          price: config.licensePriceDisplay
        });
      }
      if (!enforceRateLimit(req, res, 'figma-preview', 120, 60_000)) return;

      let body;
      try {
        body = await readJsonBody(req, 8 * 1024 * 1024);
      } catch (err) {
        return sendJson(req, res, config, err.statusCode || 400, { error: err.message });
      }

      const comp = catalog.byId.get(String(body.id || ''));
      if (!comp) {
        return sendJson(req, res, config, 404, { error: 'Component not found' });
      }

      const compiledHtml = compileComponentHtml(comp, body.controlParameterSet || null, { forIframe: false });
      const bundle = buildFigmaBundle(comp, body.controlParameterSet || comp.controlParameterSet, compiledHtml, {
        preset: body.preset || 'desktop',
        includeSwatches: body.includeSwatches !== false
      });

      return sendJson(req, res, config, 200, bundle, { 'Cache-Control': 'no-store' });
    }

    // 11C. Licensed Editable Figma Download (POST /api/export-figma — .svg or .figma-tokens.json)
    if (safeUrl === '/api/export-figma' && req.method === 'POST') {
      const license = verifyLicenseFromRequest(req, db);
      if (!license) {
        return sendJson(req, res, config, 402, {
          error: `All-Access Pass (${config.licensePriceDisplay}) required to download editable Figma files.`,
          priceCents: config.licensePriceCents,
          price: config.licensePriceDisplay
        });
      }
      if (!enforceRateLimit(req, res, 'export-figma', 60, 60_000)) return;

      let body;
      try {
        body = await readJsonBody(req, 8 * 1024 * 1024);
      } catch (err) {
        return sendJson(req, res, config, err.statusCode || 400, { error: err.message });
      }

      const comp = catalog.byId.get(String(body.id || ''));
      if (!comp) {
        return sendJson(req, res, config, 404, { error: 'Component not found' });
      }

      const format = String(body.format || 'svg').trim().toLowerCase() === 'tokens' ? 'tokens' : 'svg';
      const compiledHtml = compileComponentHtml(comp, body.controlParameterSet || null, { forIframe: false });
      const bundle = buildFigmaBundle(comp, body.controlParameterSet || comp.controlParameterSet, compiledHtml, {
        preset: body.preset || 'desktop',
        includeSwatches: body.includeSwatches !== false
      });

      db.logExport(license.licenseKey, `${comp.id}:figma-${format}`);

      const content = format === 'tokens' ? bundle.tokensJson : bundle.svg;
      const contentType = format === 'tokens'
        ? 'application/json; charset=utf-8'
        : 'image/svg+xml; charset=utf-8';
      const safeFilename = (format === 'tokens' ? bundle.filenameTokens : bundle.filenameSvg)
        .replace(/[^a-zA-Z0-9._-]/g, '-');

      res.writeHead(
        200,
        applySecurityHeaders(req, res, config, {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${safeFilename}"`,
          'Content-Length': Buffer.byteLength(content, 'utf8'),
          'Cache-Control': 'no-store'
        })
      );
      return res.end(content);
    }

    // 12. MCP Info endpoint (config JSON & SKILL.md gated behind All-Access license)
    if (safeUrl === '/api/mcp-info' && req.method === 'GET') {
      const license = verifyLicenseFromRequest(req, db);
      if (!mcpInfoCache || fullUrl.searchParams.get('refresh') === '1') {
        const mcpEntry = path.join(rootDir, 'mcp-server', 'dist', 'index.js');
        const designsDir = path.join(rootDir, 'designs');
        const skillAgentPath = path.join(rootDir, '.agent', 'skills', 'originkit-ui', 'SKILL.md');
        let skillMarkdown = '';
        try {
          if (fs.existsSync(skillAgentPath)) {
            skillMarkdown = fs.readFileSync(skillAgentPath, 'utf8');
          }
        } catch (_) {}

        const mcpBuilt = fs.existsSync(mcpEntry);
        let indexedCount = catalog.components.length;
        try {
          const countHtmlFiles = (dir) => {
            let total = 0;
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
              if (e.name.startsWith('.') || e.name === 'images') continue;
              const p = path.join(dir, e.name);
              if (e.isDirectory()) total += countHtmlFiles(p);
              else if (/\.(html|htm|tsx|jsx|vue|svelte)$/i.test(e.name)) total++;
            }
            return total;
          };
          if (fs.existsSync(designsDir)) indexedCount = countHtmlFiles(designsDir);
        } catch (_) {}

        const baseConfig = {
          mcpServers: {
            'originkit-ui': {
              command: process.execPath || 'node',
              args: [mcpEntry],
              env: {
                ORIGINKIT_COMPONENTS_DIR: designsDir
              }
            }
          }
        };

        const sharedMeta = {
          ready: mcpBuilt,
          indexedCount,
          skillPaths: [
            '.agent/skills/originkit-ui/SKILL.md',
            '.claude/skills/originkit-ui/SKILL.md'
          ],
          tools: [
            { name: 'search_components', desc: 'Natural-language search across filenames, titles, engines, tags & comments' },
            { name: 'get_component', desc: 'Returns exact raw source from disk + tailored Remix Prompt wrapper' }
          ],
          resources: [
            { uri: 'ui://guidelines/design-system', desc: 'Extracted surface palettes, engine patterns & styles.css design tokens' }
          ]
        };

        const lockedStub = `// Locked — Unlock FrameVault All-Access (${config.licensePriceDisplay}) to access MCP server config & raw source delivery.`;

        mcpInfoCache = {
          unlocked: makeCompressedAsset(JSON.stringify({
            ...sharedMeta,
            locked: false,
            mcpEntry,
            designsDir,
            skillMarkdown,
            configs: {
              antigravity: {
                label: 'Antigravity',
                fileHint: 'mcp_config.json',
                json: JSON.stringify(baseConfig, null, 2)
              },
              claude: {
                label: 'Claude Desktop / Code',
                fileHint: 'claude_desktop_config.json or .mcp.json',
                json: JSON.stringify(baseConfig, null, 2)
              },
              cursor: {
                label: 'Cursor',
                fileHint: '.cursor/mcp.json',
                json: JSON.stringify(baseConfig, null, 2)
              }
            }
          })),
          locked: makeCompressedAsset(JSON.stringify({
            ...sharedMeta,
            locked: true,
            skillMarkdown: '',
            configs: {
              antigravity: { label: 'Antigravity', fileHint: 'mcp_config.json', json: lockedStub },
              claude: { label: 'Claude Desktop / Code', fileHint: 'claude_desktop_config.json or .mcp.json', json: lockedStub },
              cursor: { label: 'Cursor', fileHint: '.cursor/mcp.json', json: lockedStub }
            }
          }))
        };
      }

      const targetAsset = license ? mcpInfoCache.unlocked : mcpInfoCache.locked;
      // When deployed on a public URL (or non-localhost host), serve universal remote Streamable HTTP MCP config
      if (license) {
        const origin = resolveOrigin(req, config);
        const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin);
        if (!isLocalOrigin || config.publicUrl) {
          const remoteBase = config.publicUrl || origin;
          const remoteMcpUrl = `${remoteBase}/api/mcp`;
          const remoteConfig = {
            mcpServers: {
              'originkit-ui': {
                url: remoteMcpUrl,
                headers: {
                  Authorization: `Bearer ${license.licenseKey}`
                }
              }
            }
          };
          const parsedUnlocked = JSON.parse(mcpInfoCache.unlocked.raw.toString('utf8'));
          const remotePayload = {
            ...parsedUnlocked,
            remoteMcpUrl,
            transport: 'streamable-http',
            configs: {
              antigravity: {
                label: 'Antigravity',
                fileHint: 'mcp_config.json',
                json: JSON.stringify(remoteConfig, null, 2)
              },
              claude: {
                label: 'Claude Desktop / Code',
                fileHint: 'claude_desktop_config.json or .mcp.json',
                json: JSON.stringify(remoteConfig, null, 2)
              },
              cursor: {
                label: 'Cursor',
                fileHint: '.cursor/mcp.json',
                json: JSON.stringify(remoteConfig, null, 2)
              }
            }
          };
          return sendJson(req, res, config, 200, remotePayload, {
            'Cache-Control': 'private, no-store'
          });
        }
      }

      return sendCompressedAsset(req, res, config, targetAsset, 'application/json; charset=utf-8', {
        'Cache-Control': 'private, no-store'
      });
    }

    // 13. Universal Remote Streamable HTTP MCP Endpoint (POST /api/mcp — Bearer license key or signed cookie)
    if (safeUrl === '/api/mcp' && req.method === 'POST') {
      if (!enforceRateLimit(req, res, 'remote-mcp', 120, 60_000)) return;

      let license = verifyLicenseFromRequest(req, db);
      if (!license) {
        const authHeader = String(req.headers.authorization || '').trim();
        const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
        if (bearerMatch) {
          const key = bearerMatch[1].trim().toUpperCase();
          license = db.findActiveLicenseByKey(key);
        }
      }
      if (!license) {
        return sendJson(req, res, config, 401, {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32001,
            message: `Unauthorized — valid FrameVault All-Access license key (${config.licensePriceDisplay}) required in Authorization: Bearer <LICENSE_KEY>.`
          }
        });
      }

      let body;
      try {
        body = await readJsonBody(req, 512 * 1024);
      } catch (err) {
        return sendJson(req, res, config, err.statusCode || 400, {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: err.message || 'Parse error' }
        });
      }

      const result = handleMcpJsonRpc(body, { catalog, rootDir });
      if (result.status === 202 || result.payload === null) {
        res.writeHead(202, applySecurityHeaders(req, res, config, { 'Cache-Control': 'no-store' }));
        return res.end();
      }
      return sendJson(req, res, config, result.status, result.payload, { 'Cache-Control': 'no-store' });
    }

    return sendJson(req, res, config, 404, { error: 'Unknown API endpoint' });
  }

  const server = http.createServer(async (req, res) => {
    try {
      let fullUrl;
      let safeUrl;
      try {
        fullUrl = new URL(req.url, `http://localhost:${config.port}`);
        safeUrl = decodeURIComponent(fullUrl.pathname);
      } catch (_) {
        return sendJson(req, res, config, 400, { error: 'Malformed request URL' });
      }

      if (safeUrl.startsWith('/api/')) {
        await handleApi(req, res, safeUrl, fullUrl);
        return;
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, applySecurityHeaders(req, res, config, { Allow: 'GET, HEAD' }));
        return res.end('Method Not Allowed');
      }

      // Dynamic sanitized & compressed components-data.js (~20 KB raw / ~3 KB brotli, ZERO htmlSource!)
      if (safeUrl === '/components-data.js') {
        return sendCompressedAsset(req, res, config, catalog.publicScriptAsset, 'application/javascript; charset=utf-8', {
          'Cache-Control': 'public, max-age=300'
        });
      }

      const relPath = safeUrl === '/' ? '/index.html' : safeUrl;
      const normalizedRel = relPath.replace(/\\/g, '/');

      // Block dotfiles, traversal, and backend/internal directories & files
      const lowerRel = normalizedRel.toLowerCase();
      if (
        normalizedRel.includes('\0') ||
        normalizedRel.includes('..') ||
        SENSITIVE_FILES.has(lowerRel) ||
        SENSITIVE_PREFIXES.some(prefix => lowerRel === prefix || lowerRel.startsWith(prefix + '/') || lowerRel.startsWith(prefix)) ||
        normalizedRel.split('/').some(seg => seg.startsWith('.'))
      ) {
        res.writeHead(403, applySecurityHeaders(req, res, config));
        return res.end('Forbidden');
      }

      // Strict public static allowlist: only root frontend files or /designs/* assets
      const isPublicRootFile = PUBLIC_ROOT_FILES.has(normalizedRel);
      const isDesignsAsset = normalizedRel.startsWith('/designs/');
      if (!isPublicRootFile && !isDesignsAsset) {
        res.writeHead(404, applySecurityHeaders(req, res, config));
        return res.end('Not found');
      }

      const resolvedPath = path.resolve(rootDir, '.' + normalizedRel);
      const rootPrefix = rootDir.endsWith(path.sep) ? rootDir : rootDir + path.sep;
      if (!resolvedPath.startsWith(rootPrefix)) {
        res.writeHead(403, applySecurityHeaders(req, res, config));
        return res.end('Forbidden');
      }

      const ext = path.extname(resolvedPath).toLowerCase();
      if (isDesignsAsset) {
        if (!ALLOWED_DESIGN_ASSET_EXTS.has(ext)) {
          res.writeHead(403, applySecurityHeaders(req, res, config));
          return res.end('Forbidden');
        }
        // Raw HTML & React TSX files under /designs/ require an active paid license
        if (ext === '.html' || ext === '.tsx') {
          const license = verifyLicenseFromRequest(req, db);
          if (!license) {
            return sendJson(req, res, config, 402, {
              error: `All-Access Pass (${config.licensePriceDisplay}) required to access or download raw HTML/TSX component files.`
            });
          }
        }
      }

      // Serve core frontend text files (/index.html, /styles.css, /app.js) with Brotli/Gzip + ETag + in-memory cache
      if (isPublicRootFile) {
        try {
          const asset = getCachedStaticFile(resolvedPath);
          if (!asset) {
            res.writeHead(404, applySecurityHeaders(req, res, config));
            return res.end('Not found');
          }
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          const cacheControl = ext === '.html' ? 'no-cache' : 'public, max-age=300';
          return sendCompressedAsset(req, res, config, asset, contentType, {
            'Cache-Control': cacheControl
          });
        } catch (_) {
          res.writeHead(404, applySecurityHeaders(req, res, config));
          return res.end('Not found');
        }
      }

      fs.stat(resolvedPath, (err, stat) => {
        if (err || !stat.isFile()) {
          res.writeHead(404, applySecurityHeaders(req, res, config));
          return res.end('Not found');
        }

        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const range = req.headers.range;

        if (range && ext === '.mp4') {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = Math.max(0, parseInt(parts[0], 10) || 0);
          const parsedEnd = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
          const end = Math.min(stat.size - 1, Number.isNaN(parsedEnd) ? stat.size - 1 : parsedEnd);
          if (start >= stat.size || start > end) {
            res.writeHead(
              416,
              applySecurityHeaders(req, res, config, { 'Content-Range': `bytes */${stat.size}` })
            );
            return res.end();
          }
          res.writeHead(
            206,
            applySecurityHeaders(req, res, config, {
              'Content-Range': `bytes ${start}-${end}/${stat.size}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': end - start + 1,
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=300'
            })
          );
          if (req.method === 'HEAD') return res.end();
          const stream = fs.createReadStream(resolvedPath, { start, end });
          req.on('close', () => stream.destroy());
          stream.on('error', () => { if (!res.headersSent) res.writeHead(500); res.end(); });
          stream.pipe(res);
          return;
        }

        const headers = {
          'Content-Length': stat.size,
          'Content-Type': contentType
        };
        if (ext === '.mp4' || ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
          headers['Accept-Ranges'] = 'bytes';
          headers['Cache-Control'] = 'public, max-age=300';
        }
        res.writeHead(200, applySecurityHeaders(req, res, config, headers));
        if (req.method === 'HEAD') return res.end();
        const stream = fs.createReadStream(resolvedPath);
        req.on('close', () => stream.destroy());
        stream.on('error', () => { if (!res.headersSent) res.writeHead(500); res.end(); });
        stream.pipe(res);
      });
    } catch (err) {
      if (!res.headersSent) {
        sendJson(req, res, config, 500, { error: 'Internal server error' });
      }
    }
  });

  function shutdown() {
    rateLimiter.destroy();
    previewStore.clear();
    db.close();
  }

  return { server, config, db, catalog, shutdown };
}

if (require.main === module) {
  const app = createAppServer();
  const onListen = () => {
    console.log(`\n======================================================`);
    console.log(`  FRAMEVAULT COMPONENT VAULT (${app.config.nodeEnv.toUpperCase()})`);
    console.log(`  URL:      http://localhost:${app.config.port}`);
    console.log(`  DB:       ${app.config.databasePath}`);
    console.log(`  Razorpay: ${app.config.razorpayConfigured ? 'ENABLED' : 'NOT CONFIGURED'} (Webhook: ${app.config.razorpayWebhookConfigured ? 'YES' : 'NO'})`);
    console.log(`  Stripe:   ${app.config.stripeConfigured ? 'ENABLED' : 'NOT CONFIGURED'} (Webhook: ${app.config.webhookConfigured ? 'YES' : 'NO'})`);
    console.log(`  Price:    ${app.config.licensePriceDisplay} (${app.config.licenseCurrency})`);
    console.log(`  Demo Pay: ${app.config.demoCheckoutEnabled ? 'ENABLED (local dev)' : 'DISABLED'}`);
    console.log(`======================================================\n`);
  };
  if (app.config.host) {
    app.server.listen(app.config.port, app.config.host, onListen);
  } else {
    app.server.listen(app.config.port, onListen);
  }

  const handleSignal = () => {
    app.server.close(() => {
      app.shutdown();
      process.exit(0);
    });
  };
  process.on('SIGINT', handleSignal);
  process.on('SIGTERM', handleSignal);
}

module.exports = { createAppServer };
