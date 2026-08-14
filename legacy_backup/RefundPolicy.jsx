import Title from '../components/Title';
import { RotateCcw, Shield, Clock, AlertCircle, CheckCircle, PackageCheck, XCircle, Mail, Phone } from 'lucide-react';
import usePageMeta from '../components/usePageMeta';

const POLICY_POINTS = [
  { icon: Clock, title: 'Order Cancellation Window', body: 'Orders may be cancelled within 6 hours of placement by emailing support@aharyas.com. After this window, orders are processed and cannot be cancelled.' },
  { icon: XCircle, title: 'No Refunds Policy', body: 'Refunds are not offered under any circumstances. We provide replacements or exchanges for eligible cases only. This policy supports our artisan partners and their handcrafted work.' },
  { icon: Shield, title: 'Handcrafted Nature', body: 'Minor irregularities in color, print, or weave reflect the handcrafted nature of our products. These variations are characteristics of authentic handmade items, not defects.' },
  { icon: AlertCircle, title: 'Report Damage Immediately', body: 'Any damage or defect must be reported within 2 working days of receiving the order. Include clear photos and your order number when contacting us.' },
  { icon: PackageCheck, title: 'Return Conditions', body: 'Items must be unused, unwashed, and in original packaging with tags intact for exchange. Any alterations or signs of use will void exchange eligibility.' },
  { icon: XCircle, title: 'Non-Returnable Items', body: 'Custom-made or personalised items, items purchased during sale periods, altered or tailored products, and items without tags or packaging are not eligible for return or exchange.' },
  { icon: RotateCcw, title: 'Size Exchanges', body: 'Size exchanges are accepted only if the incorrect size was delivered. If you ordered the wrong size, exchanges are subject to availability and approval.' },
  { icon: CheckCircle, title: 'Replacement Process', body: 'Verified defective or damaged items will be replaced at the earliest. Our team will verify the issue and process replacement within 5–7 business days.' },
  { icon: AlertCircle, title: 'Do Not Self-Ship', body: 'Please do not self-ship returns without confirmation from our support team. Unauthorised returns will not be processed and shipping costs will not be reimbursed.' },
  { icon: Clock, title: 'Contact Deadline', body: 'For all order-related concerns, contact us at support@aharyas.com within 7 days of delivery. After this period, we cannot process any return or exchange requests.' },
];

const EXCHANGE_STEPS = [
  { n: '01', title: 'Contact Support', body: 'Email support@aharyas.com within 2 working days of receiving your order. Include your order number, photos of the issue, and a detailed description.' },
  { n: '02', title: 'Verification', body: 'Our team will review and verify the issue. Keep the item unused and in original packaging with all tags attached during this process.' },
  { n: '03', title: 'Resolution', body: `Once approved, we'll arrange pickup and send a replacement. The entire process typically takes 5–7 business days from verification.` },
];

const NO_EXCHANGE = [
  { title: 'Change of Mind', body: 'Returns due to personal preference or change of mind are not accepted.' },
  { title: 'Used or Washed Items', body: 'Items that have been worn, washed, or altered cannot be exchanged.' },
  { title: 'Missing Tags or Packaging', body: 'Items without original tags and packaging are not eligible.' },
  { title: 'Custom or Sale Items', body: 'Custom-made items and sale products are final sale.' },
  { title: 'Minor Variations', body: 'Natural variations in handcrafted items are not grounds for return.' },
  { title: 'Late Requests', body: 'Requests made after 7 days of delivery cannot be processed.' },
];

const CancellationRefundPolicy = () => {
  usePageMeta({
    title: 'Return & Exchange Policy',
    description: 'Aharyas return and exchange policy — eligibility conditions, how to raise a request, and refund timelines.',
  });

  return (
    <div className="min-h-screen text-black mt-16">

      {/* Header */}
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

      {/* Quick summary strip */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
            {[
              { value: '6 hrs', label: 'Cancellation Window' },
              { value: 'No Refunds', label: 'Replacements Only' },
              { value: '2 days', label: 'Report Damage' },
              { value: '7 days', label: 'Contact Deadline' },
            ].map(({ value, label }, i) => (
              <div key={label} className={`px-6 py-6 border-gray-100 ${i < 3 ? 'border-r' : ''}`}>
                <p className="text-lg font-light text-black mb-0.5">{value}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Policy Points */}
      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <PackageCheck size={14} className="text-gray-400" />
            </div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">Our Return & Exchange Policy</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-0 border border-gray-100">
            {POLICY_POINTS.map(({ icon: Icon, title, body }, i) => {
              const isLastRow = i >= POLICY_POINTS.length - (POLICY_POINTS.length % 2 === 0 ? 2 : 1);
              const isRightCol = i % 2 === 1;
              return (
                <div
                  key={title}
                  className={`group p-7 hover:bg-gray-50 transition-colors duration-200 border-gray-100 ${!isLastRow ? 'border-b' : ''} ${!isRightCol ? 'border-r' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-black group-hover:bg-black transition-all duration-300">
                      <Icon size={13} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xs font-medium text-black uppercase tracking-wider">{title}</h3>
                      </div>
                      <p className="text-sm text-gray-500 font-light leading-relaxed">{body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Exchange Process */}
      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <RotateCcw size={14} className="text-gray-400" />
            </div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">How to Request an Exchange</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-0 border border-gray-100">
            {EXCHANGE_STEPS.map(({ n, title, body }, i) => (
              <div key={n} className={`p-8 border-gray-100 ${i < 2 ? 'border-b lg:border-b-0 lg:border-r' : ''}`}>
                <span className="text-3xl font-light text-black/10 block mb-5">{n}</span>
                <h3 className="text-xs font-medium text-black uppercase tracking-wider mb-3">{title}</h3>
                <div className="w-8 h-px bg-gray-200 mb-4" />
                <p className="text-sm text-gray-500 font-light leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Items We Cannot Exchange */}
      <section className="py-14 px-4 sm:px-8 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <XCircle size={14} className="text-gray-400" />
            </div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">Items We Cannot Exchange</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-gray-100">
            {NO_EXCHANGE.map(({ title, body }, i) => (
              <div key={title} className={`p-6 border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${i % 3 < 2 ? 'border-r' : ''} ${i < 3 ? 'border-b' : ''}`}>
                <p className="text-xs font-medium text-black uppercase tracking-wider mb-2">{title}</p>
                <p className="text-sm text-gray-500 font-light leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-14 px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-3">Need Help?</p>
          <h2 className="text-sm font-medium text-black uppercase tracking-widest mb-8">Contact Us About Your Order</h2>
          <div className="grid md:grid-cols-3 gap-0 border border-gray-100">
            {[
              { icon: Phone, label: 'Phone', lines: ['+91 9063284008', '+91 9121157804'], note: 'Mon–Sat: 9 AM – 6 PM IST' },
              { icon: Mail, label: 'Email', lines: ['support@aharyas.com'], note: 'Response within 24 hours · Include order number in subject' },
              { icon: AlertCircle, label: 'Deadline', lines: ['7 Days from delivery'], note: 'All concerns must be raised before this deadline' },
            ].map(({ icon: Icon, label, lines, note }, i) => (
              <div key={label} className={`p-8 border-gray-100 ${i < 2 ? 'border-b md:border-b-0 md:border-r' : ''}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon size={13} className="text-gray-400" />
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-medium">{label}</p>
                </div>
                {lines.map(l => <p key={l} className="text-sm font-medium text-black mb-0.5">{l}</p>)}
                {note && <p className="text-xs text-gray-400 font-light mt-2">{note}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CancellationRefundPolicy;