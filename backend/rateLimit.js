class RateLimiter {
  constructor() {
    this.buckets = new Map();
    this.cleanupTimer = setInterval(() => this.cleanup(), 60_000);
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  check(key, limit, windowMs) {
    const now = Date.now();
    const cutoff = now - windowMs;
    let timestamps = this.buckets.get(key);
    if (!timestamps) {
      timestamps = [];
      this.buckets.set(key, timestamps);
    }

    while (timestamps.length > 0 && timestamps[0] <= cutoff) {
      timestamps.shift();
    }

    if (timestamps.length >= limit) {
      const oldest = timestamps[0];
      const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        retryAfterSec
      };
    }

    timestamps.push(now);
    return {
      allowed: true,
      remaining: Math.max(0, limit - timestamps.length),
      retryAfterSec: 0
    };
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000;
    for (const [key, timestamps] of this.buckets.entries()) {
      if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > maxAge) {
        this.buckets.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupTimer);
    this.buckets.clear();
  }
}

function getClientIp(req, trustProxy = true) {
  if (trustProxy) {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
      return xff.split(',')[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim()) {
      return realIp.trim();
    }
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

module.exports = { RateLimiter, getClientIp };
