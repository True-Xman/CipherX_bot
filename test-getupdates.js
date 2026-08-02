const { get } = require('https');
const fs = require('fs');

// خواندن توکن از .env
const env = fs.readFileSync('.env', 'utf8');
const token = env.match(/BOT_TOKEN=([^\r\n]+)/)[1].trim();

const url = `https://api.telegram.org/bot${token}/getUpdates?offset=0&timeout=5`;

get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('📩 Response from getUpdates:');
    console.log(JSON.parse(data));
  });
}).on('error', (err) => {
  console.error('❌ Error:', err);
});