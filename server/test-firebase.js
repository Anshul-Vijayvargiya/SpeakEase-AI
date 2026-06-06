import admin from './config/firebaseAdmin.js';
import fs from 'fs';

async function testFirebase() {
    fs.appendFileSync('firebase-test-log.txt', 'Testing Firebase Admin...\n');
    try {
        const token = 'fake-token-for-test';
        fs.appendFileSync('firebase-test-log.txt', 'Calling verifyIdToken...\n');

        // This should throw an error quickly if Firebase is properly initialized
        const decodedToken = await admin.auth().verifyIdToken(token);
        fs.appendFileSync('firebase-test-log.txt', 'Success: ' + JSON.stringify(decodedToken) + '\n');
    } catch (error) {
        fs.appendFileSync('firebase-test-log.txt', 'Expected Error Output:\n' + error.message + '\n');
    }
    fs.appendFileSync('firebase-test-log.txt', 'Done testing Firebase.\n');
    process.exit(0);
}

testFirebase();
