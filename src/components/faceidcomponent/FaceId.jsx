import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera } from "lucide-react";
import { useSnackbar } from "notistack";

export default function FaceRecognition({ mode = 'register', open, setOpen, setFaceIdData }) {
  const videoRef = useRef();
  const streamRef = useRef(null);
  const [status, setStatus] = useState('Loading models...');
  const [countdown, setCountdown] = useState(null); // countdown state
  const { enqueueSnackbar } = useSnackbar();

  const detectionOptions = new faceapi.TinyFaceDetectorOptions({
    inputSize: 608,
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
                startCountdown(); // 🔹 trigger countdown before detection
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
        startAutoDetection(); // start detection after countdown
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

  setStatus("Align your face in the center box and look straight at the camera.");

  const detectionInterval = setInterval(async () => {
    if (hasCaptured || !videoRef.current) return;

    if (!(videoRef.current instanceof HTMLVideoElement) || videoRef.current.readyState < 2) {
      return;
    }

    const detection = await faceapi
      .detectSingleFace(videoRef.current, detectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      consecutiveDetections = 0;
      setStatus("No face detected. Please move closer to the camera.");
      return;
    }

    // --- Bounding Box & Center ---
    const box = detection.detection.box;
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    const faceWidthRatio = box.width / videoWidth;

    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;

    // Center offset (0 = perfect center)
    const centerOffsetX = Math.abs(faceCenterX - videoWidth / 2) / (videoWidth / 2);
    const centerOffsetY = Math.abs(faceCenterY - videoHeight / 2) / (videoHeight / 2);

    // ✅ Stricter alignment thresholds
    const minFaceRatio = 0.3;  // closer required (was 0.25)
    const maxFaceRatio = 0.55; // less zoomed-in allowed (was 0.6)
    const maxCenterOffsetX = 0.15; // tighter horizontal centering (was 0.25)
    const maxCenterOffsetY = 0.20; // moderate vertical centering

    // --- Distance checks ---
    if (faceWidthRatio < minFaceRatio) {
      consecutiveDetections = 0;
      setStatus("Move closer to the camera.");
      return;
    }

    if (faceWidthRatio > maxFaceRatio) {
      consecutiveDetections = 0;
      setStatus("Move slightly farther from the camera.");
      return;
    }

    // --- Center checks ---
    if (centerOffsetX > maxCenterOffsetX) {
      consecutiveDetections = 0;
      setStatus("Move to the center of the frame (left/right).");
      return;
    }

    if (centerOffsetY > maxCenterOffsetY) {
      consecutiveDetections = 0;
      setStatus("Adjust vertically to center your face.");
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
    const maxNoseOffset = 0.15; // tighter — requires facing straight

    if (noseOffset > maxNoseOffset) {
      consecutiveDetections = 0;
      setStatus("Please face the camera directly (don’t turn sideways).");
      return;
    }

    const leftEyeY = leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length;
    const rightEyeY = rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length;
    const eyeTilt = Math.abs(leftEyeY - rightEyeY) / box.height;

    if (eyeTilt > 0.08) {
      consecutiveDetections = 0;
      setStatus("Keep your head level (don’t tilt).");
      return;
    }

    // --- Stable Detection Check ---
    consecutiveDetections++;
    setStatus(`Perfect alignment (${consecutiveDetections}/${requiredStableDetections})...`);

    if (consecutiveDetections >= requiredStableDetections) {
      hasCaptured = true;
      clearInterval(detectionInterval);
      captureFace(detection.descriptor);
    }
  }, 500);

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
        enqueueSnackbar('Face detected', { variant: 'success' });
      }
      return;
    }
  };

  if (!open) return null;

  return (
    <div className='absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center z-9999 bg-black/30'>
      <div className='flex flex-col gap-10 items-center justify-center'>
        <p className='text-xl bg-white px-4 py-2 rounded-sm'>
          {countdown !== null ? `Capturing in ${countdown}...` : status}
        </p>
        <video ref={videoRef} autoPlay muted width="480" height="360" />
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
