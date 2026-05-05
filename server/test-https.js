require('dotenv').config();
const https = require('https');
const fs = require('fs');

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('models.json', data);
        console.log("Written to models.json");
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
