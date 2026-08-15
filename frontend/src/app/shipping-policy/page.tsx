'use client';

import Title from '../../components/Title';
import { 
  Truck, Globe, Package, Clock, MapPin, Mail, Phone, ArrowUpRight 
} from 'lucide-react';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen text-black mt-16 sm:mt-20">

      {/* Header */}
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

      {/* Quick summary */}
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

      {/* Shipping Methods */}
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
                body: 'We ship through registered international courier companies and international speed post services. All international shipments include tracking and insurance for your peace of mind.',
                services: ['Registered International Courier Companies', 'International Speed Post'],
              },
              {
                icon: MapPin,
                title: 'Domestic Shipping',
                sub: 'Within India',
                body: 'We ensure reliable delivery through registered domestic courier companies and speed post services. Fast and secure delivery across all major cities and towns in India.',
                services: ['Registered Domestic Courier Companies', 'Speed Post'],
              },
            ].map(({ icon: Icon, title, sub, body, services }, i) => (
              <div key={title} className={`group p-8 hover:bg-gray-50 transition-colors duration-200 ${i < 1 ? 'border-b lg:border-b-0 lg:border-r border-gray-100' : ''}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 border border-gray-200 flex items-center justify-center group-hover:border-black group-hover:bg-black transition-all duration-300">
                    <Icon size={14} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
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

      {/* Processing timeline */}
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

          <div className="grid md:grid-cols-3 gap-0 border border-gray-100">
            {[
              { icon: Package, step: '01', title: 'Order Confirmation', body: 'Within 24 hours of payment' },
              { icon: Truck, step: '02', title: 'Processing', body: '0–7 days preparation time' },
              { icon: Globe, step: '03', title: 'Shipment', body: 'Handed to courier partner with tracking details' },
            ].map(({ icon: Icon, step, title, body }, i) => (
              <div key={title} className={`group p-7 hover:bg-gray-50 transition-colors duration-200 border-gray-100 ${i < 2 ? 'border-b md:border-b-0 md:border-r' : ''}`}>
                <span className="text-3xl font-light text-black/10 block mb-4 group-hover:text-black/20 transition-colors duration-300">{step}</span>
                <div className="w-8 h-8 border border-gray-200 flex items-center justify-center mb-4 group-hover:border-black group-hover:bg-black transition-all duration-300">
                  <Icon size={13} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                </div>
                <p className="text-xs font-medium text-black uppercase tracking-wider mb-2">{title}</p>
                <div className="w-8 h-px bg-gray-200 mb-3 group-hover:w-12 group-hover:bg-black transition-all duration-300" />
                <p className="text-sm text-gray-500 font-light">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notices */}
      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 border border-gray-200 flex items-center justify-center">
              <Package size={14} className="text-gray-400" />
            </div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">Important Notice</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-0 border border-gray-100">
            {[
              { icon: Clock, title: 'Delivery Responsibility', body: 'Aharyas is not liable for any delay in delivery by courier companies or postal authorities. We guarantee to hand over the consignment within the specified timeframe from order and payment date.' },
              { icon: MapPin, title: 'Delivery Address', body: 'All orders will be delivered to the address provided by the buyer at the time of order placement. Please ensure your address is complete and accurate to avoid delivery delays.' },
              { icon: Mail, title: 'Delivery Confirmation', body: 'Delivery confirmation will be sent to your registered email address. You\'ll receive tracking information once your order is dispatched.' },
            ].map(({ icon: Icon, title, body }, i) => (
              <div key={title} className={`p-7 border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${i < 2 ? 'border-b md:border-b-0 md:border-r' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={13} className="text-gray-400" />
                  <p className="text-xs font-medium text-black uppercase tracking-wider">{title}</p>
                </div>
                <p className="text-sm text-gray-500 font-light leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact + CTA */}
      <section className="py-14 px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-3">Need Help?</p>
          <h2 className="text-sm font-medium text-black uppercase tracking-widest mb-8">Shipping Support</h2>

          <div className="grid md:grid-cols-2 gap-0 border border-gray-100 mb-10">
            {[
              { icon: Phone, label: 'Helpdesk Phone', lines: ['+91 9063284008', '+91 9121157804'], note: 'Mon–Sat: 9 AM – 6 PM', href: 'tel:+919063284008' },
              { icon: Mail, label: 'Email Support', lines: ['aharyasofficial@gmail.com'], note: 'Response within 24 hours', href: 'mailto:aharyasofficial@gmail.com' },
            ].map(({ icon: Icon, label, lines, note, href }, i) => (
              <div key={label} className={`group p-8 hover:bg-gray-50 transition-colors duration-200 ${i < 1 ? 'border-b md:border-b-0 md:border-r border-gray-100' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 border border-gray-200 flex items-center justify-center group-hover:border-black group-hover:bg-black transition-all duration-300">
                    <Icon size={14} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <a href={href}><ArrowUpRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-black transition-all duration-200" /></a>
                </div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-medium mb-3">{label}</p>
                {lines.map(l => <a key={l} href={href} className="block text-sm font-medium text-black hover:underline underline-offset-4 mb-0.5">{l}</a>)}
                <p className="text-xs text-gray-400 font-light mt-2">{note}</p>
              </div>
            ))}
          </div>

          {/* Tracking CTA banner */}
          <div className="relative bg-black px-10 py-10 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }} />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2">Order Tracking</p>
                <h3 className="text-lg font-light text-white mb-2">Tracking Your Order</h3>
                <p className="text-sm text-white/40 font-light max-w-lg leading-relaxed">Once your order is shipped, you&apos;ll receive a tracking number via email. Use it to follow your package&apos;s journey from our facility to your doorstep.</p>
              </div>
              <a href="mailto:aharyasofficial@gmail.com" className="flex-shrink-0">
                <button className="group inline-flex items-center gap-3 border border-white/25 text-white px-7 py-3.5 text-xs font-medium uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all duration-300 cursor-pointer">
                  Contact Support
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
