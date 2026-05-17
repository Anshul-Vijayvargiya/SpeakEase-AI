import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateWithFallback = async (promptConfig) => {
    const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash",
        "gemini-flash-latest"
    ];

    let lastError;
    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(promptConfig);
            return result;
        } catch (err) {
            console.error(`[WARN] Model ${modelName} failed:`, err.message);
            lastError = err;
        }
    }

    throw lastError;
};

export const client = {
    generateContent: generateWithFallback
};