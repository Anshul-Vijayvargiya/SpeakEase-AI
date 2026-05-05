# SpeakEase AI

SpeakEase AI is an advanced, AI-powered interview simulator designed to help candidates prepare for real-world interviews. Built with the MERN stack (MongoDB, Express, React, Node.js), it leverages state-of-the-art Generative AI models and real-time computer vision to provide an immersive and interactive interview experience.

## 🚀 Features

- **AI-Driven Interviews**: Utilizes Google Generative AI and OpenAI models to generate dynamic, context-aware interview questions based on your target role or uploaded resume.
- **Resume Parsing**: Automatically extracts skills and experiences from uploaded resumes (PDF/DOCX) using advanced parsing tools.
- **Real-time Face Tracking**: Integrates `@mediapipe/face_mesh` and camera utilities to monitor user engagement and provide feedback.
- **Real-time Communication**: Uses Socket.io for seamless, low-latency communication between the client and server during the interview.
- **Rich Dashboard & Analytics**: Visualizes interview performance, history, and progress using Recharts and interactive UI components.
- **Cloud Storage**: Securely stores media and files using Cloudinary and Firebase.
- **Modern UI/UX**: Built with React, Tailwind CSS, and Framer Motion for a stunning, responsive, and highly interactive user experience.

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: React 19 (via Vite)
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Redux Toolkit, Zustand
- **Real-time & Media**: Socket.io-client, Video.js, MediaPipe Face Mesh
- **Other Tools**: Axios, Recharts, jsPDF, Monaco Editor

### Backend (Server)
- **Runtime & Framework**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **AI Integration**: `@google/genai`, `@google/generative-ai`, `openai`
- **File Handling & Parsing**: Multer, Cloudinary, pdf-parse, pdf2json, mammoth
- **Real-time**: Socket.io
- **Authentication & Security**: JWT, bcryptjs, Firebase Admin
- **Payments**: Razorpay

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- Git

## ⚙️ Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd SpeakEase-AI
   ```

2. **Install Root Dependencies**:
   The root directory contains a `package.json` with concurrently scripts.
   ```bash
   npm install
   ```

3. **Install Client Dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

## 🔐 Environment Variables

You will need to set up environment variables for both the client and server.

### Server (`server/.env`)
Create a `.env` file in the `server` directory and add the following (replace with your actual keys):
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_google_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Client (`client/.env`)
Create a `.env` file in the `client` directory:
```env
VITE_API_BASE_URL=http://localhost:5000
```

## 🏃‍♂️ Running the Application

You can run both the frontend and backend simultaneously from the root directory using `concurrently`:

```bash
# From the root directory (d:\SpeakEase-AI)
npm run dev
```

Alternatively, you can run them separately:

**Run the Server:**
```bash
npm run server
```

**Run the Client:**
```bash
npm run client
```

The client will typically run on `http://localhost:5173` (Vite default) and the server on `http://localhost:5000`.

## 📄 License
ISC License
