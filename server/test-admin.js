require('dotenv').config();
const admin = require('./config/firebaseAdmin');

console.log("TEST: Is Firebase Admin configured with a Service Account?");

try {
    const app = admin.app();
    console.log("App Name:", app.name);
    console.log("Project ID:", app.options.projectId || "NOT SET (This means it's using default unauthenticated init)");

    if (!app.options.credential) {
        console.log("❌ ERROR: No credential attached to the app. Tokens cannot be verified.");
    } else {
        console.log("✅ Credentials found.");
    }
} catch (e) {
    console.log("Error testing admin init:", e.message);
}
