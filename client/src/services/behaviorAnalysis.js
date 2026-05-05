/**
 * behaviorAnalysis.js
 * Service for real-time behavioral analysis using MediaPipe Face Mesh.
 * Enhanced for Iris tracking and gaze ratio calculation.
 */

class BehaviorAnalysisService {
  constructor() {
    this.faceMesh = null;
    this.onResultsCallback = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    if (typeof window.FaceMesh === 'undefined') {
      console.warn('FaceMesh not loaded yet, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.faceMesh = new window.FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true, // Crucial for iris tracking
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    this.faceMesh.onResults((results) => {
      if (this.onResultsCallback) {
        const metrics = this.processResults(results);
        this.onResultsCallback(metrics);
      }
    });

    this.isInitialized = true;
    console.log('BehaviorAnalysisService initialized with Iris tracking');
  }

  setOnResults(callback) {
    this.onResultsCallback = callback;
  }

  async send(image) {
    if (!this.isInitialized) await this.init();
    await this.faceMesh.send({ image });
  }

  processResults(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return { hasFace: false, eyeContact: 0, expression: 'Not Found' };
    }

    const landmarks = results.multiFaceLandmarks[0];
    
    // 1. Eye Contact (Iris Tracking)
    // Left eye corners: 33, 133 | Iris: 468
    // Right eye corners: 362, 263 | Iris: 473
    const eyeContact = this.calculateIrisGaze(landmarks);
    
    // 2. Expression Detection
    const expression = this.detectExpression(landmarks);
    
    // 3. Attention (Head Pose)
    const attention = this.calculateAttention(landmarks);

    return {
      hasFace: true,
      eyeContact: Math.round(eyeContact * 100),
      attention: Math.round(attention * 100),
      expression: expression,
      timestamp: Date.now()
    };
  }

  calculateIrisGaze(landmarks) {
    const leftIris = landmarks[468];
    const rightIris = landmarks[473];
    const nose = landmarks[1];

    // Calculate how centered the iris is relative to the face orientation
    // Simple version: check distance from centers
    const l_dist = Math.sqrt(Math.pow(leftIris.x - 0.5, 2) + Math.pow(leftIris.y - 0.5, 2));
    const r_dist = Math.sqrt(Math.pow(rightIris.x - 0.5, 2) + Math.pow(rightIris.y - 0.5, 2));
    
    const avg_dist = (l_dist + r_dist) / 2;
    // Normalized score: 1.0 is perfectly centered
    let score = 1.0 - (avg_dist * 3);
    
    // Add head pose penalty
    const headTilt = Math.abs(landmarks[10].x - landmarks[152].x);
    score -= headTilt;

    return Math.max(0, Math.min(1, score));
  }

  detectExpression(landmarks) {
    // Mouth corners: 61, 291 | Upper/Lower lip: 13, 14
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];
    const topLip = landmarks[13];
    const bottomLip = landmarks[14];

    const mouthWidth = Math.abs(leftMouth.x - rightMouth.x);
    const mouthHeight = Math.abs(topLip.y - bottomLip.y);
    const ratio = mouthHeight / mouthWidth;

    // Eyebrows
    const leftBrow = landmarks[70];
    const rightBrow = landmarks[300];
    const eyeTop = landmarks[159];
    const browRaise = Math.abs(leftBrow.y - eyeTop.y);

    if (ratio > 0.2) return 'Surprised';
    if (ratio < 0.05 && mouthWidth > 0.15) return 'Confident'; // Smiling
    if (browRaise > 0.08) return 'Nervous';
    
    return 'Focused';
  }

  calculateAttention(landmarks) {
    const nose = landmarks[1];
    const leftEdge = landmarks[234];
    const rightEdge = landmarks[454];
    
    // Center alignment check
    const centerOffset = Math.abs((leftEdge.x + rightEdge.x) / 2 - nose.x);
    return Math.max(0, 1.0 - (centerOffset * 4));
  }
}

export const behaviorAnalyzer = new BehaviorAnalysisService();
