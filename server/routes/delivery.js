const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/zones', (req, res) => {
  try {
    const zones = db.prepare('SELECT * FROM delivery_zones WHERE active = 1 ORDER BY delivery_fee ASC').all();
    res.json({ success: true, zones });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching delivery zones' });
  }
});

router.post('/calculate', (req, res) => {
  try {
    const { zoneId } = req.body;
    if (!zoneId) {
      return res.json({ success: true, fee: 0, requiresConfirmation: true, message: 'Contact us to confirm delivery availability and fees.' });
    }
    const zone = db.prepare('SELECT * FROM delivery_zones WHERE id = ? AND active = 1').get(zoneId);
    if (!zone) {
      return res.json({ success: true, fee: null, requiresConfirmation: true, message: 'Selected zone not available. Please contact us for a manual quote.' });
    }
    const fee = Number(zone.delivery_fee) || 0;
    res.json({ success: true, fee, zoneId: zone.id, zoneName: zone.zone_name, message: `Delivery to ${zone.zone_name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error calculating delivery fee' });
  }
});

module.exports = router;
