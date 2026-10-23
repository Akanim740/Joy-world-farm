const express = require('express');
const router = express.Router();
const config = require('../config/config');

router.get('/', (req, res) => {
  res.json({
    whatsappNumber: config.whatsappNumber || '',
    businessPhone: config.businessPhone || config.whatsappNumber || '',
    phone: config.businessPhone || config.whatsappNumber || '',
    siteName: config.siteName,
    location: config.location || 'Port Harcourt, Rivers State, Nigeria',
    email: config.contactEmail || config.businessEmail || '',
    businessEmail: config.businessEmail || config.contactEmail || '',
    deliveryFee: config.deliveryFee,
    nanoAuthEnabled: !!config.nanoAuthEnabled,
    businessHours: config.businessHours || 'Business hours to be announced'
  });
});

module.exports = router;
