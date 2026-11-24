const crypto = require('crypto');

const ACCESS_COOKIE_NAME = 'ok_access';
const ONE_YEAR_SECONDS = 31536000;

function signLicensePayload(licenseKey, secret) {
  const sig = crypto
    .createHmac('sha256', secret)
    .update(String(licenseKey))
    .digest('hex');
  return `${licenseKey}.${sig}`;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const map = {};
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const rawV = pair.slice(idx + 1).trim();
      try {
        map[k] = decodeURIComponent(rawV);
      } catch (_) {
        map[k] = rawV;
      }
    }
  }
  return map;
}

function isRequestSecure(req, config) {
  if (config.cookieSecure) return true;
  if (req.socket && req.socket.encrypted) return true;
  if (config.trustProxy) {
    const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
    if (proto === 'https') return true;
  }
  return false;
}

function buildAccessCookieHeader(licenseKey, req, config, secret) {
  const signed = signLicensePayload(licenseKey, secret);
  const securePart = isRequestSecure(req, config) ? '; Secure' : '';
  return `${ACCESS_COOKIE_NAME}=${encodeURIComponent(signed)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${ONE_YEAR_SECONDS}${securePart}`;
}

function buildClearCookieHeader(req, config) {
  const securePart = isRequestSecure(req, config) ? '; Secure' : '';
  return `${ACCESS_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${securePart}`;
}

function verifyLicenseFromRequest(req, db) {
  const cookies = parseCookies(req);
  const rawToken = cookies[ACCESS_COOKIE_NAME] || '';
  const dotIdx = rawToken.lastIndexOf('.');
  if (dotIdx <= 0) return null;

  const key = rawToken.slice(0, dotIdx);
  const sig = rawToken.slice(dotIdx + 1);
  if (!key || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', db.signingSecret)
    .update(key)
    .digest('hex');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  return db.findActiveLicenseByKey(key);
}

module.exports = {
  ACCESS_COOKIE_NAME,
  signLicensePayload,
  parseCookies,
  isRequestSecure,
  buildAccessCookieHeader,
  buildClearCookieHeader,
  verifyLicenseFromRequest
};
