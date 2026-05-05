require('dotenv').config();
const axios = require('axios');
axios.get('https://openrouter.ai/api/v1/models').then(r => {
  const freeModels = r.data.data.filter(m => m.pricing.prompt === "0" && m.pricing.completion === "0");
  console.log(freeModels.slice(0, 50).map(m => m.id));
});
