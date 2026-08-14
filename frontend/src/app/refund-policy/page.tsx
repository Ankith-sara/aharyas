'use client';

import Title from '../../components/Title';
import { RotateCcw, Shield, Clock, AlertCircle, PackageCheck, XCircle, Mail, Phone } from 'lucide-react';

const POLICY_POINTS = [
  { icon: Clock, title: 'Order Cancellation Window', body: 'Orders may be cancelled within 6 hours of placement by emailing support@aharyas.com. After this window, orders are processed and cannot be cancelled.' },
  { icon: XCircle, title: 'No Refunds Policy', body: 'Refunds are not offered under any circumstances. We provide replacements or exchanges for eligible cases only. This policy supports our artisan partners.' },
  { icon: Shield, title: 'Handcrafted Nature', body: 'Minor irregularities in color, print, or weave reflect the handcrafted nature of our products. These variations are characteristics of authentic handmade items, not defects.' },
  { icon: AlertCircle, title: 'Report Damage Immediately', body: 'Any damage or defect must be reported within 2 working days of receiving the order. Include clear photos and your order number when contacting us.' },
  { icon: PackageCheck, title: 'Return Conditions', body: 'Items must be unused, unwashed, and in original packaging with tags intact for exchange.' },
  { icon: RotateCcw, title: 'Size Exchanges', body: 'Size exchanges are accepted only if the incorrect size was delivered or if approved by customer support.' },
];

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen text-black mt-16 sm:mt-20">
      <section className="py-16 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4 text-center">Legal</p>
          <div className="text-3xl text-center mb-5">
            <Title text1="RETURN &" text2="EXCHANGE POLICY" />
          </div>
          <p className="text-sm text-gray-400 font-light text-center max-w-2xl mx-auto leading-relaxed">
            At Aharyas, we celebrate handcrafted products. Slight variations in color, weave, or texture are a natural part of authenticity — not a defect.
          </p>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-0 border border-gray-100">
            {POLICY_POINTS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="p-7 border-b border-r border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={13} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-black uppercase tracking-wider mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 font-light leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-sm font-medium text-black uppercase tracking-widest mb-8">Contact Support</h2>
          <div className="grid md:grid-cols-2 gap-0 border border-gray-100">
            <div className="p-8 border-r border-gray-100">
              <Mail size={16} className="text-gray-400 mb-2" />
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Email</p>
              <a href="mailto:support@aharyas.com" className="text-sm font-medium text-black hover:underline">support@aharyas.com</a>
            </div>
            <div className="p-8">
              <Phone size={16} className="text-gray-400 mb-2" />
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Phone</p>
              <a href="tel:+919063284008" className="text-sm font-medium text-black hover:underline">+91 9063284008</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
