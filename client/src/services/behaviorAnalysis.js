/**
 * behaviorAnalysis.js
 * Service for real-time behavioral analysis using MediaPipe Face Mesh.
 *
 * v2 — Accurate iris tracking with:
 *   - X + Y gaze ratio
 *   - Head-pose (yaw/pitch) compensation
 *   - Blink-aware scoring (EAR < 0.18 → skip)
 *   - Sliding-window % (last ~90 frames)
 *   - Hysteresis expression detection
 */

const WINDOW_SIZE = 90; // ≈ 3 seconds at 30 fps

class BehaviorAnalysisService {
  constructor() {
    this.faceMesh = null;
    this.onResultsCallback = null;
    this.isInitialized = false;
    this.window = [];             // sliding window of boolean
    this.exprCounts = {};         // expression hysteresis
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
      refineLandmarks: true, // Crucial for iris (landmarks 468-477)
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
    console.log('✅ BehaviorAnalysisService v2 initialized (iris + head-pose + blink)');
  }

  setOnResults(callback) {
    this.onResultsCallback = callback;
  }

  async send(image) {
    if (!this.isInitialized) await this.init();
    await this.faceMesh.send({ image });
  }

  /** Reset sliding window — call per-question */
  reset() {
    this.window = [];
    this.exprCounts = {};
  }

  // ─── Main processor ─────────────────────────────────────────────

  processResults(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      this.pushWindow(false);
      return {
        hasFace: false,
        eyeContact: this.getWindowPercent(),
        attention: 0,
        expression: 'Not Found'
      };
    }

    const lm = results.multiFaceLandmarks[0];

    // ── 1. Blink detection via EAR ──
    const earLeft  = this.ear(lm, 159, 145, 33, 133);
    const earRight = this.ear(lm, 386, 374, 362, 263);
    if ((earLeft + earRight) / 2 < 0.18) {
      // Blink — skip, don't penalise
      return {
        hasFace: true,
        eyeContact: this.getWindowPercent(),
        attention: this.calculateAttention(lm),
        expression: this.currentExpression || 'Focused',
        timestamp: Date.now()
      };
    }

    // ── 2. Iris gaze (X + Y) ──
    const eyeContact = this.calculateIrisGaze(lm);
    this.pushWindow(eyeContact);

    // ── 3. Expression ──
    const expression = this.detectSmoothedExpression(lm);

    // ── 4. Attention (head pose) ──
    const attention = this.calculateAttention(lm);

    return {
      hasFace: true,
      eyeContact: this.getWindowPercent(),
      attention: Math.round(attention * 100),
      expression,
      timestamp: Date.now()
    };
  }

  // ─── Iris Gaze (returns boolean: looking at camera) ─────────────

  calculateIrisGaze(lm) {
    const leftIris  = lm[468];
    const rightIris = lm[473];

    // X ratio (0 = left corner, 1 = right corner)
    const lxW = Math.abs(lm[133].x - lm[33].x);
    const rxW = Math.abs(lm[263].x - lm[362].x);
    const lxRatio = lxW > 0.001 ? (leftIris.x  - lm[33].x)  / lxW : 0.5;
    const rxRatio = rxW > 0.001 ? (rightIris.x - lm[362].x) / rxW : 0.5;
    const avgX = (lxRatio + rxRatio) / 2;

    // Y ratio (0 = top eyelid, 1 = bottom eyelid)
    const lyH = Math.abs(lm[145].y - lm[159].y);
    const ryH = Math.abs(lm[374].y - lm[386].y);
    const lyRatio = lyH > 0.001 ? (leftIris.y  - lm[159].y) / lyH : 0.5;
    const ryRatio = ryH > 0.001 ? (rightIris.y - lm[386].y) / ryH : 0.5;
    const avgY = (lyRatio + ryRatio) / 2;

    // Head-pose compensation
    const yawOff   = this.headYaw(lm);
    const pitchOff = this.headPitch(lm);
    const corrX = avgX - (yawOff * 1.5);
    const corrY = avgY - (pitchOff * 1.2);

    // Sweet-spot: X ∈ [0.30, 0.70], Y ∈ [0.25, 0.75]
    return (corrX > 0.30 && corrX < 0.70 && corrY > 0.25 && corrY < 0.75);
  }

  // ─── Expression with hysteresis ─────────────────────────────────

  detectSmoothedExpression(lm) {
    const topLip     = lm[13];
    const bottomLip  = lm[14];
    const leftMouth  = lm[61];
    const rightMouth = lm[291];

    const mouthOpen  = Math.abs(bottomLip.y - topLip.y);
    const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
    const ratio = mouthWidth > 0 ? mouthOpen / mouthWidth : 0;

    const browRaise = (Math.abs(lm[70].y - lm[159].y) +
                       Math.abs(lm[300].y - lm[386].y)) / 2;

    let raw = 'Focused';
    if (ratio > 0.35)                            raw = 'Surprised';
    else if (ratio < 0.08 && mouthWidth > 0.12)  raw = 'Confident';
    else if (browRaise < 0.02)                   raw = 'Nervous';

    // Hysteresis: 5 consecutive frames before switching
    this.exprCounts[raw] = (this.exprCounts[raw] || 0) + 1;
    Object.keys(this.exprCounts).forEach((k) => {
      if (k !== raw) this.exprCounts[k] = 0;
    });

    if (this.exprCounts[raw] >= 5) {
      this.currentExpression = raw;
    }

    return this.currentExpression || 'Focused';
  }

  // ─── Attention (head pose alignment) ────────────────────────────

  calculateAttention(lm) {
    const nose      = lm[1];
    const leftEdge  = lm[234];
    const rightEdge = lm[454];
    const centerOffset = Math.abs((leftEdge.x + rightEdge.x) / 2 - nose.x);

    const top    = lm[10];
    const chin   = lm[152];
    const vertOffset = Math.abs((top.y + chin.y) / 2 - nose.y);

    return Math.max(0, 1.0 - (centerOffset * 3) - (vertOffset * 2));
  }

  // ─── Utility ────────────────────────────────────────────────────

  /** Eye Aspect Ratio — < 0.18 means blink */
  ear(lm, topIdx, bottomIdx, leftIdx, rightIdx) {
    const v = Math.abs(lm[topIdx].y - lm[bottomIdx].y);
    const h = Math.abs(lm[leftIdx].x - lm[rightIdx].x);
    return h > 0.001 ? v / h : 0.3;
  }

  /** Head yaw (left-right turn) */
  headYaw(lm) {
    const midX = (lm[234].x + lm[454].x) / 2;
    return lm[1].x - midX;
  }

  /** Head pitch (up-down tilt) */
  headPitch(lm) {
    const midY = (lm[10].y + lm[152].y) / 2;
    return lm[1].y - midY;
  }

  /** Sliding-window percentage */
  pushWindow(isLooking) {
    this.window.push(isLooking);
    if (this.window.length > WINDOW_SIZE) this.window.shift();
  }

  getWindowPercent() {
    if (this.window.length === 0) return 0;
    const count = this.window.filter(Boolean).length;
    return Math.round((count / this.window.length) * 100);
  }
}

export const behaviorAnalyzer = new BehaviorAnalysisService();
