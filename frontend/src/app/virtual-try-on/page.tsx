'use client';

import { useRef, useEffect, useState, Suspense } from "react";
import { Camera, CameraOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Title from "../../components/Title";

const REMOVE_BG_API_KEY = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY || "";

function VirtualTryOnContent() {
  const searchParams = useSearchParams();
  const productImage = searchParams.get('image');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setOverlayImg] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!productImage) return;
    setRemovingBg(true);

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
      setError("Virtual Try-On requires a remove.bg API key.");
      setRemovingBg(false);
      return;
    }

    const form = new FormData();
    form.append("image_url", productImage);
    form.append("size", "auto");

    fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": REMOVE_BG_API_KEY },
      body: form,
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

  const startWebcam = async () => {
    try {
      setLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsWebcamActive(true);
          setLoading(false);
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
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white shadow-lg border-2 border-black p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center border-b border-black pb-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-black mb-4 sm:mb-0">
          Virtual Try-On Experience
        </h2>
        <button
          onClick={isWebcamActive ? stopWebcam : startWebcam}
          className="bg-black text-white font-medium flex items-center gap-2 text-sm px-6 py-3 hover:scale-105 transition-all shadow-md"
        >
          {isWebcamActive ? <CameraOff size={20} /> : <Camera size={20} />}
          {isWebcamActive ? "Stop Camera" : "Start Camera"}
        </button>
      </div>

      {loading && <div className="text-center mt-4 py-3 text-black font-medium">Loading camera...</div>}
      {removingBg && <div className="text-center mt-4 py-3 text-black font-medium">Processing dress image...</div>}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 mt-4">
          <p className="font-medium text-red-700 text-sm mb-1">Try-On unavailable</p>
          <p className="text-red-600 text-sm font-light">{error}</p>
        </div>
      )}

      <div className="relative mt-6 aspect-video bg-gray-100 border-2 border-black shadow-md">
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
          <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-500">
            <Camera size={48} className="mb-4 opacity-40" />
            <p>Camera is turned off</p>
            <p className="text-sm mt-2 max-w-md text-center">
              Click the &quot;Start Camera&quot; button to begin the virtual try-on experience
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VirtualTryOnPage() {
  return (
    <div className="min-h-screen mt-16 sm:mt-20 mb-10 mx-4 sm:mx-8 md:mx-20 px-6 py-10">
      <div className="text-center py-8">
        <Title text1="Virtual" text2="Try-On" />
        <p className="w-full sm:w-3/4 m-auto text-sm md:text-base text-gray-500 mt-4">
          Experience our collection virtually before making a purchase decision
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-12 text-xs uppercase tracking-widest text-gray-400">Loading experience...</div>}>
        <VirtualTryOnContent />
      </Suspense>
    </div>
  );
}
