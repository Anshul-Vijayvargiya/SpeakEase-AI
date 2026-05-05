import { useEffect, useRef, useCallback, useState } from "react";

const useFaceMesh = (videoRef) => {
  const [eyeContactPercent, setEyeContactPercent] = useState(0);
  const [expression, setExpression]               = useState("Focused");
  const eyeDataRef    = useRef({ looking: 0, total: 0 });
  const faceMeshRef   = useRef(null);
  const cameraRef     = useRef(null);
  const animFrameRef  = useRef(null);

  const initFaceMesh = useCallback(async () => {
    if (!videoRef?.current) return;

    const { FaceMesh } = await import("@mediapipe/face_mesh");
    const { Camera }   = await import("@mediapipe/camera_utils");

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces:            1,
      refineLandmarks:        true,   // needed for iris
      minDetectionConfidence: 0.5,
      minTrackingConfidence:  0.5,
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks?.length) return;

      const landmarks = results.multiFaceLandmarks[0];

      // ── Eye contact via iris position ──────────────
      // Left iris center: landmark 468
      // Right iris center: landmark 473
      // Left eye corners: 33 (left), 133 (right)
      // Right eye corners: 362 (left), 263 (right)

      const leftIris  = landmarks[468];
      const rightIris = landmarks[473];
      const leftCornerL  = landmarks[33];
      const leftCornerR  = landmarks[133];
      const rightCornerL = landmarks[362];
      const rightCornerR = landmarks[263];

      const leftEyeWidth  = Math.abs(leftCornerR.x  - leftCornerL.x);
      const rightEyeWidth = Math.abs(rightCornerR.x - rightCornerL.x);

      const leftRatio  = leftEyeWidth  > 0
        ? (leftIris.x  - leftCornerL.x)  / leftEyeWidth  : 0.5;
      const rightRatio = rightEyeWidth > 0
        ? (rightIris.x - rightCornerL.x) / rightEyeWidth : 0.5;

      const avgRatio   = (leftRatio + rightRatio) / 2;
      // If iris is near center (0.35–0.65) → looking at camera
      const isLooking  = avgRatio > 0.35 && avgRatio < 0.65;

      eyeDataRef.current.total++;
      if (isLooking) eyeDataRef.current.looking++;

      const percent = eyeDataRef.current.total > 0
        ? Math.round(
            (eyeDataRef.current.looking / eyeDataRef.current.total) * 100
          )
        : 0;

      setEyeContactPercent(percent);

      // ── Expression via face geometry ───────────────
      // Mouth openness: top lip 13, bottom lip 14
      // Brow raise: brow 70 vs eye 159 (left)
      const topLip     = landmarks[13];
      const bottomLip  = landmarks[14];
      const mouthOpen  = Math.abs(bottomLip.y - topLip.y);

      const leftBrow   = landmarks[70];
      const leftEye    = landmarks[159];
      const browRaise  = Math.abs(leftBrow.y - leftEye.y);

      let detectedExpr = "Neutral";
      if (mouthOpen > 0.04)           detectedExpr = "Smiling";
      else if (browRaise < 0.02)      detectedExpr = "Nervous";
      else if (browRaise > 0.05)      detectedExpr = "Confident";
      else                            detectedExpr = "Focused";

      setExpression(detectedExpr);
    });

    faceMeshRef.current = faceMesh;

    // Camera util feeds frames to FaceMesh
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (faceMeshRef.current && videoRef.current) {
          await faceMeshRef.current.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    await camera.start();
    cameraRef.current = camera;
    console.log("FaceMesh initialized successfully");
  }, [videoRef]);

  useEffect(() => {
    // Wait for video to be ready
    const timer = setTimeout(() => {
      if (videoRef?.current?.srcObject) {
        initFaceMesh();
      }
    }, 2000); // 2s delay for stream to stabilize

    return () => {
      clearTimeout(timer);
      cameraRef.current?.stop();
      faceMeshRef.current?.close();
    };
  }, [initFaceMesh, videoRef]);

  return { eyeContactPercent, expression };
};

export default useFaceMesh;
