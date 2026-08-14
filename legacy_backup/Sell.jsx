import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, TrendingUp, Package, Truck, CreditCard } from 'lucide-react';
import Title from '../components/Title';
import usePageMeta from '../components/usePageMeta';

const STEPS = [
  {
    step: '01',
    title: 'Register Your Account',
    description: 'Share your story. Register with GST/PAN details and connect your bank account to get started.',
    icon: TrendingUp,
  },
  {
    step: '02',
    title: 'Choose Storage & Shipping',
    description: 'Select storage, packaging, and delivery options crafted specifically for your unique needs.',
    icon: Package,
  },
  {
    step: '03',
    title: 'List Your Products',
    description: 'Share your creations with the world. Add rich product details and tell your brand story.',
    icon: Truck,
  },
  {
    step: '04',
    title: 'Complete Orders & Get Paid',
    description: 'Deliver with care and receive payments within 7 days. Build lasting relationships with customers.',
    icon: CreditCard,
  },
];

const WHY_SELL = [
  {
    number: '01',
    title: 'Reach Millions',
    description: 'Access a vast audience across India with our established customer base eager to discover authentic, handcrafted products.',
  },
  {
    number: '02',
    title: 'Proven Success',
    description: 'Join a thriving community of artisans and sellers who have scaled their businesses while preserving their craft heritage.',
  },
  {
    number: '03',
    title: 'Seamless Delivery',
    description: `Deliver anywhere with Aharyas extensive logistics network, dedicated support, and commitment to customer satisfaction.`,
  },
];

const useReveal = (threshold = 0.1) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible];
};

const Sell = () => {
  usePageMeta({
      title: 'Become a Seller — Join Our Artisan Community',
      description:
        'Sell your handcrafted products on Aharyas. Join 300+ artisans from ' +
        'rural India and reach customers across the globe.',
    });

  const [heroRef, heroVisible] = useReveal(0.05);
  const [stepsRef, stepsVisible] = useReveal(0.08);
  const [whyRef, whyVisible] = useReveal(0.08);

  return (
    <div className="min-h-screen text-black mt-16">

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="py-16 px-4 sm:px-8 lg:px-20 border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto">
          <div className={`transition-all duration-900 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-5">For Artisans & Sellers</p>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
              <div>
                <div className="text-4xl sm:text-5xl mb-6">
                  <Title text1="BECOME A" text2="SELLER" />
                </div>
                <p className="text-base text-gray-500 font-light leading-relaxed max-w-lg">
                  Join thousands of artisans and entrepreneurs transforming their businesses on{' '}
                  <span className="text-black font-medium">Aharyas</span>. Celebrate craftsmanship, embrace innovation, and grow with a community that values tradition.
                </p>
              </div>
              <a
                href="https://admin.aharyas.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <button className="group inline-flex items-center gap-3 bg-black text-white px-8 py-4 text-xs font-medium uppercase tracking-widest hover:bg-gray-900 transition-all duration-300">
                  Start Selling Now
                  <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                </button>
              </a>
            </div>

            {/* Stats strip */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-0 border border-gray-100">
              {[
                { value: '300+', label: 'Artisans Onboarded' },
                { value: '7 days', label: 'Payment Cycle' },
                { value: 'Pan India', label: 'Delivery Network' },
                { value: '2025', label: 'Founded' },
              ].map(({ value, label }, i) => (
                <div
                  key={label}
                  className={`px-8 py-6 border-gray-100 ${i < 3 ? 'border-r' : ''}`}
                >
                  <p className="text-2xl font-light text-black mb-1">{value}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── YOUR JOURNEY ── */}
      <section
        ref={stepsRef}
        className="py-20 px-4 sm:px-8 lg:px-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4">How It Works</p>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="text-3xl">
                <Title text1="YOUR" text2="JOURNEY" />
              </div>
              <p className="text-sm text-gray-400 font-light max-w-xs sm:text-right">
                Four simple steps to launch and grow your presence on Aharyas.
              </p>
            </div>
          </div>

          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4 border border-gray-100">
            {STEPS.map(({ step, title, description, icon: Icon }, i) => (
              <div
                key={step}
                className={`group relative p-8 lg:p-10 border-gray-100 hover:bg-gray-50 transition-all duration-300 ${i < 3 ? 'border-b sm:border-b-0 sm:border-r' : ''} ${stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 100}ms`, transitionDuration: '600ms' }}
              >
                {/* Ghost step number */}
                <span className="absolute top-6 right-6 text-6xl font-light text-black/[0.05] select-none group-hover:text-black/[0.08] transition-colors duration-300">
                  {step}
                </span>

                <div className="relative z-10">
                  <div className="w-9 h-9 border border-gray-200 flex items-center justify-center mb-6 group-hover:border-black group-hover:bg-black transition-all duration-300">
                    <Icon size={15} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-300 mb-3 font-medium">{step}</p>
                  <h3 className="text-sm font-medium text-black tracking-wide mb-3">{title}</h3>
                  <div className="w-8 h-px bg-gray-200 mb-4 group-hover:w-12 group-hover:bg-black transition-all duration-300" />
                  <p className="text-sm text-gray-500 font-light leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY SELL ── */}
      <section
        ref={whyRef}
        className="py-20 px-4 sm:px-8 lg:px-20 border-t border-gray-100 bg-gray-50/60"
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4">The Advantage</p>
            <div className="text-3xl">
              <Title text1="WHY" text2="SELL WITH US" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-0 border border-gray-200">
            {WHY_SELL.map(({ number, title, description }, i) => (
              <div
                key={number}
                className={`group p-10 border-gray-200 hover:bg-white transition-all duration-300 ${i < 2 ? 'border-b md:border-b-0 md:border-r' : ''} ${whyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${i * 100}ms`, transitionDuration: '600ms' }}
              >
                <span className="text-3xl font-light text-black/15 block mb-6 group-hover:text-black/25 transition-colors duration-300">
                  {number}
                </span>
                <h3 className="text-base font-medium text-black tracking-wide mb-3">{title}</h3>
                <div className="w-8 h-px bg-gray-300 mb-4 group-hover:w-12 group-hover:bg-black transition-all duration-300" />
                <p className="text-sm text-gray-500 font-light leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="py-20 px-4 sm:px-8 lg:px-20 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="border-l-2 border-black pl-10 py-2">
            <p className="text-xl sm:text-2xl font-light text-black leading-relaxed mb-4">
              A shared belief:
            </p>
            <p className="text-lg sm:text-xl font-light text-gray-500 leading-relaxed italic">
              "That every creation tells a story, every purchase supports a dream, and every seller contributes to preserving India's rich cultural heritage."
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative py-24 px-4 sm:px-8 lg:px-20 bg-black overflow-hidden">
        {/* Subtle noise */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />
        <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/30 mb-4">Ready to start?</p>
            <h2 className="text-4xl sm:text-5xl font-light text-white leading-tight">
              Transform your<br />
              <span className="text-white/50">business today.</span>
            </h2>
          </div>
          <div className="flex-shrink-0 max-w-sm">
            <p className="text-sm text-white/40 font-light leading-relaxed mb-8">
              Join the growing community of artisans who have found success on Aharyas. Your journey towards a sustainable, meaningful business starts here.
            </p>
            <a href="https://admin.aharyas.com/" target="_blank" rel="noopener noreferrer">
              <button className="group inline-flex items-center gap-3 border border-white/25 text-white px-8 py-4 text-xs font-medium uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all duration-300">
                Become a Seller
                <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </button>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Sell;