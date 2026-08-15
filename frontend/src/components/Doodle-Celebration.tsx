'use client';

import { useState, useEffect } from 'react';
import { PartyPopper } from 'lucide-react';

// ============================================================================
// Independence Day Campaign Configuration
// Set FORCE_INDEPENDENCE_DAY_CELEBRATION to false after the campaign period
// ============================================================================
const FORCE_INDEPENDENCE_DAY_CELEBRATION = true;

const isIndependenceDayActive = (): boolean => {
  if (FORCE_INDEPENDENCE_DAY_CELEBRATION) return true;
  const now = new Date();
  const month = now.getMonth(); // 7 is August (0-indexed)
  const date = now.getDate();
  return month === 7 && date >= 13 && date <= 16;
};

// Per-plane visual spec — keeps all three trails/jets consistent and easy to tune
const PLANES = [
  {
    id: 'saffron',
    animation: 'flypast-saffron',
    delay: '0s',
    core: '#FFB35C',
    edge: '#FF7A00',
    glow: 'rgba(255, 138, 0, 0.55)',
    planeFill: '#FF9933',
    size: 'w-7 h-7 sm:w-10 sm:h-10',
    trailHeight: '16px',
    trailHeightSm: '20px',
  },
  {
    id: 'white',
    animation: 'flypast-white',
    delay: '0.12s',
    core: '#FFFFFF',
    edge: '#F3F1EC',
    glow: 'rgba(255, 255, 255, 0.75)',
    planeFill: '#FFFFFF',
    size: 'w-8 h-8 sm:w-11 sm:h-11',
    trailHeight: '18px',
    trailHeightSm: '22px',
  },
  {
    id: 'green',
    animation: 'flypast-green',
    delay: '0.24s',
    core: '#4CBF4A',
    edge: '#0E7A08',
    glow: 'rgba(19, 136, 8, 0.55)',
    planeFill: '#138808',
    size: 'w-7 h-7 sm:w-10 sm:h-10',
    trailHeight: '16px',
    trailHeightSm: '20px',
  },
] as const;

