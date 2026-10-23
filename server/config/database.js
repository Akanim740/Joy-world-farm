const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Allow the database file location to be overridden (useful for tests).
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'db', 'joyworldfarm.db');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

module.exports = db;
