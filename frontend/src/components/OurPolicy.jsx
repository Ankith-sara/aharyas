import { Heart, Leaf, Globe } from 'lucide-react';

const principles = [
  {
    icon: Heart,
    title: 'Handmade with heart',
    description: 'Every piece is crafted by skilled artisans, not machines. You feel the difference.',
  },
  {
    icon: Leaf,
    title: 'Eco-conscious by choice',
    description: 'Natural fibres, low-waste processes, and sustainable sourcing in every collection.',
  },
  {
    icon: Globe,
    title: 'Culturally rich by soul',
    description: 'We carry centuries of craft tradition from India\'s most skilled regional artisans.',
  },
];

const OurPolicy = () => (
  <section className="py-20 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto">

      {/* Why Aharyas */}
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-3">Our promise</p>
        <h2 className="text-3xl sm:text-4xl font-light text-black mb-4 tracking-wide">Why Aharyas?</h2>
        <p className="text-gray-500 font-light max-w-lg mx-auto text-sm leading-relaxed">
          We don't do fast fashion — we do <em>forever fashion</em>. Luxury lives in the hands that weave it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {principles.map(({ icon: Icon, title, description }) => (
          <div key={title} className="group border border-gray-200 bg-white p-8 text-center hover:border-black hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />
            <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-black flex items-center justify-center mx-auto mb-5 transition-colors duration-300">
              <Icon size={28} className="text-gray-500 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-black mb-3">{title}</h3>
            <p className="text-gray-500 text-sm font-light leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default OurPolicy;