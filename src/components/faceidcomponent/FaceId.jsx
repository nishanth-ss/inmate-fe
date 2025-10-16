import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera } from "lucide-react";
import { useSnackbar } from "notistack";

export default function FaceRecognition({ mode = 'register', open, setOpen, setFaceIdData }) {
  const videoRef = useRef();
  const streamRef = useRef(null);
  const [status, setStatus] = useState('Loading models...');
  const [countdown, setCountdown] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const detectionOptions = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416, // smaller = faster
    scoreThreshold: 0.4,
  });

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    const loadModels = async () => {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setStatus("Models loaded. Starting camera...");
      startVideo();
    };

    loadModels();

    return () => {
      stopCamera();
    };
  }, [open]);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        streamRef.current = stream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            const waitForData = setInterval(() => {
              if (videoRef.current && videoRef.current.readyState >= 2) {
                clearInterval(waitForData);
                setStatus("Camera started.");
                startCountdown();
              }
            }, 100);
          } catch (err) {
            enqueueSnackbar("Unable to start video playback", { variant: 'error' });
          }
        };
      })
      .catch(err => {
        console.error("Camera error:", err);
        enqueueSnackbar("Unable to access camera", { variant: 'error' });
      });
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCountdown(null);
  };

  // 🔹 Countdown before detection starts
  const startCountdown = () => {
    let counter = 3;
    setCountdown(counter);
    const timer = setInterval(() => {
      counter -= 1;
      if (counter === 0) {
        clearInterval(timer);
        setCountdown(null);
        setStatus("Looking for your face...");
        startAutoDetection();
      } else {
        setCountdown(counter);
      }
    }, 1000);
  };

  const startAutoDetection = () => {
    let hasCaptured = false;
    let consecutiveDetections = 0;
    const requiredStableDetections = 3;
    const maxDetectionTime = 15000; // 15s timeout
    let isDetecting = false;
    let lastDetectionTime = Date.now();

    setStatus("Align your face roughly in the center and look at the camera.");

    const detectionInterval = setInterval(async () => {
      if (hasCaptured || !videoRef.current || isDetecting) return;
      isDetecting = true;

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, detectionOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          if (Date.now() - lastDetectionTime > 1500) {
            setStatus("No face detected. Please move closer or adjust lighting.");
            lastDetectionTime = Date.now();
          }
          consecutiveDetections = 0;
          isDetecting = false;
          return;
        }

        // --- Bounding Box & Center ---
        const box = detection.detection.box;
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        const faceWidthRatio = box.width / videoWidth;

        const faceCenterX = box.x + box.width / 2;
        const faceCenterY = box.y + box.height / 2;

        const centerOffsetX = Math.abs(faceCenterX - videoWidth / 2) / (videoWidth / 2);
        const centerOffsetY = Math.abs(faceCenterY - videoHeight / 2) / (videoHeight / 2);

        // ✅ Tuned thresholds (balanced)
        const minFaceRatio = 0.2;  // allow smaller faces
        const maxFaceRatio = 0.65; // allow closer faces
        const maxCenterOffsetX = 0.3; // allow some horizontal movement
        const maxCenterOffsetY = 0.3;
        const maxNoseOffset = 0.25; // allow mild rotation

        // --- Distance checks ---
        if (faceWidthRatio < minFaceRatio) {
          setStatus("Move closer to the camera.");
          consecutiveDetections = 0;
          isDetecting = false;
          return;
        }
        if (faceWidthRatio > maxFaceRatio) {
          setStatus("Move slightly farther from the camera.");
          consecutiveDetections = 0;
          isDetecting = false;
          return;
        }

        // --- Center checks ---
        if (centerOffsetX > maxCenterOffsetX) {
          setStatus("Move your face toward the center.");
          consecutiveDetections = 0;
          isDetecting = false;
          return;
        }
        if (centerOffsetY > maxCenterOffsetY) {
          setStatus("Adjust up/down to center your face.");
          consecutiveDetections = 0;
          isDetecting = false;
          return;
        }

        // --- Face Orientation Check ---
        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const nose = landmarks.getNose();

        const leftEyeX = leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length;
        const rightEyeX = rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length;
        const noseX = nose.reduce((sum, p) => sum + p.x, 0) / nose.length;

        const eyeCenterX = (leftEyeX + rightEyeX) / 2;
        const noseOffset = Math.abs(noseX - eyeCenterX) / (rightEyeX - leftEyeX);

        if (noseOffset > maxNoseOffset) {
          setStatus("Please face the camera directly.");
          consecutiveDetections = 0;
          isDetecting = false;
          return;
        }

        const leftEyeY = leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length;
        const rightEyeY = rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length;
        const eyeTilt = Math.abs(leftEyeY - rightEyeY) / box.height;

        if (eyeTilt > 0.1) {
          setStatus("Keep your head level (avoid tilting).");
          consecutiveDetections = 0;
          isDetecting = false;
          return;
        }

        // --- Stable Detection Check ---
        consecutiveDetections++;
        setStatus(`Face aligned (${consecutiveDetections}/${requiredStableDetections})...`);

        if (consecutiveDetections >= requiredStableDetections) {
          hasCaptured = true;
          clearInterval(detectionInterval);
          captureFace(detection.descriptor);
        }
      } catch (err) {
        console.error("Detection error:", err);
      } finally {
        isDetecting = false;
      }
    }, 400); // smoother & faster detection loop

    const timeout = setTimeout(() => {
      if (!hasCaptured) {
        clearInterval(detectionInterval);
        setStatus("No valid face detected. Please try again.");
        enqueueSnackbar("Face not detected. Try again.", { variant: "warning" });
      }
    }, maxDetectionTime);

    const cleanup = () => {
      clearInterval(detectionInterval);
      clearTimeout(timeout);
      isDetecting = false;
    };

    window.addEventListener("beforeunload", cleanup);
    return cleanup;
  };

  const captureFace = async (descriptorFromLoop) => {
    const detections = descriptorFromLoop
      ? { descriptor: descriptorFromLoop }
      : await faceapi
        .detectSingleFace(videoRef.current, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detections) {
      enqueueSnackbar('No face detected. Try again.', { variant: 'warning' });
      return;
    }

    const descriptorArray = Array.from(detections.descriptor);

    if (descriptorArray) {
      setFaceIdData(descriptorArray);
      setOpen(false);
      if (mode === "register") {
        enqueueSnackbar('Face detected successfully!', { variant: 'success' });
      }
    }
  };

  if (!open) return null;

  return (
    <div className='absolute inset-0 flex items-center justify-center z-[9999] bg-black/30'>
      <div className='flex flex-col gap-10 items-center justify-center'>
        <p className='text-xl bg-white px-4 py-2 rounded-md shadow'>
          {countdown !== null ? `Capturing in ${countdown}...` : status}
        </p>
        <video ref={videoRef} autoPlay muted width="480" height="360" className="rounded-xl shadow-md" />
        <div className='flex gap-4'>
          <button
            onClick={() => setOpen(false)}
            className="bg-white px-4 py-2 rounded-xl hover:bg-gray-200 transition"
          >
            Close
          </button>
          <button
            onClick={() => captureFace()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            <Camera size={20} />
            {mode === "register" ? "Register Face" : "Match Face"}
          </button>
        </div>
      </div>
    </div>
  );
}
