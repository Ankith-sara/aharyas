import { useState } from 'react';
import Title from '../components/Title';
import { ChevronDown, ChevronUp, Package, Truck, RotateCcw, Shield, User, HelpCircle, Mail, Phone, ArrowUpRight } from 'lucide-react';
import usePageMeta from '../components/usePageMeta';

const FAQ_CATEGORIES = [
  {
    title: 'Orders & Shopping',
    icon: Package,
    faqs: [
      { question: 'How do I place an order?', answer: 'Browse our collection, add to cart, and checkout securely. You\'ll need an account or guest checkout to complete your purchase.' },
      { question: 'Can I modify or cancel my order?', answer: 'Yes, within 6 hours of placing it. After that, contact support — we\'ll try our best before the order is processed.' },
      { question: 'What payment methods do you accept?', answer: 'We accept cards, UPI, net banking, and major wallets — all secured with modern encryption.' },
      { question: 'Do you offer bulk or wholesale pricing?', answer: 'Yes, for custom or bulk orders. Email us at aharyasofficial@gmail.com for a tailored quote.' },
    ],
  },
  {
    title: 'Shipping & Delivery',
    icon: Truck,
    faqs: [
      { question: 'What are your shipping charges?', answer: 'Free shipping on orders above ₹999. For smaller orders, minimal delivery charges apply based on your location.' },
      { question: 'How long does delivery take?', answer: '0–7 business days for domestic orders. Timelines may vary based on courier and destination.' },
      { question: 'Do you ship internationally?', answer: 'Yes, worldwide shipping is available through trusted courier partners with tracking and insurance.' },
      { question: 'Can I track my order?', answer: 'Absolutely! You\'ll receive a tracking link via email once your order ships.' },
    ],
  },
  {
    title: 'Returns & Refunds',
    icon: RotateCcw,
    faqs: [
      { question: 'What is your return policy?', answer: 'We accept returns within 7 days for unused items in original packaging. Personalised pieces may not qualify.' },
      { question: 'How do I initiate a return?', answer: 'Email us at aharyasofficial@gmail.com with your order details and reason. We\'ll guide you through it.' },
      { question: 'When will I receive my refund?', answer: 'Within 5–7 business days after we receive and verify the return.' },
      { question: 'Do you offer exchanges?', answer: 'Yes — for size, color, or variant swaps (subject to availability).' },
    ],
  },
  {
    title: 'Products & Quality',
    icon: Shield,
    faqs: [
      { question: 'Are your products authentic handcrafted items?', answer: '100%. Each piece is made by skilled artisans with authentic materials and craftsmanship.' },
      { question: 'How do you ensure product quality?', answer: 'Every item undergoes strict quality checks before shipping — handcrafted doesn\'t mean imperfect here.' },
      { question: 'Can I see more product images or details?', answer: 'Yes! Check product pages or contact us for custom photos or artisan details.' },
      { question: 'Do you offer custom or personalized items?', answer: 'Yes, custom handcrafted pieces are available upon request.' },
    ],
  },
  {
    title: 'Account & Support',
    icon: User,
    faqs: [
      { question: 'How do I create an account?', answer: "Click 'Sign Up' on top of any page or create one during checkout — quick and easy." },
      { question: 'I forgot my password. How do I reset it?', answer: "Click 'Forgot Password', enter your email, and follow the reset link we send you." },
      { question: 'Is my personal information secure?', answer: 'Yes. All data is encrypted and protected — we never share it without consent.' },
      { question: 'How can I contact customer support?', answer: 'Email aharyasofficial@gmail.com or call +91 9063284008 (Mon–Sat, 9 AM–6 PM).' },
    ],
  },
];

