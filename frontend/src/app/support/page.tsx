'use client';

import Title from '../../components/Title';
import { Phone, Mail } from 'lucide-react';

const CONTACT_METHODS = [
  {
    icon: Phone,
    heading: 'Phone Support',
    main: '+91 9063284008',
    note: 'Mon–Sat: 9:00 AM – 6:00 PM IST',
    href: 'tel:+919063284008',
  },
  {
    icon: Mail,
    heading: 'Email Support',
    main: 'aharyasofficial@gmail.com',
    note: 'Response within 24 hours',
    href: 'mailto:aharyasofficial@gmail.com',
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen text-black mt-16 sm:mt-20">
      <section className="py-16 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4 text-center">We&apos;re here to help</p>
          <div className="text-3xl text-center mb-5">
            <Title text1="CUSTOMER" text2="SUPPORT" />
          </div>
          <p className="text-sm text-gray-400 font-light text-center max-w-2xl mx-auto leading-relaxed">
            Get in touch with our support team for assistance with orders, returns, or any questions about your Aharyas experience.
          </p>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-8">Get In Touch</p>
          <div className="grid md:grid-cols-2 gap-0 border border-gray-100">
            {CONTACT_METHODS.map(({ icon: Icon, heading, main, note, href }, i) => (
              <div key={heading} className={`p-8 hover:bg-gray-50 transition-colors ${i < 1 ? 'border-r border-gray-100' : ''}`}>
                <Icon size={20} className="text-gray-400 mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">{heading}</p>
                <a href={href} className="text-base font-medium text-black hover:underline block mb-2">{main}</a>
                <p className="text-xs text-gray-400 font-light">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
