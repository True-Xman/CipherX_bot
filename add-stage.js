const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'bot.db');
const db = new sqlite3.Database(dbPath);

db.run(`ALTER TABLE users ADD COLUMN current_stage INTEGER DEFAULT 1;`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✅ ستون current_stage از قبل وجود دارد.');
    } else {
      console.error('❌ خطا:', err.message);
    }
  } else {
    console.log('✅ ستون current_stage با موفقیت اضافه شد.');
  }
  db.close();
});