const express = require('express');
const router = express.Router();
const config = require('../config/config');
const { getNanoToken, verifyNanoToken } = require('../middleware/nanoAuth');

router.get('/nano/status', (req, res) => {
  res.json({
    success: true,
    enabled: !!config.nanoAuthEnabled,
    mode: config.nanoAuthEnabled ? 'nanotech' : 'disabled'
  });
});

router.post('/nano/challenge', (req, res) => {
  if (!config.nanoAuthEnabled) {
    return res.status(503).json({ success: false, message: 'Nanotech authentication disabled' });
  }
  const token = getNanoToken();
  res.json({
    success: true,
    challenge: token,
    expiresIn: 60,
    type: 'nanotech-hmac'
  });
});

router.post('/nano/verify', (req, res) => {
  if (!config.nanoAuthEnabled) {
    return res.status(503).json({ success: false, message: 'Nanotech authentication disabled' });
  }
  const token = req.headers['x-nano-token'] || req.body?.nanoToken || req.body?.token;
  const result = verifyNanoToken(token);
  if (!result.ok) {
    return res.status(401).json({ success: false, message: 'Verification failed', reason: result.reason });
  }
  req.session.nanoAuthenticated = true;
  req.session.nanoAuthMode = result.mode;
  res.json({ success: true, authenticated: true, mode: result.mode });
});

module.exports = router;
