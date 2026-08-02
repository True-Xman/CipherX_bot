const fs = require('fs');

// خواندن فایل .env
const env = fs.readFileSync('.env', 'utf8');

// استخراج توکن BOT_TOKEN
const tokenMatch = env.match(/BOT_TOKEN=([^\r\n]+)/);
const token = tokenMatch ? tokenMatch[1].trim() : null;

if (!token) {
  console.log('❌ BOT_TOKEN not found in .env');
  process.exit(1);
}

console.log('✅ Token found, length:', token.length);

// تست getUpdates
fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=0&timeout=5`)
  .then(res => res.json())
  .then(data => {
    console.log('📩 Response from getUpdates:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => console.error('❌ Error:', err.message));