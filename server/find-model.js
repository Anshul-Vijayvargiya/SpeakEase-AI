const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function check() {
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-2.5-flash', 'gemini-pro', 'gemini-1.5-flash-latest'];
    for (let m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("hi");
            console.log("[SUCCESS] " + m);
            require('fs').writeFileSync('working_model.txt', m);
            break;
        } catch (e) {
            console.log("[FAILED] " + m + " - " + e.message.split('\n')[0]);
        }
    }
}
check();
