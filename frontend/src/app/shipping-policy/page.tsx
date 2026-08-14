'use client';

import Title from '../../components/Title';
import { Truck, Globe, Clock, MapPin, Mail, Phone } from 'lucide-react';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen text-black mt-16 sm:mt-20">
      <section className="py-16 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4 text-center">Legal</p>
          <div className="text-3xl text-center mb-5">
            <Title text1="SHIPPING &" text2="DELIVERY POLICY" />
          </div>
          <p className="text-sm text-gray-400 font-light text-center max-w-2xl mx-auto leading-relaxed">
            We ensure your handcrafted Aharyas pieces reach you safely and promptly, whether you&apos;re in India or anywhere across the globe.
          </p>
        </div>
      </section>

      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
            {[
              { value: '0–7 days', label: 'Processing Time' },
              { value: 'Free', label: 'Shipping above ₹999' },
              { value: 'Pan India', label: 'Domestic Coverage' },
              { value: 'Worldwide', label: 'International Shipping' },
            ].map(({ value, label }, i) => (
              <div key={label} className={`px-6 py-6 border-gray-100 ${i < 3 ? 'border-r' : ''}`}>
                <p className="text-lg font-light text-black mb-0.5">{value}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 border border-gray-200 flex items-center justify-center">
              <Truck size={14} className="text-gray-400" />
            </div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">Shipping Methods</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-0 border border-gray-100">
            {[
              {
                icon: Globe,
                title: 'International Shipping',
                sub: 'For our global customers',
                body: 'We ship through registered international courier companies and international speed post services. All international shipments include tracking and insurance.',
                services: ['Registered International Courier Companies', 'International Speed Post'],
              },
              {
                icon: MapPin,
                title: 'Domestic Shipping',
                sub: 'Within India',
                body: 'We ensure reliable delivery through registered domestic courier companies and speed post services across all major cities and towns in India.',
                services: ['Registered Domestic Courier Companies', 'Speed Post'],
              },
            ].map(({ icon: Icon, title, sub, body, services }, i) => (
              <div key={title} className={`group p-8 hover:bg-gray-50 transition-colors ${i < 1 ? 'border-b lg:border-b-0 lg:border-r border-gray-100' : ''}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 border border-gray-200 flex items-center justify-center group-hover:border-black group-hover:bg-black transition-all">
                    <Icon size={14} className="text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-black uppercase tracking-wider">{title}</p>
                    <p className="text-xs text-gray-400 font-light">{sub}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">{body}</p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Available Services</p>
                  <ul className="space-y-1.5">
                    {services.map(s => (
                      <li key={s} className="flex items-start gap-2 text-sm text-gray-500 font-light">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 border border-gray-200 flex items-center justify-center">
              <Clock size={14} className="text-gray-400" />
            </div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">Processing Time</h2>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 mb-10">
            <div>
              <p className="text-5xl font-light text-black mb-2">0–7 days</p>
              <p className="text-sm text-gray-400 font-light">Order processing & shipping window</p>
            </div>
            <div className="flex-1 border-l border-gray-100 lg:pl-10">
              <p className="text-sm text-gray-600 font-light leading-relaxed max-w-lg">
                Orders are processed and shipped within 0–7 days from order confirmation, or as per the delivery date agreed at the time of order placement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-3">Need Help?</p>
          <h2 className="text-sm font-medium text-black uppercase tracking-widest mb-8">Shipping Support</h2>
          <div className="grid md:grid-cols-2 gap-0 border border-gray-100 mb-10">
            <div className="p-8 border-r border-gray-100">
              <Phone size={16} className="text-gray-400 mb-3" />
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Helpdesk Phone</p>
              <a href="tel:+919063284008" className="block text-sm font-medium text-black hover:underline">+91 9063284008</a>
              <a href="tel:+919121157804" className="block text-sm font-medium text-black hover:underline mt-1">+91 91211 57804</a>
            </div>
            <div className="p-8">
              <Mail size={16} className="text-gray-400 mb-3" />
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Email Support</p>
              <a href="mailto:aharyasofficial@gmail.com" className="block text-sm font-medium text-black hover:underline">aharyasofficial@gmail.com</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
