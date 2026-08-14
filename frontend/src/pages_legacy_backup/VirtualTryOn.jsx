import { useRef, useEffect, useState } from "react";
import { Pose } from "@mediapipe/pose";
import { Camera, CameraOff } from "lucide-react";
import { useLocation } from "react-router-dom";
import Title from "../components/Title";
import usePageMeta from "../components/usePageMeta";

const REMOVE_BG_API_KEY = import.meta.env.VITE_REMOVE_BG_API_KEY || "";

const VirtualTryOn = () => {
  usePageMeta({
    title: 'Virtual Try-On',
    description: 'Experience and test our handcrafted collection virtually with your webcam before buying. Conscious, interactive luxury.'
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [error, setError] = useState(null);
  const [overlayImg, setOverlayImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);

  const location = useLocation();
  const productImage = location.state?.image;

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => stopWebcam();
  }, []);

  // 2. Remove background from product image (dress)
  useEffect(() => {
    if (!productImage) return;
    setRemovingBg(true);

    // Check if already processed (cache)
    const cached = sessionStorage.getItem(productImage);
    if (cached) {
      const img = new window.Image();
      img.src = cached;
      img.onload = () => {
        setOverlayImg(img);
        setRemovingBg(false);
      };
      return;
    }

    if (!REMOVE_BG_API_KEY) {
      setError("Virtual Try-On requires a remove.bg API key. Add VITE_REMOVE_BG_API_KEY to your .env file.");
      setRemovingBg(false);
      return;
    }

    // Remove.bg API call
    fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_API_KEY,
      },
      body: (() => {
        const form = new FormData();
        form.append("image_url", productImage);
        form.append("size", "auto");
        return form;
      })(),
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        sessionStorage.setItem(productImage, url);
        const img = new window.Image();
        img.src = url;
        img.onload = () => {
          setOverlayImg(img);
          setRemovingBg(false);
        };
      })
      .catch((err) => {
        console.error("Remove.bg API Error:", err);
        setError("Failed to remove background from product image.");
        setRemovingBg(false);
      });
  }, [productImage]);

  // 3. Pose detection and overlay
  const startPoseDetection = async () => {
    if (!videoRef.current) return;
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results) => onPoseResults(results));

    const processFrame = async () => {
      if (videoRef.current?.readyState === 4) {
        await pose.send({ image: videoRef.current });
      }
      requestAnimationFrame(processFrame);
    };
    processFrame();
  };

  const onPoseResults = (results) => {
    if (!canvasRef.current || !overlayImg) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(results.image, 0, 0, 640, 480);

    if (results.poseLandmarks) {
      const leftShoulder = results.poseLandmarks[11];
      const rightShoulder = results.poseLandmarks[12];

      const shoulderX = ((leftShoulder.x + rightShoulder.x) / 2) * 640;
      const shoulderY = ((leftShoulder.y + rightShoulder.y) / 2) * 480;

      const clothingWidth = Math.abs(leftShoulder.x - rightShoulder.x) * 640 * 1.5;
      const clothingHeight = (clothingWidth * overlayImg.height) / overlayImg.width;

      ctx.globalAlpha = 0.95;
      ctx.drawImage(
        overlayImg,
        shoulderX - clothingWidth / 2,
        shoulderY,
        clothingWidth,
        clothingHeight
      );
      ctx.globalAlpha = 1;
    }
  };

  // 4. Webcam controls
  const startWebcam = async () => {
    try {
      setLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsWebcamActive(true);
          setLoading(false);
          startPoseDetection();
        };
      }
    } catch (err) {
      console.error("Webcam Access Error:", err);
      setError("Could not access webcam. Ensure camera permissions are granted.");
      setLoading(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
  };

  return (
    <div className="min-h-screen mt-16 mb-10 mx-4 sm:mx-8 md:mx-20 px-6 py-10">
      <div className="text-center py-8">
        <Title text1="Virtual" text2="Try-On" />
        <p className="w-full sm:w-3/4 m-auto text-sm md:text-base text-text-light mt-4">
          Experience our collection virtually before making a purchase decision
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto bg-white shadow-lg rounded-lg border-2 border-black p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center border-b border-black pb-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-black mb-4 sm:mb-0">
            Virtual Try-On Experience
          </h2>
          <button
            onClick={isWebcamActive ? stopWebcam : startWebcam}
            className="bg-black text-white font-medium flex items-center gap-2 text-sm px-6 py-3 rounded-md hover:scale-105 transition-all duration-300 shadow-md"
          >
            {isWebcamActive ? <CameraOff size={20} /> : <Camera size={20} />}
            {isWebcamActive ? "Stop Camera" : "Start Camera"}
          </button>
        </div>

        {loading && (
          <div className="text-center mt-4 py-3 text-black font-medium">
            Loading camera...
          </div>
        )}

        {removingBg && (
          <div className="text-center mt-4 py-3 text-black font-medium">
            Processing dress image...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mt-4" role="alert">
            <p className="font-medium text-red-700 text-sm mb-1">Try-On unavailable</p>
            <p className="text-red-600 text-sm font-light">{error}</p>
            {error.includes('VITE_REMOVE_BG_API_KEY') && (
              <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-red-700 underline hover:text-red-900">
                Get a free remove.bg API key →
              </a>
            )}
          </div>
        )}

        <div className="relative mt-6 aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-black shadow-md">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${!isWebcamActive && "hidden"}`}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className={`absolute inset-0 w-full h-full object-cover ${!isWebcamActive && "hidden"}`}
          />
          {!isWebcamActive && (
            <div className="absolute inset-0 flex items-center justify-center flex-col text-text-light">
              <Camera size={48} className="mb-4 opacity-40" />
              <p>Camera is turned off</p>
              <p className="text-sm mt-2 max-w-md text-center">
                Click the "Start Camera" button to begin the virtual try-on experience
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;