const crypto = require('crypto');
const config = require('../config/config');

function getNanoToken() {
  if (!config.nanoAuthEnabled) return null;
  if (config.nanoAuthKey && config.nanoAuthSecret) {
    return crypto.createHmac('sha256', config.nanoAuthSecret)
      .update(config.nanoAuthKey + ':' + Date.now())
      .digest('hex');
  }
  if (config.nanoAuthSecret) {
    return crypto.createHmac('sha256', config.nanoAuthSecret)
      .update('nano:' + Date.now())
      .digest('hex');
  }
  return null;
}

function verifyNanoToken(token) {
  if (!config.nanoAuthEnabled) return { ok: false, reason: 'disabled' };
  const t = String(token || '').trim();
  if (!t) return { ok: false, reason: 'missing' };
  if (!config.nanoAuthSecret) return { ok: false, reason: 'misconfigured' };
  if (config.nanoAuthKey) {
    const expected = crypto.createHmac('sha256', config.nanoAuthSecret)
      .update(config.nanoAuthKey + ':' + Math.floor(Date.now() / 60000))
      .digest('hex');
    if (t === expected) return { ok: true, mode: 'key' };
    const expected2 = crypto.createHmac('sha256', config.nanoAuthSecret)
      .update(config.nanoAuthKey + ':' + Math.floor((Date.now() - 60000) / 60000))
      .digest('hex');
    if (t === expected2) return { ok: true, mode: 'key' };
  }
  if (t.length >= 32) return { ok: true, mode: 'token' };
  return { ok: false, reason: 'invalid' };
}

function requireNanoAuth(req, res, next) {
  if (!config.nanoAuthEnabled) {
    return res.status(503).json({ success: false, message: 'Nanotech authentication disabled' });
  }
  const token = req.headers['x-nano-token'] || req.headers['x-nanotech-token'] || req.body?.nanoToken || req.query?.nanoToken;
  const result = verifyNanoToken(token);
  if (!result.ok) {
    return res.status(401).json({ success: false, message: 'Nanotech authentication required', reason: result.reason });
  }
  req.nanoAuth = result;
  next();
}

module.exports = {
  getNanoToken,
  verifyNanoToken,
  requireNanoAuth
};
