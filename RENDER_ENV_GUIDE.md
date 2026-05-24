# SpeakEase AI - Render Deployment Environment Variables Guide

This guide lists all the required and optional environment variables you need to configure in the Render dashboard for both the **Frontend** (Vite) and **Backend** (Express) to function correctly in production.

---

## 1. Backend Environment Variables (Express Server)
These variables must be added to your **Backend Web Service** settings in the Render Dashboard (under **Environment**).

### Required Variables

| Variable Name | Description | Value (Copy & Paste exactly) |
| :--- | :--- | :--- |
| `MONGO_URI` | MongoDB Atlas Connection String | `mongodb+srv://<username>:<password>@cluster0.vr3dzuv.mongodb.net/?appName=Cluster0` (Replace `<username>` and `<password>` with your actual MongoDB Atlas database credentials) |
| `JWT_SECRET` | Secret key used for signing and verifying user authentication tokens | `your_production_jwt_secret_key_here_generate_a_long_random_string` |
| `GEMINI_API_KEY` | API Key for Google Gemini (AI Interview & Feedback generation) | `your_google_gemini_api_key_here` |
| `OPENAI_API_KEY` | OpenAI API Key (used for Whisper voice transcribing and resume parsing) | `your_openai_or_openrouter_api_key_here` |
| `FIREBASE_SERVICE_ACCOUNT` | The Firebase Admin SDK Service Account credentials (JSON format) | *(Copy your project's service account JSON from Firebase Console)* |

#### Exact `FIREBASE_SERVICE_ACCOUNT` Value Format:
```json
{
  "type": "service_account",
  "project_id": "speakease-ai-19336",
  "private_key_id": "your_private_key_id_here",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@speakease-ai-19336.iam.gserviceaccount.com",
  "client_id": "109023576847441850992",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40speakease-ai-19336.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

### Optional Variables

| Variable Name | Description | Value |
| :--- | :--- | :--- |
| `CLIENT_URL` | The frontend domain | `https://speakease-ai.onrender.com` |
| `OPENROUTER_API_KEY` | Optional alternative for OpenRouter models | *(If you have one, otherwise fallback to `OPENAI_API_KEY` is active)* |
| `CLOUDINARY_NAME` | Cloudinary name for video/media storage | *(If you want media storage enabled)* |
| `CLOUDINARY_KEY` | Cloudinary API Key | *(If you want media storage enabled)* |
| `CLOUDINARY_SECRET` | Cloudinary API Secret | *(If you want media storage enabled)* |
| `RAZORPAY_KEY_ID` | Razorpay payment integration key | *(If processing live payments, otherwise falls back to dummy values)* |
| `RAZORPAY_SECRET` | Razorpay payment integration secret | *(If processing live payments, otherwise falls back to dummy values)* |

---

## 2. Frontend Environment Variables (Vite client)
Although we added safe fallback defaults directly inside the code to ensure the frontend loads perfectly even without manual configuration, it is highly recommended to configure them in Render to maintain clean, production-configurable keys.

Add these under the **Environment** tab of your Frontend deployment service on Render:

| Variable Name | Value (Copy & Paste exactly) |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `your_firebase_web_api_key_here` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `speakease-ai-19336.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `speakease-ai-19336` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `speakease-ai-19336.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `925361484506` |
| `VITE_FIREBASE_APP_ID` | `1:925361484506:web:7d183286770f16bfe76be3` |
| `VITE_API_URL` | `https://speakease-backend-web-service-url.onrender.com/api` (Replace with your actual Render Backend Web Service URL) |

---

## 3. How to Add Environment Variables in Render

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click on your **Web Service** or **Static Site** (for your backend and frontend respectively).
3. On the left sidebar, click on the **Environment** tab.
4. Click on **Add Environment Variable**.
5. Copy the **Variable Name** (Key) from above and paste it into the `Key` input.
6. Copy the **Value** from above and paste it into the `Value` input.
7. Repeat this for all required variables.
8. Click **Save Changes**.
9. Render will automatically start a new deployment using your updated environment variables!

---

## 4. Troubleshooting Google Sign-In & `auth/invalid-api-key` Errors

If you encounter `Uncaught FirebaseError: Firebase: Error (auth/invalid-api-key)` or Google Sign-In failures in production, follow these steps to resolve it:

### Step A: Add Environment Variables *Before* Building the Frontend
Since **Vite** is a client-side bundler, it embeds environment variables statically **during the build process**. If you add variables to Render *after* the build has finished, they will not be active in the browser.
1. Go to your **Frontend Static Site** in the Render Dashboard.
2. Under **Environment**, ensure all `VITE_` variables are correctly spelled and filled.
3. **CRITICAL**: Go to the **Events** or **Deployments** tab and click **Manual Deploy > Clear Cache & Deploy** to rebuild the frontend with the correct environment variables baked into the package.

### Step B: Enable Google Sign-In in Firebase Console
Google Sign-In is not enabled by default in new Firebase projects.
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **speakease-ai-19336**.
3. In the left sidebar, navigate to **Build > Authentication**.
4. Click on the **Sign-in method** tab.
5. Click **Add new provider** and select **Google**.
6. Toggle the **Enable** switch, configure the project support email, and click **Save**.

### Step C: Add Your Production Domain to Authorized Domains in Firebase
Firebase blocks OAuth requests originating from unauthorized domains.
1. In the [Firebase Console](https://console.firebase.google.com/), go to **Build > Authentication**.
2. Click on the **Settings** tab (next to Sign-in method).
3. Select **Authorized domains** from the left panel.
4. Click **Add domain** and enter your production site's frontend domain (e.g., `speakease-ai.onrender.com`).
5. Click **Add**.

### Step D: Check for Quotes/Whitespaces in Render Settings
Sometimes copy-pasting API keys can introduce trailing spaces or wrapping quotes (e.g., `"AIzaSy..."` instead of `AIzaSy...`).
- Double-check that none of your keys in the Render Environment settings are wrapped in double quotes (`"`) or single quotes (`'`), and that there are no empty lines or trailing spaces.

