import { useEffect } from "react";
import ReactDOM from "react-dom";
import { X, MapPin, Scissors, Users, Camera } from "lucide-react";

const HandloomModal = ({ title, description, color, craftImages = {}, defaultCraftImg, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const crafts = description.split(', ').filter(c => c.trim() !== '');

  const getImg = (craftName) => craftImages[craftName.trim()] || defaultCraftImg;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative p-8 rounded-t-2xl border-b border-gray-100"
          style={{ background: `linear-gradient(135deg, ${color}15 0%, white 100%)` }}
        >
          <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 opacity-20" style={{ borderColor: color }}></div>
          <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 opacity-20" style={{ borderColor: color }}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full shadow-md flex items-center justify-center" style={{ backgroundColor: color }}>
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-black uppercase tracking-wider">{title}</h2>
                  <p className="text-sm text-gray-600 mt-1">Traditional Textile Heritage</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center border border-gray-200 group"
              >
                <X className="w-5 h-5 text-gray-600 group-hover:text-black transition-colors" />
              </button>
            </div>
            <div className="w-24 h-1" style={{ backgroundColor: color }}></div>
          </div>
        </div>

        <div className="p-8">
          {/* Stats */}
          <div className="flex items-center justify-between mb-8 p-6 bg-gray-50 rounded-lg">
            {[
              { icon: Scissors, value: crafts.length, label: `Traditional Craft${crafts.length > 1 ? 's' : ''}` },
              { icon: Users, value: '50+', label: 'Artisans' },
              { icon: Camera, value: crafts.length, label: `Textile${crafts.length > 1 ? 's' : ''}` },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-black">{value}</div>
                  <div className="text-gray-600 text-sm uppercase tracking-wider">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Craft heading */}
          <h3 className="text-xl font-semibold text-black mb-6 uppercase tracking-wider flex items-center gap-2">
            <div className="w-1 h-6" style={{ backgroundColor: color }}></div>
            Heritage Crafts of {title}
          </h3>

          {crafts.length > 0 ? (
            <div className="grid gap-6">
              {crafts.map((craft, i) => (
                <div
                  key={i}
                  className="bg-white border rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  style={{ borderColor: `${color}40` }}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-2/5 relative overflow-hidden bg-gray-100">
                      <img
                        src={getImg(craft)}
                        alt={craft.trim()}
                        className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = defaultCraftImg;
                        }}
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                        style={{ backgroundColor: color }}
                      ></div>
                    </div>

                    {/* Content */}
                    <div className="md:w-3/5 p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xl font-bold text-black">{craft.trim()}</h4>
                        <span
                          className="text-xs px-3 py-1 rounded-full font-medium"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          Traditional Craft
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        A time-honored craft tradition passed down through generations,
                        representing the rich cultural heritage of {title}. Each piece tells
                        a story of skilled artisans who have preserved these ancient techniques.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['Handwoven', 'Traditional Design', 'Heritage Craft'].map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Scissors className="w-16 h-16 mx-auto mb-4" style={{ color: `${color}40` }} />
              <p className="text-gray-600 text-lg">Craft information for {title} will be available soon.</p>
            </div>
          )}

          {crafts.length > 0 && (
            <div
              className="mt-8 rounded-lg p-6 border-l-4"
              style={{ background: `linear-gradient(135deg, ${color}10 0%, transparent 100%)`, borderColor: color }}
            >
              <p className="text-gray-700 italic text-center">
                "Every thread tells a story, every weave carries wisdom,<br />
                and every craft connects us to our roots."
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HandloomModal;