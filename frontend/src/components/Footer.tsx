'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { assets } from '../assets/assets';
import { Instagram, Linkedin, Phone, Mail, MapPin } from 'lucide-react';

const NAV = [
  {
    heading: 'Explore',
    links: [
      { label: 'Our Story', to: '/about' },
      { label: 'The Collection', to: '/shop/collection' },
      { label: 'Sell With Us', to: '/sell' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Shipping Policy', to: '/shippingpolicy' },
      { label: 'Return Policy', to: '/refundpolicy' },
      { label: 'Privacy Policy', to: '/privacypolicy' },
      { label: 'Terms & Conditions', to: '/termsconditions' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Get Help', to: '/support' },
      { label: 'FAQs', to: '/faqs' },
    ],
    contact: [
      { icon: Phone, text: '+91 9063284008', href: 'tel:+919063284008' },
      { icon: Mail, text: 'aharyasofficial@gmail.com', href: 'mailto:aharyasofficial@gmail.com' },
      { icon: MapPin, text: 'Hyderabad, Telangana, India', href: null },
    ],
  },
];

const useReveal = (threshold = 0.1) => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
};

export default function Footer() {
  const year = new Date().getFullYear();
  const [footerRef, footerVisible] = useReveal(0.05);

  return (
    <footer ref={footerRef} className="bg-black text-white border-t border-zinc-900">
      <div
        className={`max-w-7xl mx-auto px-6 sm:px-8 py-12 transition-all duration-700 ${
          footerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-12 lg:gap-16">
          <div className="flex flex-col gap-0">
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-4">Est. 2025 · Hyderabad</p>
            <Image
              src={assets.logo}
              alt="Aharyas"
              width={163}
              height={56}
              className="h-14 w-auto object-contain object-left mb-3 invert"
            />
            <p className="text-sm text-zinc-400 font-light leading-relaxed mb-8 max-w-[280px]">
              Handcrafted Excellence, Rooted in Culture. Authentic Pieces, Every Detail a Story.
            </p>
            <div className="flex items-center gap-2.5 mb-8">
              {[
                { icon: Instagram, href: 'https://www.instagram.com/aharyas.in/', label: 'Instagram' },
                { icon: Linkedin, href: 'https://www.linkedin.com/in/aharyas-in-3a265633a/', label: 'LinkedIn' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-white hover:border-white transition-all duration-300"
                >
                  <Icon size={16} className="text-zinc-400 group-hover:text-black transition-transform duration-300" />
                </a>
              ))}
            </div>

            <div className="mt-2">
              <img
                src="https://cdn.shopify.com/s/files/1/0604/5853/2969/files/E_SDG_logo.png?v=1746715000"
                alt="UN Sustainable Development Goals"
                width="288"
                height="32"
                className="w-72 object-contain opacity-95 mb-4"
              />
              <div className="flex flex-wrap items-center gap-2 opacity-95">
                {[
                  'https://cdn.shopify.com/s/files/1/0604/5853/2969/files/E-WEB-Goal-01.png?v=1746714046',
                  'https://cdn.shopify.com/s/files/1/0604/5853/2969/files/E-WEB-Goal-02.png?v=1746714046',
                  'https://cdn.shopify.com/s/files/1/0604/5853/2969/files/E-WEB-Goal-05.png?v=1746714046',
                  'https://cdn.shopify.com/s/files/1/0604/5853/2969/files/E_SDG_PRINT-08.jpg?v=1746714048',
                  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Sustainable_Development_Goal_10ReducedInequalities.svg/250px-Sustainable_Development_Goal_10ReducedInequalities.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail',
                  'https://cdn.shopify.com/s/files/1/0604/5853/2969/files/E-WEB-Goal-12.png?v=1746714046',
                  'https://cdn.shopify.com/s/files/1/0604/5853/2969/files/E-WEB-Goal-13.png?v=1746714046',
                  'https://cdn.shopify.com/s/files/1/0604/5853/2969/files/E-WEB-Goal-15.png?v=1746714046',
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`SDG Goal ${i + 1}`}
                    width="36"
                    height="36"
                    loading="lazy"
                    className="w-9 h-9 object-contain"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Nav Columns */}
          {NAV.map(({ heading, links, contact }, colIdx) => (
            <div
              key={heading}
              className={`flex flex-col gap-0 transition-all duration-700 ${
                footerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${200 + colIdx * 100}ms` }}
            >
              <p className="text-[14px] uppercase tracking-[0.3em] text-zinc-400 font-semibold mb-5">{heading}</p>

              <ul className="flex flex-col gap-2">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      href={to}
                      className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 font-light"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

              {contact && (
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-zinc-800">
                  {contact.map(({ icon: Icon, text, href }) => (
                    <div key={text} className="flex items-start gap-2">
                      <Icon size={14} className="text-zinc-200 flex-shrink-0 mt-0.5" />
                      {href ? (
                        <a
                          href={href}
                          className="text-xs text-zinc-300 font-light leading-relaxed hover:text-white transition-colors duration-200 break-all"
                        >
                          {text}
                        </a>
                      ) : (
                        <span className="text-[11px] text-zinc-300 font-light leading-relaxed">{text}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-zinc-900 bg-black">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-zinc-500 font-medium tracking-wide order-3 sm:order-1">
              &copy; {year} Aharyas. All rights reserved.
            </p>
            <p className="text-[11px] text-zinc-500 font-medium italic order-2">Rural to Global</p>
            <div className="flex items-center gap-2 border border-zinc-600 px-3 py-1.5 order-1 sm:order-3">
              <div className="w-1 h-1 bg-zinc-700 rounded-full" />
              <span className="text-[9px] text-zinc-400 uppercase tracking-[0.25em] font-medium">Made in India</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
