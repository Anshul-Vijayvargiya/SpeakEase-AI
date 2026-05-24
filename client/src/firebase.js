import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCpIrc9nnRWsUB3_FdLoH-Ri2bclP04_IY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "speakease-ai-19336.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "speakease-ai-19336",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "speakease-ai-19336.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "925361484506",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:925361484506:web:7d183286770f16bfe76be3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
