const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const client = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function run() {
    try {
        const result = await client.generateContent("hi");
        console.log("SUCCESS:", result.response.text());
    } catch (e) {
        console.error("FAILED:", e.message);
    }
}
run();