export default function DoodleCelebration() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isIndependenceDayActive()) return null;

  const triggerFlypast = () => {
    if (isAnimating) return;

    // Respect reduced-motion users — the flypast is a decorative flourish,
    // not core functionality, so we simply skip it rather than force motion.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    setIsAnimating(true);

    // Total animation duration: 4.4 seconds
    setTimeout(() => {
      setIsAnimating(false);
    }, 4400);
  };

  return (
    <>
      {/*
        Flight paths: a single quadratic-bezier "spine" curve (the saffron
        plane) sampled every 2.5% (41 points), bottom-left to top-right.

        White and green are NOT independently-authored curves — they are
        rigid parallel translations of the saffron spine (white = spine +
        (-5vw, +8vh), green = spine + (-10vw, +16vh), applied at every
        sample point, not just the endpoints). Because translation doesn't
        change a curve's tangent, all three planes share the exact same
        rotation value at every keyframe — the formation is geometrically
        guaranteed to stay parallel from launch to exit, instead of each
        plane's heading being hand-tuned per curve (which previously let
        the trailing green plane drift ~5deg out of alignment with the
        other two at takeoff). To retune spacing, only the two offset
        constants need to change — every rotation value stays shared.
      */}
      <style>{`
        @keyframes flypast-saffron {
          0% { transform: translate3d(-25.00vw, 62.00vh, 0) rotate(-47.49deg); opacity: 0; }
          2.5% { transform: translate3d(-22.23vw, 59.04vh, 0) rotate(-46.24deg); opacity: 0.42; }
          5% { transform: translate3d(-19.41vw, 56.16vh, 0) rotate(-44.97deg); opacity: 0.83; }
          7.5% { transform: translate3d(-16.54vw, 53.36vh, 0) rotate(-43.69deg); opacity: 1; }
          10% { transform: translate3d(-13.63vw, 50.64vh, 0) rotate(-42.40deg); opacity: 1; }
          12.5% { transform: translate3d(-10.67vw, 48.00vh, 0) rotate(-41.09deg); opacity: 1; }
          15% { transform: translate3d(-7.67vw, 45.44vh, 0) rotate(-39.77deg); opacity: 1; }
          17.5% { transform: translate3d(-4.62vw, 42.96vh, 0) rotate(-38.44deg); opacity: 1; }
          20% { transform: translate3d(-1.52vw, 40.56vh, 0) rotate(-37.10deg); opacity: 1; }
          22.5% { transform: translate3d(1.62vw, 38.24vh, 0) rotate(-35.76deg); opacity: 1; }
          25% { transform: translate3d(4.81vw, 36.00vh, 0) rotate(-34.40deg); opacity: 1; }
          27.5% { transform: translate3d(8.05vw, 33.84vh, 0) rotate(-33.05deg); opacity: 1; }
          30% { transform: translate3d(11.33vw, 31.76vh, 0) rotate(-31.68deg); opacity: 1; }
          32.5% { transform: translate3d(14.66vw, 29.76vh, 0) rotate(-30.32deg); opacity: 1; }
          35% { transform: translate3d(18.03vw, 27.84vh, 0) rotate(-28.96deg); opacity: 1; }
          37.5% { transform: translate3d(21.45vw, 26.00vh, 0) rotate(-27.60deg); opacity: 1; }
          40% { transform: translate3d(24.92vw, 24.24vh, 0) rotate(-26.24deg); opacity: 1; }
          42.5% { transform: translate3d(28.43vw, 22.56vh, 0) rotate(-24.88deg); opacity: 1; }
          45% { transform: translate3d(31.99vw, 20.96vh, 0) rotate(-23.53deg); opacity: 1; }
          47.5% { transform: translate3d(35.60vw, 19.44vh, 0) rotate(-22.19deg); opacity: 1; }
          50% { transform: translate3d(39.25vw, 18.00vh, 0) rotate(-20.85deg); opacity: 1; }
          52.5% { transform: translate3d(42.95vw, 16.64vh, 0) rotate(-19.53deg); opacity: 1; }
          55% { transform: translate3d(46.69vw, 15.36vh, 0) rotate(-18.22deg); opacity: 1; }
          57.5% { transform: translate3d(50.48vw, 14.16vh, 0) rotate(-16.92deg); opacity: 1; }
          60% { transform: translate3d(54.32vw, 13.04vh, 0) rotate(-15.63deg); opacity: 1; }
          62.5% { transform: translate3d(58.20vw, 12.00vh, 0) rotate(-14.36deg); opacity: 1; }
          65% { transform: translate3d(62.13vw, 11.04vh, 0) rotate(-13.10deg); opacity: 1; }
          67.5% { transform: translate3d(66.11vw, 10.16vh, 0) rotate(-11.86deg); opacity: 1; }
          70% { transform: translate3d(70.13vw, 9.36vh, 0) rotate(-10.64deg); opacity: 1; }
          72.5% { transform: translate3d(74.20vw, 8.64vh, 0) rotate(-9.44deg); opacity: 1; }
          75% { transform: translate3d(78.31vw, 8.00vh, 0) rotate(-8.25deg); opacity: 1; }
          77.5% { transform: translate3d(82.47vw, 7.44vh, 0) rotate(-7.08deg); opacity: 1; }
          80% { transform: translate3d(86.68vw, 6.96vh, 0) rotate(-5.94deg); opacity: 1; }
          82.5% { transform: translate3d(90.93vw, 6.56vh, 0) rotate(-4.81deg); opacity: 1; }
          85% { transform: translate3d(95.23vw, 6.24vh, 0) rotate(-3.71deg); opacity: 1; }
          87.5% { transform: translate3d(99.58vw, 6.00vh, 0) rotate(-2.62deg); opacity: 1; }
          90% { transform: translate3d(103.97vw, 5.84vh, 0) rotate(-1.56deg); opacity: 1; }
          92.5% { transform: translate3d(108.41vw, 5.76vh, 0) rotate(-0.51deg); opacity: 1; }
          95% { transform: translate3d(112.89vw, 5.76vh, 0) rotate(0.51deg); opacity: 0.83; }
          97.5% { transform: translate3d(117.42vw, 5.84vh, 0) rotate(1.51deg); opacity: 0.42; }
          100% { transform: translate3d(122.00vw, 6.00vh, 0) rotate(2.49deg); opacity: 0; }
        }

        @keyframes flypast-white {
          0% { transform: translate3d(-30.00vw, 70.00vh, 0) rotate(-47.49deg); opacity: 0; }
          2.5% { transform: translate3d(-27.23vw, 67.04vh, 0) rotate(-46.24deg); opacity: 0.42; }
          5% { transform: translate3d(-24.41vw, 64.16vh, 0) rotate(-44.97deg); opacity: 0.83; }
          7.5% { transform: translate3d(-21.54vw, 61.36vh, 0) rotate(-43.69deg); opacity: 1; }
          10% { transform: translate3d(-18.63vw, 58.64vh, 0) rotate(-42.40deg); opacity: 1; }
          12.5% { transform: translate3d(-15.67vw, 56.00vh, 0) rotate(-41.09deg); opacity: 1; }
          15% { transform: translate3d(-12.67vw, 53.44vh, 0) rotate(-39.77deg); opacity: 1; }
          17.5% { transform: translate3d(-9.62vw, 50.96vh, 0) rotate(-38.44deg); opacity: 1; }
          20% { transform: translate3d(-6.52vw, 48.56vh, 0) rotate(-37.10deg); opacity: 1; }
          22.5% { transform: translate3d(-3.38vw, 46.24vh, 0) rotate(-35.76deg); opacity: 1; }
          25% { transform: translate3d(-0.19vw, 44.00vh, 0) rotate(-34.40deg); opacity: 1; }
          27.5% { transform: translate3d(3.05vw, 41.84vh, 0) rotate(-33.05deg); opacity: 1; }
          30% { transform: translate3d(6.33vw, 39.76vh, 0) rotate(-31.68deg); opacity: 1; }
          32.5% { transform: translate3d(9.66vw, 37.76vh, 0) rotate(-30.32deg); opacity: 1; }
          35% { transform: translate3d(13.03vw, 35.84vh, 0) rotate(-28.96deg); opacity: 1; }
          37.5% { transform: translate3d(16.45vw, 34.00vh, 0) rotate(-27.60deg); opacity: 1; }
          40% { transform: translate3d(19.92vw, 32.24vh, 0) rotate(-26.24deg); opacity: 1; }
          42.5% { transform: translate3d(23.43vw, 30.56vh, 0) rotate(-24.88deg); opacity: 1; }
          45% { transform: translate3d(26.99vw, 28.96vh, 0) rotate(-23.53deg); opacity: 1; }
          47.5% { transform: translate3d(30.60vw, 27.44vh, 0) rotate(-22.19deg); opacity: 1; }
          50% { transform: translate3d(34.25vw, 26.00vh, 0) rotate(-20.85deg); opacity: 1; }
          52.5% { transform: translate3d(37.95vw, 24.64vh, 0) rotate(-19.53deg); opacity: 1; }
          55% { transform: translate3d(41.69vw, 23.36vh, 0) rotate(-18.22deg); opacity: 1; }
          57.5% { transform: translate3d(45.48vw, 22.16vh, 0) rotate(-16.92deg); opacity: 1; }
          60% { transform: translate3d(49.32vw, 21.04vh, 0) rotate(-15.63deg); opacity: 1; }
          62.5% { transform: translate3d(53.20vw, 20.00vh, 0) rotate(-14.36deg); opacity: 1; }
          65% { transform: translate3d(57.13vw, 19.04vh, 0) rotate(-13.10deg); opacity: 1; }
          67.5% { transform: translate3d(61.11vw, 18.16vh, 0) rotate(-11.86deg); opacity: 1; }
          70% { transform: translate3d(65.13vw, 17.36vh, 0) rotate(-10.64deg); opacity: 1; }
          72.5% { transform: translate3d(69.20vw, 16.64vh, 0) rotate(-9.44deg); opacity: 1; }
          75% { transform: translate3d(73.31vw, 16.00vh, 0) rotate(-8.25deg); opacity: 1; }
          77.5% { transform: translate3d(77.47vw, 15.44vh, 0) rotate(-7.08deg); opacity: 1; }
          80% { transform: translate3d(81.68vw, 14.96vh, 0) rotate(-5.94deg); opacity: 1; }
          82.5% { transform: translate3d(85.93vw, 14.56vh, 0) rotate(-4.81deg); opacity: 1; }
          85% { transform: translate3d(90.23vw, 14.24vh, 0) rotate(-3.71deg); opacity: 1; }
          87.5% { transform: translate3d(94.58vw, 14.00vh, 0) rotate(-2.62deg); opacity: 1; }
          90% { transform: translate3d(98.97vw, 13.84vh, 0) rotate(-1.56deg); opacity: 1; }
          92.5% { transform: translate3d(103.41vw, 13.76vh, 0) rotate(-0.51deg); opacity: 1; }
          95% { transform: translate3d(107.89vw, 13.76vh, 0) rotate(0.51deg); opacity: 0.83; }
          97.5% { transform: translate3d(112.42vw, 13.84vh, 0) rotate(1.51deg); opacity: 0.42; }
          100% { transform: translate3d(117.00vw, 14.00vh, 0) rotate(2.49deg); opacity: 0; }
        }

        @keyframes flypast-green {
          0% { transform: translate3d(-35.00vw, 78.00vh, 0) rotate(-47.49deg); opacity: 0; }
          2.5% { transform: translate3d(-32.23vw, 75.04vh, 0) rotate(-46.24deg); opacity: 0.42; }
          5% { transform: translate3d(-29.41vw, 72.16vh, 0) rotate(-44.97deg); opacity: 0.83; }
          7.5% { transform: translate3d(-26.54vw, 69.36vh, 0) rotate(-43.69deg); opacity: 1; }
          10% { transform: translate3d(-23.63vw, 66.64vh, 0) rotate(-42.40deg); opacity: 1; }
          12.5% { transform: translate3d(-20.67vw, 64.00vh, 0) rotate(-41.09deg); opacity: 1; }
          15% { transform: translate3d(-17.67vw, 61.44vh, 0) rotate(-39.77deg); opacity: 1; }
          17.5% { transform: translate3d(-14.62vw, 58.96vh, 0) rotate(-38.44deg); opacity: 1; }
          20% { transform: translate3d(-11.52vw, 56.56vh, 0) rotate(-37.10deg); opacity: 1; }
          22.5% { transform: translate3d(-8.38vw, 54.24vh, 0) rotate(-35.76deg); opacity: 1; }
          25% { transform: translate3d(-5.19vw, 52.00vh, 0) rotate(-34.40deg); opacity: 1; }
          27.5% { transform: translate3d(-1.95vw, 49.84vh, 0) rotate(-33.05deg); opacity: 1; }
          30% { transform: translate3d(1.33vw, 47.76vh, 0) rotate(-31.68deg); opacity: 1; }
          32.5% { transform: translate3d(4.66vw, 45.76vh, 0) rotate(-30.32deg); opacity: 1; }
          35% { transform: translate3d(8.03vw, 43.84vh, 0) rotate(-28.96deg); opacity: 1; }
          37.5% { transform: translate3d(11.45vw, 42.00vh, 0) rotate(-27.60deg); opacity: 1; }
          40% { transform: translate3d(14.92vw, 40.24vh, 0) rotate(-26.24deg); opacity: 1; }
          42.5% { transform: translate3d(18.43vw, 38.56vh, 0) rotate(-24.88deg); opacity: 1; }
          45% { transform: translate3d(21.99vw, 36.96vh, 0) rotate(-23.53deg); opacity: 1; }
          47.5% { transform: translate3d(25.60vw, 35.44vh, 0) rotate(-22.19deg); opacity: 1; }
          50% { transform: translate3d(29.25vw, 34.00vh, 0) rotate(-20.85deg); opacity: 1; }
          52.5% { transform: translate3d(32.95vw, 32.64vh, 0) rotate(-19.53deg); opacity: 1; }
          55% { transform: translate3d(36.69vw, 31.36vh, 0) rotate(-18.22deg); opacity: 1; }
          57.5% { transform: translate3d(40.48vw, 30.16vh, 0) rotate(-16.92deg); opacity: 1; }
          60% { transform: translate3d(44.32vw, 29.04vh, 0) rotate(-15.63deg); opacity: 1; }
          62.5% { transform: translate3d(48.20vw, 28.00vh, 0) rotate(-14.36deg); opacity: 1; }
          65% { transform: translate3d(52.13vw, 27.04vh, 0) rotate(-13.10deg); opacity: 1; }
          67.5% { transform: translate3d(56.11vw, 26.16vh, 0) rotate(-11.86deg); opacity: 1; }
          70% { transform: translate3d(60.13vw, 25.36vh, 0) rotate(-10.64deg); opacity: 1; }
          72.5% { transform: translate3d(64.20vw, 24.64vh, 0) rotate(-9.44deg); opacity: 1; }
          75% { transform: translate3d(68.31vw, 24.00vh, 0) rotate(-8.25deg); opacity: 1; }
          77.5% { transform: translate3d(72.47vw, 23.44vh, 0) rotate(-7.08deg); opacity: 1; }
          80% { transform: translate3d(76.68vw, 22.96vh, 0) rotate(-5.94deg); opacity: 1; }
          82.5% { transform: translate3d(80.93vw, 22.56vh, 0) rotate(-4.81deg); opacity: 1; }
          85% { transform: translate3d(85.23vw, 22.24vh, 0) rotate(-3.71deg); opacity: 1; }
          87.5% { transform: translate3d(89.58vw, 22.00vh, 0) rotate(-2.62deg); opacity: 1; }
          90% { transform: translate3d(93.97vw, 21.84vh, 0) rotate(-1.56deg); opacity: 1; }
          92.5% { transform: translate3d(98.41vw, 21.76vh, 0) rotate(-0.51deg); opacity: 1; }
          95% { transform: translate3d(102.89vw, 21.76vh, 0) rotate(0.51deg); opacity: 0.83; }
          97.5% { transform: translate3d(107.42vw, 21.84vh, 0) rotate(1.51deg); opacity: 0.42; }
          100% { transform: translate3d(112.00vw, 22.00vh, 0) rotate(2.49deg); opacity: 0; }
        }

        @keyframes dustTwinkle {
          0%, 100% { opacity: 0.35; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>

      {/* Floating Google-Doodle Celebration Trigger (Placed directly ABOVE chat icon) */}
      <button
        onClick={triggerFlypast}
        disabled={isAnimating}
        aria-label="Celebrate Independence Day"
        title="Celebrate Independence Day"
        className="fixed bottom-20 right-6 z-40 w-11 h-11 rounded-full bg-[#FAF7F0]/90 backdrop-blur-md border border-amber-900/15 shadow-[0_2px_8px_rgba(120,53,15,0.12),0_8px_20px_-6px_rgba(120,53,15,0.22)] hover:shadow-[0_4px_14px_rgba(120,53,15,0.16),0_16px_36px_-8px_rgba(120,53,15,0.3)] hover:scale-110 active:scale-95 [transition:transform_0.35s_cubic-bezier(0.34,1.56,0.64,1),box-shadow_0.3s_ease-out] flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-amber-500/40 select-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {/* Glass top-highlight — a thin sheen along the upper edge for a premium, lacquered feel */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/60 via-white/0 to-transparent opacity-70 pointer-events-none" />
        <span className="absolute inset-0 rounded-full border border-amber-600/30 group-hover:border-amber-600/60 transition-colors pointer-events-none" />
        <PartyPopper
          size={20}
          className="relative text-amber-800 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300"
        />
        <span className="absolute bottom-full right-0 mb-2.5 px-3 py-1.5 bg-neutral-900/95 backdrop-blur-sm text-white text-[10px] font-light tracking-wider rounded-md whitespace-nowrap opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none shadow-lg border border-white/10">
          Celebrate Independence Day
        </span>
      </button>

      {/* Full Viewport Aerobatic Animation Overlay */}
      {isAnimating && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden select-none">
          {/* Shared blur filters for the feathered outer dust layers */}
          <svg className="absolute w-0 h-0">
            <defs>
              <filter id="dustBlurSoft" x="-40%" y="-150%" width="220%" height="400%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
              <filter id="dustBlurWide" x="-60%" y="-200%" width="260%" height="500%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
            </defs>
          </svg>

          {PLANES.map((plane) => (
            <div
              key={plane.id}
              className="absolute left-0 top-0 flex items-center will-change-transform"
              style={{ animation: `${plane.animation} 4.2s cubic-bezier(0.45, 0.05, 0.35, 1) ${plane.delay} both` }}
            >
              {/* Dust trail: tapered comet shape (thin behind, full width at the jet) with layered haze + scattered dust puffs */}
              <div className="relative flex items-center">
                {/* Layer 1: widest, most diffuse haze — the trail's soft body, tapered to a point at the tail */}
                <div
                  className="w-[280px] sm:w-[480px] opacity-45"
                  style={{
                    height: `calc(${plane.trailHeightSm} * 1.6)`,
                    background: `linear-gradient(to right, transparent 0%, ${plane.glow} 60%, ${plane.edge} 100%)`,
                    filter: 'url(#dustBlurWide)',
                    clipPath: 'polygon(0% 50%, 12% 32%, 60% 20%, 100% 0%, 100% 100%, 60% 80%, 12% 68%)',
                  }}
                />
                {/* Layer 2: mid glow, softly blurred, same taper */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] sm:w-[520px] opacity-85"
                  style={{
                    height: plane.trailHeightSm,
                    background: `linear-gradient(to right, transparent 0%, ${plane.glow} 45%, ${plane.edge} 100%)`,
                    filter: 'url(#dustBlurSoft)',
                    clipPath: 'polygon(0% 50%, 12% 30%, 60% 18%, 100% 0%, 100% 100%, 60% 82%, 12% 70%)',
                  }}
                />
                {/* Layer 3: crisp bright core — the sharp comet line, tapered to a fine point */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] sm:w-[520px]"
                  style={{
                    height: plane.trailHeight,
                    background: `linear-gradient(to right, transparent 0%, ${plane.core}22 35%, ${plane.core} 90%, ${plane.core} 100%)`,
                    boxShadow: `0 0 14px ${plane.glow}, 0 0 26px ${plane.glow}${plane.id === 'white' ? ', 0 1px 3px rgba(0,0,0,0.18)' : ''}`,
                    clipPath: 'polygon(0% 50%, 15% 25%, 65% 12%, 100% 0%, 100% 100%, 65% 88%, 15% 75%)',
                  }}
                />
                {/* Scattered dust puffs along the trail's length — breaks up the smooth gradient into texture */}
                {[18, 34, 50, 66, 80].map((leftPct, i) => (
                  <span
                    key={leftPct}
                    className="absolute rounded-full"
                    style={{
                      left: `${leftPct}%`,
                      top: '50%',
                      width: `${3 + (i % 3)}px`,
                      height: `${3 + (i % 3)}px`,
                      marginTop: i % 2 === 0 ? `${-5 - (i % 3)}px` : `${4 + (i % 3)}px`,
                      background: plane.core,
                      opacity: 0.25 + (i % 3) * 0.12,
                      filter: 'blur(0.5px)',
                      boxShadow: `0 0 5px ${plane.glow}`,
                      animation: `dustTwinkle ${1 + i * 0.12}s ease-in-out ${i * 0.08}s infinite`,
                    }}
                  />
                ))}
                {/* Twinkling sparkle right at the tail tip, near the aircraft */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 -mr-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="rounded-full"
                      style={{
                        width: `${5 - i}px`,
                        height: `${5 - i}px`,
                        marginTop: i % 2 === 0 ? `${-6 - i}px` : `${6 + i}px`,
                        background: plane.core,
                        boxShadow: `0 0 6px ${plane.glow}`,
                        animation: `dustTwinkle ${0.8 + i * 0.15}s ease-in-out ${i * 0.1}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Aircraft */}
              <div className="-ml-1.5">
                <JetSilhouetteSVG
                  className={`${plane.size} [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.35))_drop-shadow(0_4px_10px_rgba(0,0,0,0.22))]`}
                  color={plane.planeFill}
                  glow={plane.glow}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Aircraft Silhouette — flat "flight glyph" body with a subtle two-stop    */
/*  metallic gradient (lightened top, true color underside) so it reads as  */
/*  a lacquered fuselage catching light rather than a flat sticker. A soft  */
/*  blurred glow sits behind it so it stays premium against the tricolor    */
/*  trail, without turning the plane itself into a fighter jet.             */
/* -------------------------------------------------------------------------- */
function lightenHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function JetSilhouetteSVG({
  className = 'w-8 h-8',
  color,
  glow,
}: {
  className?: string;
  color: string;
  glow: string;
}) {
  const idSafe = color.replace('#', '');
  const filterId = `planeGlowBlur-${idSafe}`;
  const gradientId = `planeBody-${idSafe}`;

  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={lightenHex(color, 60)} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>

      {/* Soft halo behind the silhouette */}
      <circle cx="12" cy="12" r="10" fill={glow} filter={`url(#${filterId})`} opacity="0.6" />

      {/* Flat silhouette with a metallic fill — nose points right, matches flight direction */}
      <path
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
        fill={`url(#${gradientId})`}
        transform="rotate(90 12 12)"
      />
    </svg>
  );
}