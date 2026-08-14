'use client';

import Title from '../../components/Title';

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen text-black mt-16 sm:mt-20">
      <section className="py-16 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4 text-center">Legal</p>
          <div className="text-3xl text-center mb-5">
            <Title text1="TERMS &" text2="CONDITIONS" />
          </div>
          <p className="text-sm text-gray-400 font-light text-center max-w-2xl mx-auto leading-relaxed">
            These terms and conditions govern your use of our website and purchase of our handcrafted products.
          </p>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="border border-gray-100 p-6">
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-3">Company Information</h3>
            <p className="text-sm text-gray-600 font-light leading-relaxed">
              These terms apply to TATHASTA WEAVES LLP. By accessing or purchasing from our website, you agree to be bound by these terms.
            </p>
          </div>

          <div className="border border-gray-100 p-6">
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-3">Website Usage Terms</h3>
            <p className="text-sm text-gray-600 font-light leading-relaxed">
              Content is subject to change without notice. Prices and availability are subject to change.
            </p>
          </div>

          <div className="border border-gray-100 p-6">
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-3">Governing Law</h3>
            <p className="text-sm text-gray-600 font-light leading-relaxed">
              These terms are governed by the laws of India and subject to jurisdiction in Hyderabad, Telangana.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
