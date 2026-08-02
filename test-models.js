const apiKey = require('fs').readFileSync('.env', 'utf8').match(/GEMINI_API_KEY=([^\r\n]+)/)[1].trim();

fetch('https://openrouter.ai/api/v1/models', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
})
.then(res => res.json())
.then(data => {
  const free = data.data.filter(m => m.pricing && m.pricing.prompt === '0' && m.pricing.completion === '0');
  console.log('🆓 Free models:');
  free.forEach(m => console.log(`- ${m.id}`));
})
.catch(err => console.error('❌ Error:', err.message));