const FAQs = () => {
  const [openItems, setOpenItems] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState(null);

  usePageMeta({
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about Aharyas — shipping, returns, sizing, artisan sourcing, and more.',
  });

  const toggle = (key) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const totalFAQs = FAQ_CATEGORIES.reduce((acc, c) => acc + c.faqs.length, 0);

  return (
    <div className="min-h-screen text-black mt-16">

      {/* Header */}
      <section className="py-16 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4 text-center">Help Centre</p>
          <div className="text-3xl text-center mb-5">
            <Title text1="FREQUENTLY" text2="ASKED QUESTIONS" />
          </div>
          <p className="text-sm text-gray-400 font-light text-center max-w-xl mx-auto leading-relaxed">
            Everything you need to know about Aharyas — from orders to quality and beyond.
          </p>

          {/* Stats strip */}
          <div className="mt-10 grid grid-cols-3 gap-0 border border-gray-100 max-w-lg mx-auto">
            {[
              { value: FAQ_CATEGORIES.length, label: 'Categories' },
              { value: totalFAQs, label: 'Questions' },
              { value: '24 hrs', label: 'Response Time' },
            ].map(({ value, label }, i) => (
              <div key={label} className={`px-6 py-4 text-center ${i < 2 ? 'border-r border-gray-100' : ''}`}>
                <p className="text-xl font-light text-black">{value}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category nav */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {FAQ_CATEGORIES.map(({ title, icon: Icon }) => (
              <button
                key={title}
                onClick={() => {
                  setActiveCategory(title);
                  document.getElementById(`cat-${title}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex items-center gap-2 px-4 py-4 text-[10px] uppercase tracking-[0.2em] font-medium whitespace-nowrap border-b-2 transition-all duration-200 flex-shrink-0 ${activeCategory === title ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
              >
                <Icon size={12} />
                {title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Categories */}
      <section className="px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          {FAQ_CATEGORIES.map(({ title, icon: Icon, faqs }, catIdx) => (
            <div
              key={title}
              id={`cat-${title}`}
              className="py-14 border-b border-gray-100 last:border-b-0"
            >
              {/* Category header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-gray-400" />
                </div>
                <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">{title}</h2>
                <span className="text-[10px] text-gray-300 font-light ml-auto">{faqs.length} questions</span>
              </div>

              {/* FAQ items */}
              <div className="border border-gray-100 divide-y divide-gray-100">
                {faqs.map((faq, faqIdx) => {
                  const key = `${catIdx}-${faqIdx}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={key} className="group">
                      <button
                        onClick={() => toggle(key)}
                        className="w-full px-7 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <span className="text-sm font-medium text-black group-hover:text-black leading-snug">{faq.question}</span>
                        <div className={`w-6 h-6 border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isOpen ? 'bg-black border-black' : 'border-gray-200'}`}>
                          {isOpen
                            ? <ChevronUp size={12} className="text-white" />
                            : <ChevronDown size={12} className="text-gray-400" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-7 pb-6 border-t border-gray-100 bg-gray-50/50">
                          <p className="text-sm text-gray-500 font-light leading-relaxed pt-4">
                            {faq.answer}
                          </p>
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

      {/* Need more help */}
      <section className="py-14 px-4 sm:px-8 lg:px-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 border border-gray-200 flex items-center justify-center">
              <HelpCircle size={14} className="text-gray-400" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">Need More Help?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-0 border border-gray-100 mb-12">
            {[
              { icon: Mail, label: 'Email Support', main: 'aharyasofficial@gmail.com', note: 'Response within 24 hours', href: 'mailto:aharyasofficial@gmail.com' },
              { icon: Phone, label: 'Phone Support', main: '+91 9063284008', note: 'Mon–Sat: 9 AM – 6 PM', href: 'tel:+919063284008' },
            ].map(({ icon: Icon, label, main, note, href }, i) => (
              <div key={label} className={`group p-8 hover:bg-gray-50 transition-colors duration-200 ${i < 1 ? 'border-b md:border-b-0 md:border-r border-gray-100' : ''}`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-9 h-9 border border-gray-200 flex items-center justify-center group-hover:border-black group-hover:bg-black transition-all duration-300">
                    <Icon size={14} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <a href={href}>
                    <ArrowUpRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-black transition-all duration-200" />
                  </a>
                </div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-medium mb-2">{label}</p>
                <a href={href} className="block text-base font-medium text-black hover:underline underline-offset-4 mb-1">{main}</a>
                <p className="text-xs text-gray-400 font-light">{note}</p>
              </div>
            ))}
          </div>

          {/* Quick support cards */}
          <div className="grid md:grid-cols-3 gap-0 border border-gray-100">
            {[
              { icon: Package, title: 'Order Issues', text: 'Problems with placing or tracking orders' },
              { icon: Truck, title: 'Shipping Questions', text: 'Delivery times and shipping policies' },
              { icon: RotateCcw, title: 'Returns & Refunds', text: 'Return process and refund status' },
            ].map(({ icon: Icon, title, text }, i) => (
              <div key={title} className={`group p-7 hover:bg-gray-50 transition-colors duration-200 border-gray-100 ${i < 2 ? 'border-b md:border-b-0 md:border-r' : ''}`}>
                <div className="w-8 h-8 border border-gray-200 flex items-center justify-center mb-4 group-hover:border-black group-hover:bg-black transition-all duration-300">
                  <Icon size={13} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                </div>
                <p className="text-xs font-medium text-black uppercase tracking-wider mb-2">{title}</p>
                <p className="text-sm text-gray-500 font-light">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQs;