import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
// Extract the multi-line JSON part
const jsonStart = envContent.indexOf('{');
const jsonEnd = envContent.lastIndexOf('}');

if (jsonStart !== -1 && jsonEnd !== -1) {
    const topPart = envContent.substring(0, jsonStart);
    let jsonStr = envContent.substring(jsonStart, jsonEnd + 1);
    const bottomPart = envContent.substring(jsonEnd + 1);

    try {
        const parsed = JSON.parse(jsonStr);
        const singleLineJsonStr = JSON.stringify(parsed);
        // Assuming FIREBASE_SERVICE_ACCOUNT= is right before the JSON
        const updatedTopPart = topPart.replace(/FIREBASE_SERVICE_ACCOUNT=\s*$/, `FIREBASE_SERVICE_ACCOUNT=${singleLineJsonStr}`);

        fs.writeFileSync('.env', updatedTopPart + bottomPart);
        console.log("Successfully formatted FIREBASE_SERVICE_ACCOUNT into a single line.");
    } catch (e) {
        console.error("Failed to parse the multi-line JSON:", e);
    }
} else {
    console.log("No JSON block found.");
}
