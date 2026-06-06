import './env.js';
import axios from 'axios';

axios.post(
  'https://openrouter.ai/api/v1/chat/completions',
  { model: 'anthropic/claude-3.5-sonnet', messages: [{ role: 'user', content: 'test' }] },
  { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } }
).then(r => console.log('OpenRouter OK'))
.catch(e => console.error('OpenRouter Error:', e.response ? e.response.data : e.message));
