import { Scale, FileText, AlertTriangle, Shield, Link, CreditCard, User, ShoppingCart, Gavel, Mail, Phone, ArrowUpRight } from 'lucide-react';
import Title from '../components/Title';
import usePageMeta from '../components/usePageMeta';

const SECTIONS = [
  {
    icon: FileText,
    heading: 'Company Information',
    content: (
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4 text-gray-600 text-sm font-light leading-relaxed">
          <p>These terms and conditions apply to TATHASTA WEAVES LLP and all users of our website and services. By accessing or purchasing from our website, you agree to be bound by these terms.</p>
          <div className="border border-gray-100 p-5">
            <p className="text-xs font-medium text-black uppercase tracking-wider mb-3">Legal Entity</p>
            <p className="font-medium text-black text-sm mb-2">TATHASTA WEAVES LLP</p>
            <p className="text-sm text-gray-500 font-light leading-relaxed">J J Nagar, Near Ganesh Temple,<br />Sainikpuri, Malkajgiri,<br />Hyderabad, Telangana 500094</p>
          </div>
        </div>
        <div className="border border-gray-100 p-5">
          <p className="text-xs font-medium text-black uppercase tracking-wider mb-4">Definitions</p>
          <div className="space-y-4">
            {[
              { term: '"We", "Us", "Our"', def: 'Refers to TATHASTA WEAVES LLP' },
              { term: '"You", "Your", "User"', def: 'Any natural or legal person visiting our website and/or purchasing from us' },
              { term: '"Services"', def: 'Our website, products, and customer support' },
            ].map(({ term, def }) => (
              <div key={term}>
                <p className="text-xs font-medium text-black mb-0.5">{term}</p>
                <p className="text-sm text-gray-500 font-light">{def}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Scale,
    heading: 'Website Usage Terms',
    content: (
      <div className="grid md:grid-cols-2 gap-0 border border-gray-100">
        {[
          { icon: FileText, title: 'Content Changes', body: 'The content of our website pages is subject to change without notice. We reserve the right to modify information, prices, and product availability at any time.' },
          { icon: AlertTriangle, title: 'Information Accuracy', body: 'While we strive for accuracy, neither we nor third parties provide any warranty regarding the accuracy, timeliness, or completeness of information on our website. Use of any information is entirely at your own risk.' },
          { icon: User, title: 'User Responsibilities', body: 'You are responsible for ensuring the confidentiality of your account information and for all activities under your account. Please notify us immediately of any unauthorized use.' },
          { icon: Shield, title: 'Prohibited Uses', body: 'You may not use our site for any unlawful purpose, harassment or abuse of other users, transmission of viruses or malicious code, or unauthorized data collection.' },
          { icon: Link, title: 'Third-Party Links', body: 'Our website may contain links to third-party sites. We are not responsible for the content or privacy practices of these external sites.' },
          { icon: Gavel, title: 'Governing Law', body: 'These terms are governed by and construed in accordance with the laws of India, and you submit to the jurisdiction of the courts in Hyderabad, Telangana.' },
        ].map(({ icon: Icon, title, body }, i) => (
          <div key={title} className={`group p-6 hover:bg-gray-50 transition-colors duration-200 border-gray-100 ${i < 4 ? 'border-b' : ''} ${i % 2 === 0 ? 'border-r' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={13} className="text-gray-400" />
              <p className="text-xs font-medium text-black uppercase tracking-wider">{title}</p>
            </div>
            <p className="text-sm text-gray-500 font-light leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: ShoppingCart,
    heading: 'Purchase Terms',
    content: (
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="border border-gray-100 p-6">
          <p className="text-xs font-medium text-black uppercase tracking-wider mb-4">Order Process</p>
          <p className="text-sm text-gray-600 font-light mb-4">By placing an order with us, you agree to provide current, complete, and accurate purchase information.</p>
          <ul className="space-y-2 text-sm text-gray-500 font-light">
            {['Order confirmation sent within 24 hours', 'Payment processing and verification', 'Product preparation (0–7 days)', 'Shipping and delivery tracking'].map(item => (
              <li key={item} className="flex items-start gap-2">{item}</li>
            ))}
          </ul>
        </div>
        <div className="border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={13} className="text-gray-400" />
            <p className="text-xs font-medium text-black uppercase tracking-wider">Payment Terms</p>
          </div>
          <p className="text-sm text-gray-600 font-light mb-4">We reserve the right to refuse or cancel your order if fraud or unauthorized purchase is suspected.</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Accepted Methods</p>
          <ul className="space-y-1.5 text-sm text-gray-500 font-light">
            {['Credit / Debit Cards', 'Digital Wallets', 'Bank Transfers', 'UPI Payments'].map(item => (
              <li key={item} className="flex items-start gap-2">{item}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    icon: AlertTriangle,
    heading: 'Liability & Disclaimer',
    content: (
      <div className="grid md:grid-cols-3 gap-0 border border-gray-100">
        {[
          { icon: AlertTriangle, title: 'Limitation of Liability', body: 'In no case shall TATHASTA WEAVES LLP be liable for any direct, indirect, punitive, incidental, special, or consequential damages that result from the use of, or inability to use, this website or the purchase of products from us.' },
          { icon: Shield, title: 'Product Quality', body: 'While we take great care in crafting our products, we acknowledge that handmade items may have natural variations. We provide detailed product descriptions and images to help you make informed decisions.' },
          { icon: Scale, title: 'Force Majeure', body: 'We shall not be liable for any failure to perform our obligations where such failure results from acts of nature, war, terrorism, labor disputes, or other causes beyond our reasonable control.' },
        ].map(({ icon: Icon, title, body }, i) => (
          <div key={title} className={`p-6 border-gray-100 ${i < 2 ? 'border-b md:border-b-0 md:border-r' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={13} className="text-gray-400" />
              <p className="text-xs font-medium text-black uppercase tracking-wider">{title}</p>
            </div>
            <p className="text-sm text-gray-500 font-light leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Shield,
    heading: 'Privacy & Data Protection',
    content: (
      <div className="grid md:grid-cols-2 gap-8">
        <div className="border border-gray-100 p-6">
          <p className="text-xs font-medium text-black uppercase tracking-wider mb-4">Information We Collect</p>
          <ul className="space-y-1.5 text-sm text-gray-500 font-light">
            {['Contact information (name, email, phone)', 'Billing and shipping addresses', 'Payment information (processed securely)', 'Order history and preferences'].map(item => (
              <li key={item} className="flex items-start gap-2">{item}</li>
            ))}
          </ul>
        </div>
        <div className="border border-gray-100 p-6">
          <p className="text-xs font-medium text-black uppercase tracking-wider mb-4">How We Use Your Data</p>
          <ul className="space-y-1.5 text-sm text-gray-500 font-light">
            {['Processing and fulfilling orders', 'Customer support and communication', 'Improving our products and services', 'Marketing (with your consent)'].map(item => (
              <li key={item} className="flex items-start gap-2">{item}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
];

const TermsConditions = () => {
  usePageMeta({
    title: 'Terms & Conditions',
    description: 'Terms of use for Aharyas.com — please read before placing your order.',
  });

  return (
    <div className="min-h-screen text-black mt-16">

      {/* Header */}
      <section className="py-16 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4 text-center">Legal</p>
          <div className="text-3xl text-center mb-5">
            <Title text1="TERMS &" text2="CONDITIONS" />
          </div>
          <p className="text-sm text-gray-400 font-light text-center max-w-2xl mx-auto leading-relaxed">
            These terms and conditions govern your use of our website and purchase of our handcrafted products. Please read them carefully.
          </p>
        </div>
      </section>

      {/* Sections */}
      {SECTIONS.map(({ icon: Icon, heading, content }) => (
        <section key={heading} className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
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

      {/* Contact + Agreement banner */}
      <section className="py-14 px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-3">Questions?</p>
          <h2 className="text-sm font-medium text-black uppercase tracking-widest mb-8">Contact Us About These Terms</h2>

          <div className="grid md:grid-cols-2 gap-0 border border-gray-100 mb-10">
            {[
              { icon: Phone, label: 'Phone Support', lines: ['+91 9063284008', '+91 9121157804'], note: 'Mon–Sat: 9 AM – 6 PM', href: 'tel:+919063284008' },
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

          {/* Agreement banner */}
          <div className="relative bg-black px-10 py-10 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }} />
            <div className="relative max-w-3xl">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2">Agreement to Terms</p>
              <h3 className="text-lg font-light text-white mb-3">By using our website and services, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.</h3>
              <p className="text-sm text-white/40 font-light leading-relaxed">These terms may be updated periodically, and your continued use constitutes acceptance of any changes.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsConditions;