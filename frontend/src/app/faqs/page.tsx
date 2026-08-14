'use client';

import { useState } from 'react';
import Title from '../../components/Title';
import { ChevronDown, ChevronUp, Package, Truck, RotateCcw, Shield, User, HelpCircle, Mail, Phone, ArrowUpRight } from 'lucide-react';

const FAQ_CATEGORIES = [
  {
    title: 'Orders & Shopping',
    icon: Package,
    faqs: [
      { question: 'How do I place an order?', answer: 'Browse our collection, add to cart, and checkout securely.' },
      { question: 'Can I modify or cancel my order?', answer: 'Yes, within 6 hours of placing it. Email support@aharyas.com.' },
      { question: 'What payment methods do you accept?', answer: 'We accept cards, UPI, net banking, and COD.' },
    ],
  },
  {
    title: 'Shipping & Delivery',
    icon: Truck,
    faqs: [
      { question: 'What are your shipping charges?', answer: 'Free shipping on orders above ₹999.' },
      { question: 'How long does delivery take?', answer: '0–7 business days for domestic orders.' },
    ],
  },
  {
    title: 'Returns & Refunds',
    icon: RotateCcw,
    faqs: [
      { question: 'What is your return policy?', answer: 'We accept replacements/exchanges within 15 days for eligible items.' },
    ],
  },
];

export default function FAQsPage() {
  const [openItems, setOpenItems] = useState(new Set());

  const toggle = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen text-black mt-16 sm:mt-20">
      <section className="py-16 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4 text-center">Help Centre</p>
          <div className="text-3xl text-center mb-5">
            <Title text1="FREQUENTLY" text2="ASKED QUESTIONS" />
          </div>
          <p className="text-sm text-gray-400 font-light text-center max-w-xl mx-auto leading-relaxed">
            Everything you need to know about Aharyas — from orders to quality and beyond.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-8 lg:px-20 py-10">
        <div className="max-w-4xl mx-auto space-y-12">
          {FAQ_CATEGORIES.map(({ title, icon: Icon, faqs }, catIdx) => (
            <div key={title}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 border border-gray-200 flex items-center justify-center">
                  <Icon size={14} className="text-gray-400" />
                </div>
                <h2 className="text-xs uppercase tracking-widest font-semibold">{title}</h2>
              </div>
              <div className="border border-gray-100 divide-y divide-gray-100">
                {faqs.map((faq, faqIdx) => {
                  const key = `${catIdx}-${faqIdx}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={key}>
                      <button
                        onClick={() => toggle(key)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-black">{faq.question}</span>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 bg-gray-50/50">
                          <p className="text-sm text-gray-500 font-light leading-relaxed pt-2">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
