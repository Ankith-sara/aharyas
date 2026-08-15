'use client';

import Title from '../../components/Title';
import { 
  Phone, Mail, Clock, HelpCircle, Truck, RefreshCw, 
  CreditCard, MapPin, ArrowUpRight 
} from 'lucide-react';

const CONTACT_METHODS = [
  {
    icon: Phone,
    heading: 'Phone Support',
    sub: 'Speak with our team',
    main: '+91 9063284008',
    note: 'Mon–Sat: 9:00 AM – 6:00 PM IST',
    href: 'tel:+919063284008',
    detail: 'Direct assistance for urgent matters',
  },
  {
    icon: Mail,
    heading: 'Email Support',
    sub: 'Get detailed assistance',
    main: 'aharyasofficial@gmail.com',
    note: 'Response within 24 hours',
    href: 'mailto:aharyasofficial@gmail.com',
    detail: 'Perfect for detailed inquiries',
  },
];

const CATEGORIES = [
  {
    icon: Truck,
    title: 'Orders & Shipping',
    description: 'Track orders, shipping updates, delivery issues',
    topics: ['Order status', 'Tracking', 'Delivery delays', 'Shipping charges'],
  },
  {
    icon: RefreshCw,
    title: 'Returns & Exchanges',
    description: 'Return requests, refund status, exchange policies',
    topics: ['Return policy', 'Refund status', 'Exchange requests', 'Return pickup'],
  },
  {
    icon: CreditCard,
    title: 'Payment & Billing',
    description: 'Payment issues, billing queries, transaction problems',
    topics: ['Payment failed', 'Refund queries', 'Invoice requests', 'Payment methods'],
  },
  {
    icon: HelpCircle,
    title: 'General Support',
    description: 'Account issues, technical problems, product queries',
    topics: ['Account access', 'Technical issues', 'Product information', 'Website problems'],
  },
];

const QUICK_TIPS = [
  'Include your order number for order-related inquiries',
  'Provide screenshots for technical issues',
  'Check our FAQ page first — your question might already be answered',
  'Be as specific as possible about your issue',
];

export default function SupportPage() {
  return (
    <div className="min-h-screen text-black mt-16 sm:mt-20">

      {/* Header */}
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

      {/* Contact Methods */}
      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-8">Get In Touch</p>
          <div className="grid md:grid-cols-2 gap-0 border border-gray-100">
            {CONTACT_METHODS.map(({ icon: Icon, heading, sub, main, note, href, detail }, i) => (
              <div
                key={heading}
                className={`group p-8 hover:bg-gray-50 transition-colors duration-300 ${i < 1 ? 'border-b md:border-b-0 md:border-r border-gray-100' : ''}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-9 h-9 border border-gray-200 flex items-center justify-center group-hover:border-black group-hover:bg-black transition-all duration-300">
                    <Icon size={15} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <a href={href}>
                    <ArrowUpRight
                      size={14}
                      className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-black transition-all duration-200"
                    />
                  </a>
                </div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium mb-1">{heading}</p>
                <p className="text-xs text-gray-400 font-light mb-4">{sub}</p>
                <a href={href} className="block text-base font-medium text-black hover:underline underline-offset-4 mb-1">{main}</a>
                <div className="flex items-center gap-1.5 mt-2">
                  <Clock size={11} className="text-gray-300" />
                  <p className="text-xs text-gray-400 font-light">{note}</p>
                </div>
                <p className="text-xs text-gray-400 font-light italic mt-2">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-8">Support Categories</p>
          <div className="grid md:grid-cols-2 gap-0 border border-gray-100">
            {CATEGORIES.map(({ icon: Icon, title, description, topics }, i) => (
              <div
                key={title}
                className={`group p-8 hover:bg-gray-50 transition-colors duration-200 border-gray-100 ${i < 2 ? 'border-b' : ''} ${i % 2 === 0 ? 'border-r' : ''}`}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-9 h-9 border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:border-black group-hover:bg-black transition-all duration-300">
                    <Icon size={15} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-black uppercase tracking-wider mb-1">{title}</h3>
                    <p className="text-xs text-gray-400 font-light">{description}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Common Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {topics.map(topic => (
                      <span
                        key={topic}
                        className="px-3 py-1 border border-gray-200 text-xs text-gray-500 font-light hover:border-black hover:text-black transition-all duration-150"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-8">Quick Tips for Faster Support</p>
          <div className="grid sm:grid-cols-2 gap-0 border border-gray-100">
            {QUICK_TIPS.map((tip, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 p-6 border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${i < 2 ? 'border-b' : ''} ${i % 2 === 0 ? 'border-r' : ''}`}
              >
                <span className="text-[10px] text-gray-300 font-medium flex-shrink-0 mt-0.5">0{i + 1}</span>
                <p className="text-sm text-gray-500 font-light leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact details + CTA banner */}
      <section className="py-14 px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-0 border border-gray-100 mb-12">
            {[
              { icon: Phone, label: 'Phone Support', lines: ['+91 9063284008'], note: 'Mon–Sat: 9 AM – 6 PM' },
              { icon: Mail, label: 'Email Support', lines: ['aharyasofficial@gmail.com'], note: 'Response within 24 hours' },
              { icon: MapPin, label: 'Address', lines: ['J J Nagar, Near Ganesh Temple,', 'Sainikpuri, Malkajgiri,', 'Hyderabad, Telangana 500094'], note: null },
            ].map(({ icon: Icon, label, lines, note }, i) => (
              <div key={label} className={`p-8 border-gray-100 ${i < 2 ? 'border-b md:border-b-0 md:border-r' : ''}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon size={13} className="text-gray-400" />
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-medium">{label}</p>
                </div>
                {lines.map(l => <p key={l} className="text-sm text-black font-light mb-0.5">{l}</p>)}
                {note && <p className="text-xs text-gray-400 font-light mt-2">{note}</p>}
              </div>
            ))}
          </div>

          {/* CTA banner */}
          <div className="relative bg-black px-10 py-12 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px',
              }}
            />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2">Always Here</p>
                <h3 className="text-xl font-light text-white">Always Here to Help</h3>
                <p className="text-sm text-white/45 font-light mt-2 max-w-lg leading-relaxed">
                  Whether you have questions about our handcrafted collection, need help with an order, or want to learn more about our artisan partners — we&apos;re committed to exceptional service every step of the way.
                </p>
              </div>
              <a href="mailto:aharyasofficial@gmail.com" className="flex-shrink-0">
                <button className="group inline-flex items-center gap-3 border border-white/25 text-white px-7 py-3.5 text-xs font-medium uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all duration-300 cursor-pointer">
                  Get in Touch
                  <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
