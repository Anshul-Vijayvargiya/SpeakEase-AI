import admin from 'firebase-admin';

// Ensure that you have the path to your serviceAccountKey.json 
// downloaded from Firebase Console or stored in memory/ENV. 
// For now, initializing without explicit creds works if using default credentials, 
// but we'll try to pick up from an ENV or fallback.

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let serviceAccount;
        try {
            // Attempt to parse the JSON string, ensuring robust handling of stringified JSON
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.trim());
        } catch (parseErr) {
            console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON string. Please ensure it is strictly valid JSON without wrapping quotes.');
            throw parseErr;
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
        console.log('✅ Firebase Admin Initialized Successfully');
    } else {
        // Basic init if the environment isn't set up yet
        admin.initializeApp();
        console.log('⚠️ Firebase Admin Initialized Without Service Account');
    }
} catch (error) {
    console.error('❌ Firebase Admin Init Error:', error.message);
}

export default admin;
