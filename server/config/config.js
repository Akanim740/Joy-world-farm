const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  whatsappNumber: process.env.WHATSAPP_NUMBER || '',
  sessionSecret: process.env.SESSION_SECRET || 'change-this-secret',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'changeme123',
  siteName: process.env.SITE_NAME || 'Joy World Farm',
  siteUrl: process.env.SITE_URL || 'http://localhost:3000',
  contactEmail: process.env.CONTACT_EMAIL || '',
  enableDemoData: process.env.ENABLE_DEMO_DATA === 'true',
  deliveryFee: parseFloat(process.env.DELIVERY_FEE || '0'),
  nanoAuthEnabled: process.env.NANO_AUTH_ENABLED === 'true',
  nanoAuthKey: process.env.NANO_AUTH_KEY || '',
  nanoAuthSecret: process.env.NANO_AUTH_SECRET || ''
};
