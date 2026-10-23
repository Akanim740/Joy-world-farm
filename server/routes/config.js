const express = require('express');
const router = express.Router();
const config = require('../config/config');

router.get('/', (req, res) => {
  res.json({
    whatsappNumber: config.whatsappNumber,
    siteName: config.siteName,
    location: 'Port Harcourt, Rivers State, Nigeria',
    email: config.contactEmail,
    deliveryFee: config.deliveryFee,
    nanoAuthEnabled: !!config.nanoAuthEnabled
  });
});

module.exports = router;
