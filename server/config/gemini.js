import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateWithFallback = async (promptConfig) => {
    // Models ordered by availability & quota. gemini-2.0-flash* have exhausted
    // free-tier quota (limit: 0); gemini-2.5-flash is capped at 20 req/day.
    // Confirmed working models are listed first.
    const modelsToTry = [
        "gemini-2.5-flash-lite",      // ✅ free-tier quota available
        "gemini-flash-lite-latest",   // ✅ free-tier quota available
        "gemini-flash-latest",        // ✅ free-tier quota available
        "gemini-2.5-flash",           // ⚠️ 20 req/day cap
    ];

    let lastError;
    for (const modelName of modelsToTry) {
        try {
            const modelOptions = { model: modelName };
            let cleanPromptConfig = promptConfig;

            if (promptConfig && typeof promptConfig === 'object') {
                if (promptConfig.systemInstruction) {
                    modelOptions.systemInstruction = promptConfig.systemInstruction;
                }
                cleanPromptConfig = { ...promptConfig };
                delete cleanPromptConfig.systemInstruction;
            }

            const model = genAI.getGenerativeModel(modelOptions);
            const result = await model.generateContent(cleanPromptConfig);
            console.log(`[Gemini] Responded using model: ${modelName}`);
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