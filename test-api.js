const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '.env');
const content = fs.readFileSync(envPath, 'utf8');
let apiKey = '';
for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.startsWith('OPENROUTER_API_KEY=')) {
    apiKey = trimmed.split('=')[1];
  }
}

console.log('API Key loaded:', apiKey ? 'Yes (' + apiKey.substring(0,20) + '...)' : 'No');

// Test API connection
async function testAPI() {
  try {
    console.log('\nTesting connection to OpenRouter...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [{ role: 'user', content: 'Say "Hello" in Vietnamese. Just the word, nothing else.' }],
        max_tokens: 50
      })
    });

    const data = await response.json();

    if (data.error) {
      console.log('API Error:', JSON.stringify(data.error, null, 2));
    } else if (data.choices && data.choices[0]) {
      console.log('API Connected Successfully!');
      console.log('Test response:', data.choices[0].message.content);
    } else {
      console.log('Unexpected response:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log('Connection failed:', e.message);
  }
}

testAPI();
