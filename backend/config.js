const fs = require('fs');
const path = require('path');

function loadDotEnv(envPath) {
  try {
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = val;
      }
    }
  } catch (_) {
    // Ignore unreadable .env files
  }
}

function createConfig(rootDir, overrides = {}) {
  loadDotEnv(path.join(rootDir, '.env'));

  const env = { ...process.env, ...overrides };
  const nodeEnv = String(env.NODE_ENV || 'development').trim().toLowerCase();
  const isProd = nodeEnv === 'production';
  const port = Number(env.PORT || 3000);
  const host = String(env.HOST || (isProd ? '0.0.0.0' : '')).trim();
  const stripeSecretKey = String(env.STRIPE_SECRET_KEY || '').trim();
  const stripeWebhookSecret = String(env.STRIPE_WEBHOOK_SECRET || '').trim();
  const razorpayKeyId = String(env.RAZORPAY_KEY_ID || '').trim();
  const razorpayKeySecret = String(env.RAZORPAY_KEY_SECRET || '').trim();
  const razorpayWebhookSecret = String(env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  const razorpayConfigured = Boolean(razorpayKeyId && razorpayKeySecret);
  const publicUrl = String(env.PUBLIC_URL || '').trim().replace(/\/+$/, '');
  const licenseCurrency = String(
    env.LICENSE_CURRENCY || (razorpayConfigured && !stripeSecretKey ? 'INR' : 'USD')
  ).trim().toUpperCase();
  const licensePriceCents = Number(env.LICENSE_PRICE_CENTS || 499);
  const formatPriceDisplay = (amountSubunits, currency) => {
    const major = amountSubunits / 100;
    if (currency === 'INR') {
      return `₹${Number.isInteger(major) ? major : major.toFixed(2)}`;
    }
    if (currency === 'EUR') return `€${major.toFixed(2)}`;
    if (currency === 'GBP') return `£${major.toFixed(2)}`;
    return `$${major.toFixed(2)}`;
  };
  const licensePriceDisplay =
    String(env.LICENSE_PRICE_DISPLAY || '').trim() ||
    formatPriceDisplay(licensePriceCents, licenseCurrency);
  const databasePath = String(
    env.DATABASE_PATH || path.join(rootDir, 'data', 'originkit.sqlite')
  ).trim();
  const legacyLicenseFile = path.join(rootDir, '.ok-licenses.json');
  const catalogFile = path.join(rootDir, 'components-data.js');

  // Demo checkout is ONLY allowed when no real payment gateway is configured and we are NOT in production
  // (unless explicitly forced with ALLOW_DEMO_CHECKOUT=true in non-production).
  const allowDemoFlag = String(env.ALLOW_DEMO_CHECKOUT || '').toLowerCase();
  const demoCheckoutEnabled =
    !stripeSecretKey &&
    !razorpayConfigured &&
    !isProd &&
    allowDemoFlag !== 'false';

  const cookieSecure =
    String(env.COOKIE_SECURE || '').toLowerCase() === 'true' || isProd;

  return {
    rootDir,
    nodeEnv,
    isProd,
    port,
    host,
    publicUrl,
    stripeSecretKey,
    stripeWebhookSecret,
    stripeConfigured: Boolean(stripeSecretKey),
    webhookConfigured: Boolean(stripeWebhookSecret),
    razorpayKeyId,
    razorpayKeySecret,
    razorpayWebhookSecret,
    razorpayConfigured,
    razorpayWebhookConfigured: Boolean(razorpayWebhookSecret),
    demoCheckoutEnabled,
    cookieSecure,
    signingSecretEnv: String(env.ORIGINKIT_SECRET || '').trim(),
    licenseCurrency,
    licensePriceCents,
    licensePriceDisplay,
    databasePath,
    legacyLicenseFile,
    catalogFile,
    resendApiKey: String(env.RESEND_API_KEY || '').trim(),
    emailFrom: String(env.EMAIL_FROM || 'FrameVault <receipts@framevault.dev>').trim(),
    trustProxy: String(env.TRUST_PROXY || 'true').toLowerCase() !== 'false'
  };
}

module.exports = { createConfig, loadDotEnv };
