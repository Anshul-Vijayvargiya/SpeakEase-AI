import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construct absolute path to the .env file in the same directory as this script
const envPath = resolve(__dirname, '.env');

console.log(`[Bootstrap] Analyzing .env setup...`);
console.log(`[Bootstrap] Current Working Directory (CWD): ${process.cwd()}`);
console.log(`[Bootstrap] Target .env absolute path: ${envPath}`);

// Verify if the file actually exists
if (fs.existsSync(envPath)) {
  console.log(`[Bootstrap] .env file found at target path.`);
} else {
  console.error(`[Bootstrap] .env file NOT FOUND at ${envPath}. Check your file locations!`);
}

// Explicitly load the environment variables from the absolute path
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('[Bootstrap] Error parsing .env file:', result.error.message);
} else {
  const loadedKeys = Object.keys(result.parsed || {});
  console.log(`[Bootstrap] Success! Injected ${loadedKeys.length} variables from .env.`);
  
  if (loadedKeys.includes('MONGO_URI')) {
    console.log(`[Bootstrap] Confirmed 'MONGO_URI' loaded into environment.`);
  }
  if (loadedKeys.includes('OPENAI_API_KEY')) {
    console.log(`[Bootstrap] Confirmed 'OPENAI_API_KEY' loaded into environment.`);
  }
}

export default result;
