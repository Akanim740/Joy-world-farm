const bcrypt = require('bcryptjs');
const config = require('../config/config');
const db = require('../config/database');

function initializeAdmin() {
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin').get();
  if (adminCount.count === 0) {
    const hashedPassword = bcrypt.hashSync(config.adminPassword, 10);
    db.prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)').run(
      config.adminUsername,
      hashedPassword
    );
    console.log('Admin account initialized');
  }
}

module.exports = initializeAdmin;
