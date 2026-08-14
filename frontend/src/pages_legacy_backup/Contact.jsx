import { useEffect, useRef, useState } from 'react';
import Title from '../components/Title';
import NewsletterBox from '../components/NewsletterBox';
import { MapPin, Phone, Mail, Briefcase, ArrowUpRight } from 'lucide-react';
import usePageMeta from '../components/usePageMeta';

const CONTACT_CARDS = [
  {
    icon: MapPin,
    heading: 'Visit Us',
    lines: ['Sanikipuri, Malkajgiri', 'Hyderabad, Telangana'],
    accent: 'PIN: 500064',
    href: null,
  },
  {
    icon: Phone,
    heading: 'Call Us',
    lines: ['Customer Service', 'Mon – Sat: 9 AM – 6 PM'],
    accent: '+91 9063284008',
    accent2: '+91 91211 57804',
    href: 'tel:+919063284008',
  },
  {
    icon: Mail,
    heading: 'Email Us',
    lines: ['General Inquiries', 'We respond within 24 hours'],
    accent: 'aharyasofficial@gmail.com',
    href: 'mailto:aharyasofficial@gmail.com',
  },
];

const WHY_ITEMS = [
  {
    title: 'Meaningful Impact',
    body: `Every day, you'll contribute to preserving India's craft heritage and empowering artisan communities.`,
  },
  {
    title: 'Growth & Learning',
    body: 'Work with cutting-edge technology, traditional crafts, and passionate team members.',
  },
  {
    title: 'Creative Freedom',
    body: 'Bring your ideas to life in an environment that values innovation and authenticity.',
  },
];

const Contact = () => {
  usePageMeta({
    title: 'Contact Us',
    description:
      'Reach out to Aharyas for support, partnerships, or artisan onboarding. ' +
      'Based in Hyderabad, Telangana — call or email us anytime.',
  });

  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-screen text-black mt-16">
      <section className="py-16 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4">We'd love to hear from you</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="text-3xl">
              <Title text1="GET IN" text2="TOUCH" />
            </div>
            <p className="text-sm text-gray-400 max-w-xs sm:text-right leading-relaxed">
              Reach us any time, our team is here to help with orders, partnerships, and everything in between.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT CARDS */}
      <section className="py-16 px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-0 border border-gray-100">
            {CONTACT_CARDS.map(({ icon: Icon, heading, lines, accent, accent2, href }, i) => (
              <div
                key={heading}
                className={`group p-10 flex flex-col gap-6 border-gray-100 hover:bg-gray-50 transition-colors duration-300 ${i < 2 ? 'border-b md:border-b-0 md:border-r' : ''}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 border border-gray-200 flex items-center justify-center group-hover:border-black group-hover:bg-black transition-all duration-300">
                    <Icon size={16} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  {href && (
                    <ArrowUpRight
                      size={14}
                      className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-black transition-all duration-300 -translate-x-1 group-hover:translate-x-0"
                    />
                  )}
                </div>

                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-semibold mb-4">{heading}</h3>
                  <div className="space-y-1 mb-3">
                    {lines.map(l => (
                      <p key={l} className="text-sm text-gray-500 font-light">{l}</p>
                    ))}
                  </div>
                  {href ? (
                    <>
                      <a href={href} className="block text-base font-medium text-black hover:underline underline-offset-4 transition-all">
                        {accent}
                      </a>
                      {accent2 && (
                        <a href={href} className="block text-base font-medium text-black hover:underline underline-offset-4 transition-all mt-1">
                          {accent2}
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-base font-medium text-black">{accent}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN OUR MISSION */}
      <section className="py-16 px-4 sm:px-8 lg:px-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4">Careers</p>
              <div className="text-3xl mb-8">
                <Title text1="JOIN OUR" text2="MISSION" />
              </div>
              <div className="space-y-5 text-gray-600 text-base leading-loose font-light">
                <p>At Aharyas, we're building more than a brand — we're nurturing a movement that celebrates heritage, empowers artisans, and creates conscious fashion for the world.</p>
                <p>We're looking for passionate individuals who believe in the power of tradition, the beauty of handcraft, and sustainable fashion. Join us and help bridge India's craft heritage with global conscious consumers.</p>
                <p>Whether you're in design, technology, marketing, or operations — there's a place for you in our growing family.</p>
              </div>
              <button className="mt-10 group inline-flex items-center gap-3 bg-black text-white px-8 py-4 text-xs font-medium uppercase tracking-widest hover:bg-gray-900 transition-all duration-300">
                Explore Opportunities
                <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </button>
            </div>

            <div
              className={`transition-all duration-700 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              <div className="border border-gray-100">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                  <Briefcase size={14} className="text-gray-400" />
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">Why Work With Us?</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {WHY_ITEMS.map(({ title, body }, i) => (
                    <div key={title} className="group px-8 py-7 flex gap-5 hover:bg-gray-50 transition-colors duration-200">
                      <span className="text-[10px] text-gray-300 font-medium mt-1 flex-shrink-0 w-4">0{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-black mb-1.5 tracking-wide">{title}</p>
                        <p className="text-sm text-gray-500 font-light leading-relaxed">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-10 px-4 sm:px-8 md:px-16 bg-gradient-to-b from-white to-stone-50">
        <NewsletterBox />
      </section>
    </div>
  );
};

export default Contact;