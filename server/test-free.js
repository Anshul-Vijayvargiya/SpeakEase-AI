require('dotenv').config();
const axios = require('axios');

async function testFreeAPI() {
try {
  const result = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    { model: 'google/gemini-2.0-flash-lite-preview-02-05:free', messages: [{ role: 'user', content: 'test' }] },
    { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } }
  );
  console.log('Gemini Free OK:', result.data.choices[0].message.content);
} catch(e) {
  console.error('Gemini Free failed:', e.response ? e.response.data : e.message);
}
}
testFreeAPI();
