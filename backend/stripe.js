const crypto = require('crypto');

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

function resolveOrigin(req, config) {
  if (config.publicUrl) return config.publicUrl;
  const originHeader = String(req.headers.origin || '').trim();
  if (/^https?:\/\/[^/\s]+$/i.test(originHeader)) {
    return originHeader;
  }
  const host = String(req.headers.host || `localhost:${config.port}`).trim();
  const proto = config.trustProxy && req.headers['x-forwarded-proto']
    ? String(req.headers['x-forwarded-proto']).split(',')[0].trim()
    : (req.socket?.encrypted ? 'https' : 'http');
  return `${proto}://${host}`;
}

async function createCheckoutSession(req, config, options = {}) {
  const origin = resolveOrigin(req, config);
  const params = new URLSearchParams({
    mode: 'payment',
    success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricingSection`,
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(config.licensePriceCents),
    'line_items[0][price_data][product_data][name]': 'FrameVault All-Access Component Library (50 Components)',
    'line_items[0][quantity]': '1',
    'metadata[product]': 'originkit_all_access'
  });

  if (options.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(options.email)) {
    params.set('customer_email', options.email.trim());
  }

  const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(data.error?.message || 'Stripe checkout session creation failed');
  }
  return data;
}

async function fetchCheckoutSession(sessionId, config) {
  const res = await fetch(
    `${STRIPE_API_BASE}/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: { Authorization: `Bearer ${config.stripeSecretKey}` }
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Unable to fetch Stripe checkout session');
  }
  return data;
}

/**
 * Verifies a Stripe-Signature header against raw payload bytes using HMAC-SHA256.
 * Rejects tampered payloads and timestamps outside the tolerance window (default 300s).
 */
function verifyWebhookSignature(rawBodyBuffer, sigHeader, webhookSecret, toleranceSec = 300) {
  if (!webhookSecret) {
    return { valid: false, error: 'Webhook secret not configured' };
  }
  if (!sigHeader || typeof sigHeader !== 'string') {
    return { valid: false, error: 'Missing Stripe-Signature header' };
  }

  let timestamp = null;
  const signatures = [];
  for (const part of sigHeader.split(',')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === 't') timestamp = Number(v);
    if (k === 'v1' && v) signatures.push(v);
  }

  if (!timestamp || !Number.isFinite(timestamp) || signatures.length === 0) {
    return { valid: false, error: 'Malformed Stripe-Signature header' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - timestamp) > toleranceSec) {
    return { valid: false, error: 'Stripe webhook timestamp outside tolerance window' };
  }

  const rawText = Buffer.isBuffer(rawBodyBuffer)
    ? rawBodyBuffer.toString('utf8')
    : String(rawBodyBuffer);
  const signedPayload = `${timestamp}.${rawText}`;
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const matched = signatures.some(sig => {
    const sigBuf = Buffer.from(sig, 'utf8');
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
  });

  if (!matched) {
    return { valid: false, error: 'Invalid Stripe webhook signature' };
  }

  return { valid: true, timestamp };
}

module.exports = {
  resolveOrigin,
  createCheckoutSession,
  fetchCheckoutSession,
  verifyWebhookSignature
};
