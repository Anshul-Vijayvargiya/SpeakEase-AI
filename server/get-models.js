import axios from 'axios';

async function main() {
  try {
    const res = await axios.get('https://openrouter.ai/api/v1/models');
    const freeModels = res.data.data.filter(m => m.id.includes(':free') || m.id.includes('/free'));
    console.log('Free Models found:', freeModels.map(m => m.id));
  } catch (e) {
    console.error(e.message);
  }
}
main();
