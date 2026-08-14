'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { assets } from "../assets/assets";

export default function Hero() {
  const [ctaReady, setCtaReady] = useState(false);
  const [zoomReady, setZoomReady] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setZoomReady(true));
    const timer = setTimeout(() => setCtaReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-[95vh] md:h-[100vh] overflow-hidden bg-black">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
          zoomReady ? "scale-100" : "scale-110"
        }`}
      >
        <source src={assets.hero} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

      {/* CTA */}
      <div className="absolute inset-0 flex flex-col justify-end items-center text-white z-10 px-4 pb-12">
        <div
          className={`transition-all duration-700 ${
            ctaReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Link href="/shop/bags-and-purses">
            <button className="shop-now-btn relative group px-10 py-3 border border-white/80 text-white tracking-[0.25em] text-sm font-montserrat uppercase overflow-hidden">
              <span className="relative z-10 transition-colors duration-300 group-hover:text-black">
                Shop Now
              </span>
              <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.77,0,0.175,1)]" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
