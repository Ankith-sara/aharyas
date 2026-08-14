'use client';

import Title from '../../components/Title';
import { Shield, Lock, Users, Mail, Phone, Database, AlertCircle } from 'lucide-react';

const SECTIONS = [
  {
    id: 'commitment',
    icon: Shield,
    heading: 'Our Commitment to Privacy',
    content: (
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-4 text-gray-600 text-sm font-light leading-relaxed">
          <p>TATHASTA WEAVES LLP is committed to ensuring that your privacy is protected. When you provide information that identifies you on our website, you can be assured it will only be used in accordance with this privacy statement.</p>
          <div className="border border-gray-100 p-5">
            <p className="text-xs font-medium text-black mb-2 uppercase tracking-wider">About This Policy</p>
            <p className="text-sm text-gray-500 font-light">This privacy policy sets out how TATHASTA WEAVES LLP uses and protects any information you provide when you visit our website and/or agree to purchase from us.</p>
          </div>
        </div>
        <div className="border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={13} className="text-gray-400" />
            <p className="text-xs font-medium text-black uppercase tracking-wider">Policy Updates</p>
          </div>
          <p className="text-sm text-gray-500 font-light leading-relaxed">We may change this policy from time to time by updating this page. You should check this page periodically to ensure that you adhere to these changes.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'collect',
    icon: Database,
    heading: 'Information We Collect',
    content: (
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={13} className="text-gray-400" />
              <p className="text-xs font-medium text-black uppercase tracking-wider">Personal Information</p>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-500 font-light">
              {['Name — for order processing and communication', 'Contact information including email address', 'Demographic information such as postcode and preferences', 'Survey information relevant to customer offers'].map((item) => (
                <li key={item} className="flex items-start gap-2">{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-5">
          <div className="border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={13} className="text-gray-400" />
              <p className="text-xs font-medium text-black uppercase tracking-wider">Information Security</p>
            </div>
            <p className="text-sm text-gray-500 font-light leading-relaxed">We are committed to ensuring that your information is secure. We have implemented suitable physical, electronic, and managerial procedures to safeguard and secure the information we collect online.</p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen text-black mt-16 sm:mt-20">
      <section className="py-16 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4 text-center">Legal</p>
          <div className="text-3xl text-center mb-5">
            <Title text1="PRIVACY" text2="POLICY" />
          </div>
          <p className="text-sm text-gray-400 font-light text-center max-w-2xl mx-auto leading-relaxed">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information when you visit our website or purchase our products.
          </p>
        </div>
      </section>

      {SECTIONS.map(({ id, icon: Icon, heading, content }) => (
        <section key={id} className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-gray-400" />
              </div>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">{heading}</h2>
            </div>
            {content}
          </div>
        </section>
      ))}

      <section className="py-14 px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4">Privacy Queries</p>
          <h2 className="text-sm font-medium text-black uppercase tracking-widest mb-8">Contact Us About Privacy</h2>
          <div className="grid md:grid-cols-2 gap-0 border border-gray-100">
            <div className="p-8 border-r border-gray-100">
              <Mail size={16} className="text-gray-400 mb-2" />
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Email</p>
              <a href="mailto:aharyasofficial@gmail.com" className="text-sm font-medium text-black hover:underline">aharyasofficial@gmail.com</a>
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
