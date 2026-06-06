import { useEffect, useRef, useCallback, useState } from "react";

/**
 * useFaceMesh — production-grade eye-contact & expression tracker
 *
 * Improvements over previous version:
 *  1. Both X & Y iris ratio checked (not just horizontal)
 *  2. Head-pose compensation via nose-tip offset
 *  3. Sliding window (last ~90 frames ≈ 3 s) for responsive %
 *  4. Blink detection to avoid false negatives
 *  5. Per-question reset via `resetEyeData()`
 *  6. Smoothed expression with hysteresis
 *  7. Interval-based auto-initializer for late video srcObject loading
 *  8. Mounted check to prevent memory leaks or async state changes after unmount
 */
const WINDOW_SIZE = 90; // ~3 s at 30 fps

const useFaceMesh = (videoRef) => {
  const [eyeContactPercent, setEyeContactPercent] = useState(0);
  const [attentionPercent, setAttentionPercent]     = useState(0);
  const [expression, setExpression]               = useState("Focused");

  // Sliding window: ring buffer of boolean (looking / not)
  const windowRef      = useRef([]);
  const attWindowRef   = useRef([]);  // attention sliding window
  const faceMeshRef    = useRef(null);
  const cameraRef      = useRef(null);
  const exprCountRef   = useRef({});  // expression hysteresis tracker
  const isMountedRef   = useRef(true);

  /** Expose a reset so InterviewPage can call it per-question */
  const resetEyeData = useCallback(() => {
    windowRef.current = [];
    attWindowRef.current = [];
    exprCountRef.current = {};
    setEyeContactPercent(0);
    setAttentionPercent(0);
    setExpression("Focused");
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────

  /** Iris-ratio for one eye (0 = leftmost, 1 = rightmost) */
  const irisRatioX = (iris, cornerL, cornerR) => {
    const w = Math.abs(cornerR.x - cornerL.x);
    return w > 0.001 ? (iris.x - cornerL.x) / w : 0.5;
  };

  /** Iris-ratio vertically (0 = top, 1 = bottom) */
  const irisRatioY = (iris, top, bottom) => {
    const h = Math.abs(bottom.y - top.y);
    return h > 0.001 ? (iris.y - top.y) / h : 0.5;
  };

  /** EAR (Eye Aspect Ratio) — drops below ~0.2 during blinks */
  const eyeAspectRatio = (landmarks, topIdx, bottomIdx, leftIdx, rightIdx) => {
    const vertical   = Math.abs(landmarks[topIdx].y - landmarks[bottomIdx].y);
    const horizontal = Math.abs(landmarks[leftIdx].x - landmarks[rightIdx].x);
    return horizontal > 0.001 ? vertical / horizontal : 0.3;
  };

  /** Head-pose yaw approximation from nose & face edges */
  const headYawOffset = (landmarks) => {
    const nose  = landmarks[1];
    const left  = landmarks[234];
    const right = landmarks[454];
    const midX  = (left.x + right.x) / 2;
    return nose.x - midX; // negative = turned left, positive = turned right
  };

  /** Head-pose pitch approximation */
  const headPitchOffset = (landmarks) => {
    const nose   = landmarks[1];
    const chin   = landmarks[152];
    const top    = landmarks[10];
    const midY   = (top.y + chin.y) / 2;
    return nose.y - midY;
  };

  // ─── Init ──────────────────────────────────────────────────────

  const initFaceMesh = useCallback(async () => {
    if (!videoRef?.current) return;
    if (!isMountedRef.current) return;

    try {
      const { FaceMesh } = await import("@mediapipe/face_mesh");
      if (!isMountedRef.current) return;

      const { Camera }   = await import("@mediapipe/camera_utils");
      if (!isMountedRef.current) return;

      const faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces:            1,
        refineLandmarks:        true,   // MUST be true for iris (468–477)
        minDetectionConfidence: 0.5,
        minTrackingConfidence:  0.5,
      });

      faceMesh.onResults((results) => {
        if (!isMountedRef.current) return;
        if (!results.multiFaceLandmarks?.length) {
          // No face → count as not looking
          pushWindow(false);
          return;
        }

        const lm = results.multiFaceLandmarks[0];

        // ── 1. Blink check (skip frame if blinking) ──
        const earLeft  = eyeAspectRatio(lm, 159, 145, 33, 133);
        const earRight = eyeAspectRatio(lm, 386, 374, 362, 263);
        const avgEAR   = (earLeft + earRight) / 2;
        if (avgEAR < 0.18) {
          // Blink — don't penalise; skip this frame entirely
          return;
        }

        // ── 2. Iris position (X + Y) ──
        const leftIris   = lm[468];
        const rightIris  = lm[473];

        // X ratio
        const lxRatio = irisRatioX(leftIris,  lm[33],  lm[133]);
        const rxRatio = irisRatioX(rightIris, lm[362], lm[263]);
        const avgX    = (lxRatio + rxRatio) / 2;

        // Y ratio — use upper/lower eyelid landmarks
        const lyRatio = irisRatioY(leftIris,  lm[159], lm[145]);
        const ryRatio = irisRatioY(rightIris, lm[386], lm[374]);
        const avgY    = (lyRatio + ryRatio) / 2;

        // ── 3. Head-pose compensation ──
        const yawOff   = headYawOffset(lm);
        const pitchOff = headPitchOffset(lm);

        // Compensate iris ratio for head turn
        const correctedX = avgX - (yawOff * 1.5);
        const correctedY = avgY - (pitchOff * 1.2);

        // ── 4. "Looking at camera" decision ──
        const isLookingX = correctedX > 0.30 && correctedX < 0.70;
        const isLookingY = correctedY > 0.25 && correctedY < 0.75;
        const isLooking  = isLookingX && isLookingY;

        pushWindow(isLooking);

        // ── 5. Attention from head-pose alignment ──
        calculateAttention(lm);

        // ── 6. Expression detection (with hysteresis) ──
        detectSmoothedExpression(lm);
      });

      faceMeshRef.current = faceMesh;

      // Camera util — feeds video frames to FaceMesh
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (isMountedRef.current && faceMeshRef.current && videoRef.current) {
            try {
              await faceMeshRef.current.send({ image: videoRef.current });
            } catch (err) {
              console.warn("FaceMesh send frame error:", err);
            }
          }
        },
        width:  1280,
        height: 720,
      });

      await camera.start();

      if (!isMountedRef.current) {
        camera.stop();
        faceMesh.close();
        faceMeshRef.current = null;
        return;
      }

      cameraRef.current = camera;
      console.log("✅ FaceMesh v2 initialised (iris + head-pose + blink-aware)");
    } catch (err) {
      console.error("Failed to initialize FaceMesh:", err);
    }
  }, [videoRef]);

  // ─── Sliding Window ────────────────────────────────────────────

  const pushWindow = (isLooking) => {
    const win = windowRef.current;
    win.push(isLooking);
    if (win.length > WINDOW_SIZE) win.shift();

    const lookCount = win.filter(Boolean).length;
    const pct = win.length > 0 ? Math.round((lookCount / win.length) * 100) : 0;
    if (isMountedRef.current) {
      setEyeContactPercent(pct);
    }
  };

  // ─── Attention from Head-Pose Alignment ─────────────────────────

  const calculateAttention = (lm) => {
    const nose      = lm[1];
    const leftEdge  = lm[234];
    const rightEdge = lm[454];
    const yawOffset = Math.abs((leftEdge.x + rightEdge.x) / 2 - nose.x);

    const top       = lm[10];
    const chin      = lm[152];
    const pitchOffset = Math.abs((top.y + chin.y) / 2 - nose.y);

    // 0-1 score: 1 = perfect alignment, 0 = fully turned away
    const raw = Math.max(0, 1.0 - (yawOffset * 3) - (pitchOffset * 2));
    const pct = Math.round(raw * 100);

    const win = attWindowRef.current;
    win.push(pct);
    if (win.length > WINDOW_SIZE) win.shift();

    const avg = win.length > 0
      ? Math.round(win.reduce((a, b) => a + b, 0) / win.length)
      : 0;
    if (isMountedRef.current) {
      setAttentionPercent(avg);
    }
  };

  // ─── Expression with Hysteresis ────────────────────────────────

  const detectSmoothedExpression = (lm) => {
    // Mouth metrics
    const topLip    = lm[13];
    const bottomLip = lm[14];
    const leftMouth = lm[61];
    const rightMouth = lm[291];
    const mouthOpen = Math.abs(bottomLip.y - topLip.y);
    const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
    const mouthRatio = mouthWidth > 0 ? mouthOpen / mouthWidth : 0;

    // Brow metrics
    const leftBrow  = lm[70];
    const leftEye   = lm[159];
    const rightBrow = lm[300];
    const rightEye  = lm[386];
    const browRaise = ((Math.abs(leftBrow.y - leftEye.y) +
                        Math.abs(rightBrow.y - rightEye.y)) / 2);

    // Classify raw
    let raw = "Focused";
    if (mouthRatio > 0.35)                          raw = "Surprised";
    else if (mouthRatio < 0.08 && mouthWidth > 0.12) raw = "Confident";  // smile
    else if (browRaise < 0.02)                       raw = "Nervous";

    // Hysteresis: require 5 consecutive same-label before switching
    const counts = exprCountRef.current;
    counts[raw] = (counts[raw] || 0) + 1;

    // Reset other counters
    Object.keys(counts).forEach((k) => {
      if (k !== raw) counts[k] = 0;
    });

    if (counts[raw] >= 5 && isMountedRef.current) {
      setExpression(raw);
    }
  };

  // ─── Lifecycle ─────────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;

    // Periodically check if video element has active srcObject
    // This solves the race condition where video stream initialization
    // completes after the one-time timeout in the previous version.
    let checkInterval = setInterval(() => {
      if (videoRef?.current?.srcObject && !faceMeshRef.current) {
        clearInterval(checkInterval);
        initFaceMesh();
      }
    }, 500);

    return () => {
      isMountedRef.current = false;
      clearInterval(checkInterval);
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.warn("Error stopping camera:", e);
        }
        cameraRef.current = null;
      }
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch (e) {
          console.warn("Error closing faceMesh:", e);
        }
        faceMeshRef.current = null;
      }
    };
  }, [initFaceMesh, videoRef]);

  return { eyeContactPercent, attentionPercent, expression, resetEyeData };
};

export default useFaceMesh;
