import { Shield, Eye, Lock, Cookie, Users, Mail, Phone, MapPin, Database, Settings, AlertCircle } from 'lucide-react';
import Title from '../components/Title';
import usePageMeta from '../components/usePageMeta';

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
          <p className="text-sm text-gray-500 font-light leading-relaxed">We may change this policy from time to time by updating this page. You should check this page periodically to ensure that you adhere to these changes. Your continued use of our services after any modifications constitutes acceptance of the updated policy.</p>
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
            <p className="text-sm text-gray-500 font-light mb-3">We may collect the following information:</p>
            <ul className="space-y-1.5 text-sm text-gray-500 font-light">
              {['Name — for order processing and communication', 'Contact information including email address', 'Demographic information such as postcode and preferences', 'Survey information relevant to customer offers'].map(item => (
                <li key={item} className="flex items-start gap-2">{item}</li>
              ))}
            </ul>
          </div>
          <div className="border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={13} className="text-gray-400" />
              <p className="text-xs font-medium text-black uppercase tracking-wider">When We Collect</p>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-500 font-light">
              {['When you create an account', 'During the purchase process', 'When you subscribe to our newsletter', 'When you participate in surveys', 'When you contact customer support'].map(item => (
                <li key={item} className="flex items-start gap-2">{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-5">
          <div className="border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={13} className="text-gray-400" />
              <p className="text-xs font-medium text-black uppercase tracking-wider">How We Use It</p>
            </div>
            <p className="text-sm text-gray-500 font-light mb-3">We require this information to understand your needs and provide better service, particularly for:</p>
            <ul className="space-y-1.5 text-sm text-gray-500 font-light">
              {['Internal record keeping', 'Improving our products and services', 'Sending promotional emails about new products', 'Market research purposes', 'Customising the website to your interests'].map(item => (
                <li key={item} className="flex items-start gap-2">{item}</li>
              ))}
            </ul>
          </div>
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
  {
    id: 'cookies',
    icon: Cookie,
    heading: 'How We Use Cookies',
    content: (
      <div className="space-y-6">
        <p className="text-sm text-gray-600 font-light leading-relaxed max-w-3xl">A cookie is a small file which asks permission to be placed on your computer's hard drive. Once you agree, the file is added and the cookie helps analyse web traffic or lets you know when you visit a particular site.</p>
        <div className="grid lg:grid-cols-3 gap-0 border border-gray-100">
          {[
            { label: 'What Cookies Do', items: ['Allow web applications to respond to you as an individual', 'Tailor operations to your needs and preferences', 'Gather and remember information about your preferences', 'Help us analyse webpage traffic'] },
            { label: 'Traffic Log Cookies', items: ['Identify which pages are being used', 'Help analyse data about webpage traffic', 'Used only for statistical analysis', 'Data removed from system after use'] },
            { label: 'Your Cookie Choices', items: ['You can accept or decline cookies', 'Modify browser settings to decline if preferred', 'Declining may limit website functionality', 'Cookies never access your computer data'] },
          ].map(({ label, items }, i) => (
            <div key={label} className={`p-6 ${i < 2 ? 'border-b lg:border-b-0 lg:border-r border-gray-100' : ''}`}>
              <p className="text-xs font-medium text-black uppercase tracking-wider mb-4">{label}</p>
              <ul className="space-y-1.5 text-sm text-gray-500 font-light">
                {items.map(item => (
                  <li key={item} className="flex items-start gap-2">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'control',
    icon: Settings,
    heading: 'Controlling Your Personal Information',
    content: (
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="border border-gray-100 p-6">
          <p className="text-xs font-medium text-black uppercase tracking-wider mb-4">Your Rights & Choices</p>
          <p className="text-sm text-gray-600 font-light mb-4">You may choose to restrict the collection or use of your personal information in the following ways:</p>
          <ul className="space-y-1.5 text-sm text-gray-500 font-light">
            {['Look for opt-out boxes when filling forms on our website', "Indicate if you don't want information used for direct marketing", 'Change your mind at any time by contacting us', 'Update your preferences through your account settings'].map(item => (
              <li key={item} className="flex items-start gap-2">{item}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="border border-gray-100 p-6">
            <p className="text-xs font-medium text-black uppercase tracking-wider mb-3">Our Promise</p>
            <p className="text-sm text-gray-500 font-light leading-relaxed"><strong className="text-black font-medium">We will not sell, distribute, or lease your personal information to third parties</strong> unless we have your permission or are required by law to do so.</p>
          </div>
          <div className="border border-gray-100 p-6">
            <p className="text-xs font-medium text-black uppercase tracking-wider mb-3">Data Accuracy</p>
            <p className="text-sm text-gray-500 font-light leading-relaxed">If you believe that any information we are holding about you is incorrect or incomplete, please contact us as soon as possible. We will promptly correct any information found to be incorrect.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'marketing',
    icon: Mail,
    heading: 'Marketing Communications',
    content: (
      <div className="grid md:grid-cols-2 gap-8">
        <div className="border border-gray-100 p-6">
          <p className="text-xs font-medium text-black uppercase tracking-wider mb-4">Communication Methods</p>
          <p className="text-sm text-gray-500 font-light mb-4">We may periodically send promotional emails about new products, special offers, or other information which we think you may find interesting. We may contact you by:</p>
          <ul className="space-y-1.5 text-sm text-gray-500 font-light">
            {['Email', 'Phone'].map(item => (
              <li key={item} className="flex items-start gap-2">{item}</li>
            ))}
          </ul>
        </div>
        <div className="border border-gray-100 p-6">
          <p className="text-xs font-medium text-black uppercase tracking-wider mb-4">Opt-Out Options</p>
          <p className="text-sm text-gray-500 font-light leading-relaxed">If you have previously agreed to us using your personal information for direct marketing purposes, you may change your mind at any time by writing to or emailing us at <a href="mailto:aharyasofficial@gmail.com" className="text-black underline underline-offset-4">aharyasofficial@gmail.com</a></p>
        </div>
      </div>
    ),
  },
];

const CONTACT_ITEMS = [
  { icon: Phone, label: 'Phone', lines: ['+91 9063284008', '+91 9121157804'], note: 'Mon–Sat: 9 AM – 6 PM' },
  { icon: Mail, label: 'Email', lines: ['aharyasofficial@gmail.com'], note: 'Response within 24 hours' },
  { icon: MapPin, label: 'Address', lines: ['J J Nagar, Near Ganesh Temple,', 'Sainikpuri, Malkajgiri,', 'Hyderabad, Telangana 500094'], note: null },
];

const PrivacyPolicy = () => {
  usePageMeta({
    title: 'Privacy Policy',
    description: 'How Aharyas collects, uses, and protects your personal data — GDPR and Indian IT Act compliant.',
  });

  return (
    <div className="min-h-screen text-black mt-16">

      {/* Header */}
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

      {/* Policy Sections */}
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

      {/* Contact */}
      <section className="py-14 px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4">Privacy Queries</p>
          <h2 className="text-sm font-medium text-black uppercase tracking-widest mb-8">Contact Us About Privacy</h2>
          <div className="grid md:grid-cols-3 gap-0 border border-gray-100">
            {CONTACT_ITEMS.map(({ icon: Icon, label, lines, note }, i) => (
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
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;