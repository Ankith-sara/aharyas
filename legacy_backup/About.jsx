import { useState, useEffect, useRef } from 'react';
import { assets } from '../assets/assets';
import NewsletterBox from '../components/NewsletterBox';
import OurPolicy from '../components/OurPolicy';
import Title from '../components/Title';
import { ChevronDown, ChevronUp } from 'lucide-react';
import IndianMap from '../components/IndianMap';
import usePageMeta from '../components/usePageMeta';

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

const About = () => {
  const [showFullStory, setShowFullStory] = useState(false);
  const [storyRef, storyVisible] = useReveal(0.08);
  const [artisanRef, artisanVisible] = useReveal(0.08);

  usePageMeta({
    title: 'About Aharyas | Conscious Luxury, Indian Heritage',
    description:
      'Aharyas connects 300+ rural Indian artisans to global markets. ' +
      'Founded by Avani Reddy — From Rural to Global.',
  });;

  return (
    <div className="min-h-screen text-black mt-16">
      {/* BRAND STORY */}
      <section ref={storyRef} className="py-20 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className={`relative order-2 lg:order-1 transition-all duration-700 ${storyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div className="relative overflow-hidden">
                <img
                  className="w-full h-[580px] object-cover transition-transform duration-700 hover:scale-[1.02]"
                  src={assets.about_img}
                  alt="Aharyas Founder"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
              </div>
              <div className="absolute bottom-6 left-6 bg-black/85 backdrop-blur-sm px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/60 mb-0.5">Founded</p>
                <p className="text-sm font-light text-white">Hyderabad, 2025</p>
              </div>
            </div>

            <div className={`order-1 lg:order-2 transition-all duration-700 delay-150 ${storyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-5">Our Story</p>
              <div className="text-3xl mb-8">
                <Title text1="ABOUT" text2="AHARYAS" />
              </div>
              <div className="space-y-5 text-gray-600 text-base leading-loose font-light">
                <p>Founded by Avani Reddy at the age of 20 during her university years, Aharyas began as a bold vision to create meaningful impact through entrepreneurship. What started as an idea among a group of passionate young individuals has grown into a purpose-driven venture built on ambition, creativity, and a deep belief in India's craft potential.</p>
                <p>Aharyas is a global e-commerce marketplace built on a simple yet powerful idea — <em>Rural to Global</em>. We connect skilled rural artisans directly with modern consumers through a seamless and trusted digital platform.</p>
                <p>Driven by purpose, we enable artisans to showcase their work beyond local boundaries while offering customers an authentic, meaningful alternative to mass-produced fashion.</p>
                <p>Today, with over 300 artisans onboarded — many from self-help groups and rural communities — Aharyas continues to create a platform where craftsmanship is valued and Indian heritage finds its place on the global stage.</p>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-0 border border-gray-100">
                {[
                  { value: '300+', label: 'Artisans' },
                  { value: '2025', label: 'Founded' },
                  { value: 'Pan India', label: 'Reach' },
                ].map(({ value, label }, i) => (
                  <div key={label} className={`px-5 py-4 ${i < 2 ? 'border-r border-gray-100' : ''}`}>
                    <p className="text-xl font-light text-black">{value}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INDIAN MAP */}
      <section className="py-20 border-b border-gray-100">
        <div className="px-4 sm:px-8 lg:px-20">
          <IndianMap />
        </div>
      </section>

      {/* WHAT DRIVES US */}
      <section className="py-20 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-5 text-center">Our Belief</p>
          <div className="text-3xl text-center mb-12">
            <Title text1="WHAT" text2="DRIVES US" />
          </div>
          <div className="border-l-2 border-black pl-10 py-2">
            <p className="text-lg sm:text-xl font-light text-black leading-relaxed mb-3">A simple belief:</p>
            <p className="text-lg sm:text-xl font-light text-gray-500 leading-relaxed italic">
              "That fashion should not just look good — it should mean something, honour hands, and carry stories forward."
            </p>
          </div>
        </div>
      </section>

      {/* ARTISAN STORIES */}
      <section ref={artisanRef} className="py-16 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-5 text-center">The Hands Behind the Cloth</p>
            <div className="text-3xl text-center mb-4">
              <Title text1="ARTISAN" text2="STORIES" />
            </div>
            <p className="text-center text-sm text-gray-400 font-light max-w-xl mx-auto">
              Every Aharyas piece is a living memory — crafted by hands that keep tradition alive.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className={`lg:col-span-2 transition-all duration-700 ${artisanVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div className="relative">
                <img
                  src={assets.mallesh_img}
                  alt="Master Weaver Mallesh Anna"
                  className="w-full h-[500px] object-cover transition-transform duration-700 hover:scale-[1.02]"
                />
              </div>
            </div>

            <div className={`lg:col-span-3 transition-all duration-700 delay-150 ${artisanVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div className="border border-gray-100 hover:border-gray-200 transition-colors duration-300">
                <div className="px-8 py-6 border-b border-gray-100">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-2">Pochampally, Telangana</p>
                  <h3 className="text-xl font-light tracking-wide text-black">Meet Mallesh Anna</h3>
                  <p className="text-sm text-gray-400 font-light italic mt-1">The Heart Behind the Loom</p>
                </div>

                <div className="px-8 py-8">
                  {!showFullStory ? (
                    <>
                      <div className="space-y-4 text-gray-600 text-sm font-light leading-relaxed">
                        <p>From the weaving town of Pochampally, Mallesh Anna has spent over 40 years breathing life into threads. He began as a young boy, watching his parents tie and dye yarn late into the night, slowly learning that every motif held a meaning and every weave, a memory.</p>
                        <p>Today, at 56, he still rises before dawn, preparing yarns with care and weaving with quiet pride. The journey hasn't been easy — rising costs, fewer buyers — but he never let go of the loom that shaped his life.</p>
                        <p><em>Now a treasured part of the Aharyas family, Mallesh Anna's work is more than craftsmanship… it's legacy.</em></p>
                      </div>
                      <button
                        onClick={() => setShowFullStory(true)}
                        className="mt-6 group inline-flex items-center gap-2 text-xs uppercase tracking-widest hover:text-gray-500 transition-all duration-200"
                      >
                        Read Full Story
                        <ChevronDown size={12} className="group-hover:translate-y-0.5 transition-transform duration-200" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4 text-gray-600 text-sm font-light leading-relaxed">
                        <p>In the quiet village lanes of Pochampally, as the world still sleeps, a soft rhythm begins. It's not a song, but a sound — a tap, pull, beat — the sacred hum of a loom guided by hands that have known its music for over 40 years. Those hands belong to Mallesh Anna, a master Ikkat weaver, now 56.</p>
                        <p>He learned by watching — small feet by the loom, wide eyes on his parents' weathered fingers as they tied, dyed, and wove stories under lantern light. "Back then, I thought it was magic," he says. "Now I know… it's devotion."</p>
                        <p>Each day, before the sun graces the fields, Mallesh rises. He prepares the yarns with near-meditative precision. "Every motif means something. Some are for love, others for rain, or joy, or sorrow. It's like a language," he says.</p>
                        <p>There were years when buyers vanished. When cloth went unsold. When his heart broke seeing fellow weavers give up, sell their looms, and walk away. "We kept going… because the loom is not just work. It's who we are."</p>
                        <p>Today, Mallesh Anna weaves with new light — as a beloved part of the Aharyas family. His art is no longer a whisper from the past; it is a voice heard by the world.</p>
                        <p><em>When you wear his work, you wear his childhood, his resilience, his heartbeat. It was once just yarn. Now, it's a living memory.</em></p>
                      </div>
                      <button
                        onClick={() => setShowFullStory(false)}
                        className="mt-6 group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-black border-b border-black pb-0.5 hover:text-gray-500 hover:border-gray-400 transition-all duration-200"
                      >
                        Show Less
                        <ChevronUp size={12} className="group-hover:-translate-y-0.5 transition-transform duration-200" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POLICIES */}
      <section>
        <OurPolicy />
      </section>

      {/* NEWSLETTER */}
      <section className="py-10 md:py-16">
        <NewsletterBox />
      </section>
    </div>
  );
};

export default About;