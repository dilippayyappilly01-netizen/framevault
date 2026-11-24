const crypto = require('crypto');

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

function buildAuthHeader(config) {
  const token = Buffer.from(
    `${config.razorpayKeyId}:${config.razorpayKeySecret}`,
    'utf8'
  ).toString('base64');
  return `Basic ${token}`;
}

async function createOrder(config, options = {}) {
  const receipt = `fv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`.slice(0, 40);
  const currency = String(config.licenseCurrency || 'INR').toUpperCase();
  const payload = {
    amount: Number(config.licensePriceCents),
    currency,
    receipt,
    notes: {
      product: 'framevault_all_access',
      ...(options.email ? { email: String(options.email).trim().toLowerCase() } : {})
    }
  };

  const res = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(config),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(data.error?.description || data.error?.message || 'Razorpay order creation failed');
  }
  return data;
}

async function fetchPayment(paymentId, config) {
  const res = await fetch(
    `${RAZORPAY_API_BASE}/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: buildAuthHeader(config)
      }
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.description || data.error?.message || 'Unable to fetch Razorpay payment');
  }
  return data;
}

/**
 * Verifies the Checkout callback signature: HMAC-SHA256(orderId + "|" + paymentId, keySecret).
 */
function verifyPaymentSignature(orderId, paymentId, signature, keySecret) {
  if (!keySecret) {
    return { valid: false, error: 'Razorpay key secret not configured' };
  }
  if (!orderId || !paymentId || !signature) {
    return { valid: false, error: 'Missing Razorpay payment verification fields' };
  }
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`, 'utf8')
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(String(signature).trim(), 'utf8');
  if (
    expectedBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return { valid: false, error: 'Invalid Razorpay payment signature' };
  }
  return { valid: true };
}

/**
 * Verifies X-Razorpay-Signature webhook header against raw payload bytes using HMAC-SHA256.
 */
function verifyWebhookSignature(rawBodyBuffer, sigHeader, webhookSecret) {
  if (!webhookSecret) {
    return { valid: false, error: 'Razorpay webhook secret not configured' };
  }
  if (!sigHeader || typeof sigHeader !== 'string') {
    return { valid: false, error: 'Missing X-Razorpay-Signature header' };
  }
  const rawBuf = Buffer.isBuffer(rawBodyBuffer)
    ? rawBodyBuffer
    : Buffer.from(String(rawBodyBuffer), 'utf8');

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBuf)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(sigHeader.trim(), 'utf8');
  if (
    expectedBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return { valid: false, error: 'Invalid Razorpay webhook signature' };
  }
  return { valid: true };
}

module.exports = {
  createOrder,
  fetchPayment,
  verifyPaymentSignature,
  verifyWebhookSignature
};
