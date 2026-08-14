'use client';

import { useRef, useState, useEffect, useCallback } from "react";
import Title from "./Title";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { assets } from "../assets/assets";

const videos = [
  {
    video: 'https://res.cloudinary.com/jmlpcyog/video/upload/v1783623153/IMG_2974_zpueks.mov',
    caption: "Handcrafted Textiles",
    sub: "Woven by artisans in Andhra Pradesh",
  },
  {
    video: 'https://res.cloudinary.com/jmlpcyog/video/upload/v1783623157/IMG_2973_evaj1r.mov',
    caption: "Living Traditions",
    sub: "Sustainable craft for modern homes",
  },
  {
    video: 'https://res.cloudinary.com/jmlpcyog/video/upload/v1783623147/IMG_2975_hv7g3j.mov',
    caption: "Made With Purpose",
    sub: "Every piece tells a story",
  },
];

function VideoCard({ item, index, isActive, isPlaying, onCardClick, onPlayClick, visible }) {
  const videoRef = useRef(null);

  // When this card stops playing, reset to beginning so poster shows on next hover
  useEffect(() => {
    if (!isPlaying && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isPlaying]);

  return (
    <div
      className="flex-shrink-0 w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${100 + index * 110}ms, transform 0.6s ease ${100 + index * 110}ms`,
      }}
    >
      <div
        className={`group cursor-pointer border transition-all duration-300 ${
          isActive
            ? "border-gray-900 shadow-md"
            : "border-gray-200 hover:border-gray-400"
        }`}
        onClick={() => onCardClick(index)}
      >
        {/* Visual panel */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          {isPlaying ? (
            <video
              ref={videoRef}
              src={item.video}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={item.video}
                preload="metadata"
                muted
                playsInline
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                onLoadedMetadata={(e) => {
                  e.currentTarget.currentTime = 0.1;
                }}
              />

              {/* Bottom gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />

              {/* Play button */}
              <div
                className="absolute inset-0 flex items-center justify-center
                  opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayClick(index);
                }}
              >
                <div
                  className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg
                    transition-transform duration-300 group-hover:scale-110"
                >
                  <Play size={20} fill="black" className="ml-1" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Caption strip */}
        <div className="px-4 py-3.5 bg-white">
          <div className="w-5 h-px bg-black mb-2" />
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-900 truncate">
            {item.caption}
          </p>
          <p className="text-[11px] text-gray-400 font-light mt-0.5 truncate">
            {item.sub}
          </p>
        </div>
      </div>
    </div>
  );
}

function WhatWeDo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.06 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[activeIndex];
    if (card) track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  }, [activeIndex]);

  const goTo = useCallback((i) => {
    setPlayingIndex(null);
    setActiveIndex(i);
  }, []);

  const prev = useCallback(() => goTo(Math.max(0, activeIndex - 1)), [activeIndex, goTo]);
  const next = useCallback(() => goTo(Math.min(videos.length - 1, activeIndex + 1)), [activeIndex, goTo]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && activeIndex < videos.length - 1) goTo(activeIndex + 1);
      if (diff < 0 && activeIndex > 0) goTo(activeIndex - 1);
    }
    touchStartX.current = null;
  };

  return (
    <section
      ref={sectionRef}
      className="py-14 sm:py-16 px-4 sm:px-6 md:px-10 lg:px-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <Title text1="WHAT" text2="WE DO" />
          <p className="text-[11px] text-gray-400 tracking-widest uppercase mt-1.5 font-light">
            Handcraft, tradition &amp; modern purpose
          </p>
        </div>

        {/* Cards track */}
        <div
          ref={trackRef}
          className="flex gap-4 sm:gap-5 overflow-x-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {videos.map((item, index) => (
            <VideoCard
              key={index}
              item={item}
              index={index}
              isActive={activeIndex === index}
              isPlaying={playingIndex === index}
              onCardClick={goTo}
              onPlayClick={setPlayingIndex}
              visible={visible}
            />
          ))}
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            disabled={activeIndex === 0}
            aria-label="Previous story"
            className="w-9 h-9 border border-gray-300 flex items-center justify-center
              disabled:opacity-30 hover:border-black hover:bg-black hover:text-white
              transition-all duration-200"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-400 tracking-widest uppercase">
            {activeIndex + 1} / {videos.length}
          </span>
          <button
            onClick={next}
            disabled={activeIndex === videos.length - 1}
            aria-label="Next story"
            className="w-9 h-9 border border-gray-300 flex items-center justify-center
              disabled:opacity-30 hover:border-black hover:bg-black hover:text-white
              transition-all duration-200"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default WhatWeDo;