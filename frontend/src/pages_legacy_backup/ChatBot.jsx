import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, X, BotMessageSquare, ShoppingBag, Heart, Truck, HelpCircle,
  Package, MapPin, ChevronRight, Sparkles, ArrowRight, CheckCircle,
  Clock, Tag, Phone, Mail, MessageSquare, RotateCcw, Image
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { api } from '../context/api';
import usePageMeta from "../components/usePageMeta";

const WEBSITE_KNOWLEDGE = {
  brand: {
    name: "Aharyas",
    tagline: "India's first conscious luxury fashion brand where heritage meets high design",
    story: "Aharyas was born from profound respect for artisans and an ambitious vision to bring their work the visibility it deserves. We bridge India's storied craft heritage with the world of mindful fashion.",
    mission: "To preserve dying crafts, uplift artisan voices, and create fashion that feels timeless, ethical, and soulfully elegant.",
    vision: "To craft India's first luxury clothing brand where heritage meets high design, rooted deeply in culture, craft, and community.",
    stats: { artisans: "300+", crafts: "50+", states: "15+" },
    categories: [
      "Authentic handmade craft from artisans",
      "Sustainable & affordable fashion for daily wear",
      "Luxury segment for high-end Indian fashion"
    ],
    journey: "From the looms of Pochampally to the painted fabrics of Pedana, the earthy blocks of Rajasthan, and delicate embroidery of Delhi — every thread carries patience, pride, and generations of history."
  },

  artisans: {
    mallesh: {
      name: "Mallesh Anna",
      location: "Pochampally",
      craft: "Pochampally Ikkat weaving",
      experience: "40+ years",
      story: "From the weaving town of Pochampally, Mallesh Anna has spent over 40 years breathing life into threads. He began as a young boy, watching his parents tie and dye yarn late into the night. Today, at 56, he still rises before dawn, preparing yarns with care and weaving with quiet pride. His motifs carry meaning — some for love, others for rain, joy, or sorrow — like a visual language. 'Every motif means something. It's like a language,' he says. Now a treasured part of the Aharyas family, his work is legacy. When you wear his weave, you carry his story.",
      quote: "We kept going… because the loom is not just work. It's who we are."
    }
  },

  crafts: {
    "Pochampally Ikkat": {
      description: "Where threads are dyed before they're woven, creating a beautifully blurred, rhythmic art. Pochampally Ikkat from Telangana is a UNESCO-recognised craft where resist-dyeing creates geometric patterns that blur into each other like watercolour.",
      state: "Telangana/Andhra Pradesh",
      technique: "Resist-dyeing of threads before weaving"
    },
    "Kalamkari": {
      description: "Hand-painted and block-printed stories — each fabric a canvas of myth, memory, and meaning. From Pedana and Machilipatnam in Andhra Pradesh, artisans use natural dyes and tamarind pen or carved wooden blocks.",
      state: "Andhra Pradesh",
      technique: "Hand-painting and block-printing with natural dyes"
    },
    "Hand Block Printing": {
      description: "Carved wooden blocks dipped in earthy dyes, echoing the warmth and detail of desert craftsmanship. A centuries-old tradition from Rajasthan — Bagru, Sanganer, and Bagh are the heartlands.",
      state: "Rajasthan",
      technique: "Hand-carved wooden block printing with natural dyes"
    },
    "Traditional Embroideries": {
      description: "From mirror-studded stitches of Gujarat (Kutch embroidery) to the flowing Kantha of Bengal and the vibrant Phulkari of Punjab — each region speaks in its own stitch.",
      states: "Gujarat, West Bengal, Punjab",
      technique: "Hand embroidery using region-specific stitch patterns"
    },
    "Banarasi Brocade": {
      description: "Woven in the silk looms of Varanasi, Banarasi sarees and brocades feature intricate gold/silver zari work with Mughal-inspired motifs. One of India's most prestigious textiles.",
      state: "Uttar Pradesh",
      technique: "Silk weaving with gold/silver zari thread"
    },
    "Chikankari": {
      description: "Lucknow's delicate white-on-white embroidery — 32 distinct stitches, light as a whisper on muslin or chiffon. A Mughal legacy from the royal courts.",
      state: "Uttar Pradesh",
      technique: "Hand embroidery — 32 stitch types on fine fabric"
    },
    "Kanchipuram Silk": {
      description: "The gold standard of Indian sarees. Woven in the temple city of Kanchipuram, these heavy silk sarees feature contrasting borders and rich zari work. Heirloom pieces passed through generations.",
      state: "Tamil Nadu",
      technique: "Silk weaving with pure zari in contrasting body and border"
    },
    "Pashmina": {
      description: "The finest cashmere in the world — from the underbelly of Changthangi goats in Ladakh. Each shawl takes months of hand-spinning and weaving by master craftspeople in Kashmir.",
      state: "Jammu & Kashmir / Ladakh",
      technique: "Hand-spinning and hand-weaving of Changthangi goat wool"
    }
  },

  policies: {
    returns: {
      summary: "No cash refunds — replacements & exchanges only",
      cancellation: "Cancel within 6 hours of order placement by emailing support@aharyas.com",
      noRefunds: "Refunds are not offered under any circumstances. We provide replacements or exchanges for eligible cases only.",
      returns: "Returns accepted within 15 days for unused items in original packaging. Personalized pieces may not qualify.",
      exchanges: "Exchanges available for size, color, or variant swaps (subject to availability).",
      handcraftedNote: "Minor irregularities in color, print, or weave reflect the handcrafted nature of our products — not defects.",
      contact: "Email aharyasofficial@gmail.com with your order details and reason to initiate a return.",
      timeline: "Replacement or exchange processed within 5–7 business days after we receive and verify the return."
    },
    shipping: {
      free: "Free shipping on orders above ₹999",
      charge: "Minimal delivery charges for orders below ₹999 (based on location)",
      domestic: "0–7 business days for domestic orders via registered courier companies and speed post",
      international: "Worldwide shipping available through trusted courier partners with tracking and insurance",
      tracking: "Tracking link sent via email once your order ships",
      confirmation: "Order confirmation within 24 hours of payment"
    },
    payment: {
      methods: ["Cash on Delivery (COD) — available across India", "Cards (credit/debit)", "UPI", "Net banking", "Major wallets"],
      security: "All transactions secured with modern encryption",
      platform: "Powered by Razorpay for digital payments"
    }
  },

  contact: {
    email: "aharyasofficial@gmail.com",
    supportEmail: "aharyasofficial@aharyas.com",
    phone: "+91 9063284008",
    hours: "Monday–Saturday, 9 AM – 6 PM",
    responseTime: "Response within 24 hours"
  },

  faqs: [
    { q: "How do I place an order?", a: "Browse our collection, add items to cart, and checkout securely. You can create an account or use guest checkout." },
    { q: "Can I modify or cancel my order?", a: "Yes, within 6 hours of placing it. After that, contact support@aharyas.com — we'll try our best before it's processed." },
    { q: "Do you ship internationally?", a: "Yes, worldwide shipping is available through trusted courier partners with tracking and insurance." },
    { q: "Are your products authentic handcrafted items?", a: "100%. Each piece is made by skilled artisans with authentic materials and traditional craftsmanship, quality-checked before shipping." },
    { q: "Do you offer custom or personalized items?", a: "Yes! Custom handcrafted pieces are available. Email aharyasofficial@gmail.com for details." },
    { q: "Do you offer bulk or wholesale pricing?", a: "Yes, for custom or bulk orders. Email aharyasofficial@gmail.com for a tailored quote." },
    { q: "How do I care for handloom items?", a: "Handloom cotton: cold water, gentle cycle, shade dry. Silk: dry clean recommended. Ikkat & Kalamkari: wash separately first. Never tumble dry. Iron on reverse at medium heat." },
    { q: "What sizes do you offer?", a: "We offer XS, S, M, L, XL, XXL across most styles. Detailed size charts on every product page. For handloom sarees: one size fits all. When in doubt, size up." },
    { q: "Is my personal information secure?", a: "Yes. All data is encrypted and protected — we never share it without your consent." },
    { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page, enter your email, and follow the reset link we send you." }
  ],

  pages: {
    "/": "Home page — hero collections, latest products, brand story",
    "/shop/collection": "Full product collection with filters",
    "/about": "Brand story, mission, vision, artisan stories, craft heritage map",
    "/contact": "Contact form, email, phone details",
    "/faqs": "Frequently asked questions across all topics",
    "/orders": "Your order history and status",
    "/cart": "Shopping cart",
    "/wishlist": "Saved / wishlisted items",
    "/blog": "Heritage stories and artisan features",
    "/refundpolicy": "Return, exchange & refund policy",
    "/shippingpolicy": "Shipping & delivery policy",
    "/privacypolicy": "Privacy policy",
    "/support": "Customer support form",
    "/trackorder": "Track a specific order"
  }
};

const buildSystemPrompt = (contextData = {}) => {
  const { products = [], orders = [], cartCount = 0, wishlistCount = 0 } = contextData;

  const productSummary = products.slice(0, 30).map(p =>
    `- "${p.name}" | ₹${p.price} | ${p.category} > ${p.subCategory}${p.bestseller ? " [BESTSELLER]" : ""}`
  ).join("\n");

  const orderSummary = orders.slice(0, 10).map(o =>
    `- Order #${o._id.slice(-6).toUpperCase()} | ₹${o.amount} | Status: ${o.status} | ${new Date(o.date).toLocaleDateString("en-IN")}`
  ).join("\n");

  return `You are the Aharyas AI Shopping Assistant — warm, knowledgeable, and proud of India's craft heritage.

## BRAND KNOWLEDGE
${JSON.stringify(WEBSITE_KNOWLEDGE.brand, null, 2)}

## ARTISAN STORIES
Mallesh Anna: ${WEBSITE_KNOWLEDGE.artisans.mallesh.story}

## CRAFTS WE CARRY
${Object.entries(WEBSITE_KNOWLEDGE.crafts).map(([k, v]) => `${k}: ${v.description}`).join("\n")}

## POLICIES
Returns: ${JSON.stringify(WEBSITE_KNOWLEDGE.policies.returns)}
Shipping: ${JSON.stringify(WEBSITE_KNOWLEDGE.policies.shipping)}
Payment: ${JSON.stringify(WEBSITE_KNOWLEDGE.policies.payment)}

## CONTACT
Email: ${WEBSITE_KNOWLEDGE.contact.email} | Phone: ${WEBSITE_KNOWLEDGE.contact.phone} | Hours: ${WEBSITE_KNOWLEDGE.contact.hours}

## LIVE PRODUCT CATALOG (${products.length} products)
${productSummary || "Products loading..."}

## USER'S LIVE DATA
Orders: ${orderSummary || "None yet"}
Cart: ${cartCount} items | Wishlist: ${wishlistCount} items

## WEBSITE PAGES
${Object.entries(WEBSITE_KNOWLEDGE.pages).map(([path, desc]) => `${path} → ${desc}`).join("\n")}

## SCOPE — STRICTLY ENFORCED
You are ONLY allowed to help with topics related to Aharyas and its business:
- Products, collections, pricing, availability, recommendations
- Orders, cart, wishlist, tracking, delivery status
- Policies (returns, shipping, payment, privacy)
- Indian crafts, textiles, artisan stories, heritage
- Account help, sizing, fabric care
- Contact info, support, FAQs
- Navigating the Aharyas website

## OFF-TOPIC RULES — NEVER BREAK THESE
- NEVER answer questions about coding, programming, math, science, general knowledge, politics, news, entertainment, sports, recipes, or ANY topic unrelated to Aharyas.
- If a user asks an off-topic question, respond ONLY with: "I'm your Aharyas shopping assistant — I can help with our handcrafted collections, orders, policies, and Indian craft heritage! Is there something about Aharyas I can help you with?" and suggest relevant Aharyas topics.
- Do NOT attempt to be helpful on off-topic requests. Do NOT say "I can't help but here's a quick answer." Just redirect.
- This rule applies even if the user insists, rephrases, or tries to trick you.

## RESPONSE RULES
- Be warm, concise (under 150 words), and genuinely helpful — but ONLY within scope
- Always reference actual product names and prices from the catalog
- Reference real order IDs when discussing orders
- Suggest relevant pages like /shop/collection, /about, /faqs etc.
- Celebrate Indian craft heritage with genuine enthusiasm
- Never make up policies — use only what's in this prompt
- If unsure about an Aharyas topic, say "I'm not certain — please email aharyasofficial@gmail.com or call +91 9063284008"`;
};

const detectIntent = (text) => {
  const t = text.toLowerCase();
  if (/\b(my order|order status|track|where is my|order id|order number)\b/.test(t)) return "track_order";
  if (/\b(my orders|past orders|order history|previous orders|all orders)\b/.test(t)) return "order_history";
  if (/\b(my cart|cart|what.s in|show cart|view cart)\b/.test(t)) return "view_cart";
  if (/\b(my wishlist|saved items|wishlist|favorites|favourites)\b/.test(t)) return "view_wishlist";
  if (/\b(return|refund|exchange|cancel|replacement)\b/.test(t)) return "policy_return";
  if (/\b(shipping|delivery|ship|deliver|dispatch)\b/.test(t)) return "policy_shipping";
  if (/\b(payment|pay|cod|razorpay|upi|net banking)\b/.test(t)) return "policy_payment";
  if (/\b(size|sizing|fit|measurement|chart)\b/.test(t)) return "size_guide";
  if (/\b(care|wash|maintain|iron|fabric|clean)\b/.test(t)) return "care_guide";
  if (/\b(contact|support|help|complaint|feedback|email|phone|call)\b/.test(t)) return "support";
  if (/\b(about|aharyas|brand|who are|story|mission|artisan|mallesh|heritage)\b/.test(t)) return "about";
  if (/\b(faq|question|how to|how do|can i|do you)\b/.test(t)) return "faq";
  if (/\b(search|find|looking for|show me|i want|do you have|any .* saree|any .* kurta)\b/.test(t)) return "search_products";
  if (/\b(ikat|ikkat|kalamkari|pochampally|banarasi|pashmina|chikankari|kanchipuram|block print|handloom)\b/.test(t)) return "craft_info";
  return "ai_general";
};

const statusConfig = {
  "Order placed": { color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle, bar: 25 },
  "Packing": { color: "text-amber-600", bg: "bg-amber-50", icon: Package, bar: 50 },
  "Shipping": { color: "text-purple-600", bg: "bg-purple-50", icon: Truck, bar: 75 },
  "Out for delivery": { color: "text-orange-600", bg: "bg-orange-50", icon: MapPin, bar: 88 },
  "Delivered": { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle, bar: 100 },
};

const ProductCard = ({ product, onAddToCart, currency = "₹" }) => {
  const { getProductUrl } = useProducts();
  const [added, setAdded] = useState(false);
  const handleAdd = (e) => {
    e.preventDefault();
    if (product.sizes?.length > 1) return;
    onAddToCart(product._id, product.sizes?.[0] || "N/A");
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };
  return (
    <Link to={getProductUrl(product)} className="block group">
      <div className="border border-gray-200 bg-white hover:border-black transition-all duration-200 overflow-hidden">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          {product.bestseller && (
            <div className="absolute top-1.5 left-1.5 bg-black text-white text-[10px] px-1.5 py-0.5 tracking-wider">BESTSELLER</div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-xs font-medium text-black leading-tight truncate">{product.name}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{product.subCategory}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-sm font-semibold text-black">{currency}{product.price.toLocaleString("en-IN")}</span>
            <button
              onClick={handleAdd}
              className={`text-[10px] px-2 py-1 border transition-all ${added ? "bg-black text-white border-black" : "border-gray-300 text-gray-600 hover:border-black hover:text-black"}`}
            >
              {added ? "Added" : product.sizes?.length > 1 ? "VIEW" : "+ CART"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

const OrderCard = ({ order }) => {
  const cfg = statusConfig[order.status] || statusConfig["Order placed"];
  const Icon = cfg.icon;
  return (
    <Link to={`/trackorder/${order._id}`} className="block group">
      <div className="border border-gray-200 hover:border-black transition-colors p-3 bg-white">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-semibold text-black">#{order._id.slice(-8).toUpperCase()}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
          <div className={`flex items-center gap-1 ${cfg.bg} ${cfg.color} px-2 py-0.5 text-[10px] font-medium`}>
            <Icon size={10} /><span>{order.status}</span>
          </div>
        </div>
        <div className="mb-2">
          <div className="h-1 bg-gray-100 overflow-hidden">
            <div className={`h-full bg-black transition-all duration-500`} style={{ width: `${cfg.bar}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-gray-600">{order.items?.length} item{order.items?.length !== 1 ? "s" : ""}</p>
          <p className="text-xs font-semibold text-black">₹{order.amount.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </Link>
  );
};

const SuggestedReplies = ({ replies, onSelect, disabled }) => {
  if (!replies?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {replies.map((r, i) => (
        <button
          key={i}
          onClick={() => onSelect(r)}
          disabled={disabled}
          className="text-[11px] border border-gray-300 hover:border-black hover:bg-black hover:text-white text-gray-700 px-2.5 py-1.5 transition-all disabled:opacity-40 whitespace-nowrap"
        >
          {r}
        </button>
      ))}
    </div>
  );
};

const InfoCard = ({ type, data }) => {
  if (type === "policy") {
    return (
      <div className="mt-2 border border-gray-200 bg-white overflow-hidden">
        <div className="bg-black px-4 py-2">
          <p className="text-white text-xs font-medium uppercase tracking-wider">{data.title}</p>
        </div>
        <div className="p-4 space-y-2">
          {data.points.map((pt, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="text-black font-bold flex-shrink-0">·</span>
              <span className="text-gray-700 font-light leading-snug">{pt}</span>
            </div>
          ))}
        </div>
        {data.note && (
          <div className="px-4 pb-3">
            <p className="text-[11px] text-gray-500 italic">{data.note}</p>
          </div>
        )}
      </div>
    );
  }
  if (type === "craft") {
    return (
      <div className="mt-2 border-l-4 border-black bg-gray-50 p-4">
        <p className="text-sm font-semibold text-black mb-1">{data.name}</p>
        <p className="text-xs text-gray-600 font-light leading-relaxed">{data.description}</p>
        {data.state && <p className="text-[11px] text-gray-500 mt-2">📍 {data.state}</p>}
        {data.technique && <p className="text-[11px] text-gray-500">🧵 {data.technique}</p>}
      </div>
    );
  }
  if (type === "contact") {
    return (
      <div className="mt-2 border border-gray-200 bg-white p-4 space-y-2">
        {data.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <item.icon size={12} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500">{item.label}</p>
              <p className="text-xs font-medium text-black">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MessageBubble = ({ entry, currency, onSuggestedReply, isLoading }) => {
  const isUser = entry.sender === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"} animate-slideIn`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
          <BotMessageSquare size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[88%] ${isUser ? "" : "flex-1"}`}>
        {(entry.text || entry.image) && !entry.typing && (
          <div className={`px-4 py-3 text-sm leading-relaxed ${isUser
            ? "bg-black text-white"
            : "bg-gray-50 border border-gray-200 text-gray-800"
            }`}>
            {entry.image && <img src={entry.image.preview} alt="upload" className="mb-2 max-h-40 object-cover w-full" />}
            {entry.text && <p className="whitespace-pre-wrap font-light">{entry.text}</p>}
          </div>
        )}

        {/* Typing */}
        {entry.typing && (
          <div className="bg-gray-50 border border-gray-200 px-4 py-3 flex items-center gap-1.5">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-1">Thinking...</span>
          </div>
        )}

        {entry.infoCard && <InfoCard {...entry.infoCard} />}

        {/* Products */}
        {entry.products?.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
              {entry.products.length} result{entry.products.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {entry.products.slice(0, 6).map(p => (
                <ProductCard key={p._id} product={p} onAddToCart={() => { }} currency={currency} />
              ))}
            </div>
            {entry.products.length > 6 && (
              <Link to="/shop/collection" className="flex items-center gap-1 text-xs text-black border border-gray-300 hover:border-black px-3 py-2 mt-2 transition-colors w-fit">
                View all {entry.products.length} results <ChevronRight size={12} />
              </Link>
            )}
          </div>
        )}

        {/* Orders */}
        {entry.orders?.length > 0 && (
          <div className="mt-2 space-y-2">
            {entry.orders.map(o => <OrderCard key={o._id} order={o} />)}
            <Link to="/orders" className="flex items-center gap-1 text-xs text-black border border-gray-300 hover:border-black px-3 py-1.5 transition-colors w-fit">
              View all orders <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* Cart */}
        {entry.cartData && (
          <div className="mt-2 border border-gray-200 bg-white p-3">
            <div className="space-y-2 mb-3">
              {entry.cartData.items.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <img src={item.images?.[0]} alt={item.name} className="w-10 h-10 object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-black truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-500">Size: {item.size} · Qty: {item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold text-black flex-shrink-0">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">{entry.cartData.count} item{entry.cartData.count !== 1 ? "s" : ""}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-black">₹{entry.cartData.total.toLocaleString("en-IN")}</span>
                <Link to="/cart" className="text-[11px] bg-black text-white px-3 py-1.5 hover:bg-gray-800 transition-colors">Checkout →</Link>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist */}
        {entry.wishlistData?.length > 0 && (
          <div className="mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {entry.wishlistData.slice(0, 6).map(p => (
                <ProductCard key={p._id} product={p} onAddToCart={() => { }} currency={currency} />
              ))}
            </div>
            <Link to="/wishlist" className="flex items-center gap-1 text-xs text-black border border-gray-300 hover:border-black px-3 py-2 mt-2 transition-colors w-fit">
              View full wishlist <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* Nav links */}
        {entry.links?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.links.map((link, i) => (
              <Link key={i} to={link.path} className="flex items-center gap-1 text-[11px] border border-gray-300 hover:border-black hover:bg-black hover:text-white px-2.5 py-1.5 text-black transition-all">
                {link.label} <ArrowRight size={9} />
              </Link>
            ))}
          </div>
        )}

        {/* Suggested replies */}
        {!isUser && !entry.typing && entry.suggestions?.length > 0 && (
          <SuggestedReplies replies={entry.suggestions} onSelect={onSuggestedReply} disabled={isLoading} />
        )}
      </div>
    </div>
  );
};

const quickActions = [
  { icon: Package, label: "My Orders", q: "Show my recent orders" },
  { icon: ShoppingBag, label: "My Cart", q: "What's in my cart?" },
  { icon: Heart, label: "Wishlist", q: "Show my wishlist" },
  { icon: Truck, label: "Track Order", q: "Track my latest order" },
  { icon: RotateCcw, label: "Returns", q: "What is the return policy?" },
  { icon: Tag, label: "New Arrivals", q: "Show me latest collections" },
  { icon: Sparkles, label: "Crafts", q: "Tell me about Pochampally Ikkat" },
  { icon: HelpCircle, label: "FAQs", q: "What are your most common FAQs?" },
  { icon: Phone, label: "Contact", q: "How can I contact Aharyas?" },
];

const getInstantResponse = (intent) => {
  switch (intent) {
    case "policy_return":
      return {
        text: "Here's our Return & Exchange policy:",
        infoCard: {
          type: "policy",
          data: {
            title: "Return & Exchange Policy",
            points: [
              "No cash refunds — we offer replacements or exchanges only",
              "Cancel within 6 hours of order placement",
              "Returns accepted within 15 days (unused, original packaging)",
              "Handcrafted variations in colour/weave are not defects",
              "Exchange for size, colour, or variant (subject to availability)",
              "Replacement processed within 5–7 business days after verification"
            ],
            note: "To initiate: email aharyasofficial@gmail.com with your order details"
          }
        },
        links: [{ label: "Return Policy", path: "/refundpolicy" }, { label: "Contact Support", path: "/contact" }],
        suggestions: ["How do I initiate a return?", "What about international orders?", "Can I cancel my order?"]
      };

    case "policy_shipping":
      return {
        text: "Our shipping details:",
        infoCard: {
          type: "policy",
          data: {
            title: "Shipping & Delivery",
            points: [
              "Free shipping on orders above ₹999",
              "Minimal charges for orders below ₹999 (location-based)",
              "Domestic delivery: 0–7 business days",
              "International shipping available worldwide",
              "Order confirmation within 24 hours of payment",
              "Tracking link sent via email once shipped"
            ],
            note: "International orders include tracking and insurance."
          }
        },
        links: [{ label: "Shipping Policy", path: "/shippingpolicy" }, { label: "Track Order", path: "/orders" }],
        suggestions: ["Do you ship internationally?", "How do I track my order?", "What's the delivery timeline?"]
      };

    case "policy_payment":
      return {
        text: "We accept multiple payment methods:",
        infoCard: {
          type: "policy",
          data: {
            title: "Payment Options",
            points: [
              "Cash on Delivery (COD) — available pan-India",
              "Credit & Debit Cards",
              "UPI (Google Pay, PhonePe, Paytm etc.)",
              "Net Banking",
              "Major Wallets",
              "All digital payments via Razorpay — fully encrypted & secure"
            ]
          }
        },
        links: [{ label: "Place Order", path: "/place-order" }],
        suggestions: ["Is COD available?", "Is my payment secure?", "Do you offer EMI?"]
      };

    case "size_guide":
      return {
        text: "Sizing at Aharyas:",
        infoCard: {
          type: "policy",
          data: {
            title: "Size Guide",
            points: [
              "Available: XS, S, M, L, XL, XXL across most styles",
              "Detailed size charts on every product page",
              "Handloom sarees: one size fits all",
              "Kurtas & dresses: measure bust, waist & hip",
              "When in doubt, size up for handloom garments",
              "Exchanges available for incorrect sizing"
            ],
            note: "Need help? Email aharyasofficial@gmail.com for personalised advice."
          }
        },
        links: [{ label: "Shop Collection", path: "/shop/collection" }],
        suggestions: ["How do I measure myself?", "Can I exchange for a different size?", "Show me sarees"]
      };

    case "care_guide":
      return {
        text: "Caring for your handcrafted pieces:",
        infoCard: {
          type: "policy",
          data: {
            title: "Fabric Care Guide",
            points: [
              "Handloom cotton: Cold water, gentle cycle, shade dry",
              "Silk: Dry clean recommended; mild hand wash if needed",
              "Ikkat & Kalamkari: Wash separately first — colours may bleed",
              "Never tumble dry handcrafted textiles",
              "Iron on reverse side at medium heat",
              "Store folded in muslin cloth, away from direct sunlight"
            ],
            note: "Natural dyes used in block prints may slightly fade over time — this adds to the piece's character."
          }
        },
        links: [{ label: "FAQs", path: "/faqs" }],
        suggestions: ["How do I wash silk?", "Will Kalamkari colours run?", "Tell me about Ikkat"]
      };

    case "support":
      return {
        text: "Here's how to reach us:",
        infoCard: {
          type: "contact",
          data: {
            items: [
              { icon: Mail, label: "Email", value: "aharyasofficial@gmail.com" },
              { icon: Phone, label: "Phone", value: "+91 9063284008" },
              { icon: Clock, label: "Hours", value: "Mon–Sat, 9 AM – 6 PM" },
              { icon: MessageSquare, label: "Response", value: "Within 24 hours" }
            ]
          }
        },
        links: [{ label: "Support Page", path: "/support" }, { label: "FAQs", path: "/faqs" }, { label: "Contact", path: "/contact" }],
        suggestions: ["I have a complaint", "Track my order", "Return request"]
      };

    case "about":
      return {
        text: `Aharyas is ${WEBSITE_KNOWLEDGE.brand.tagline}.\n\n${WEBSITE_KNOWLEDGE.brand.story}\n\nWe've onboarded 300+ artisans across India, many from self-help groups, preserving crafts like Pochampally Ikkat, Pedana Kalamkari, and hand block printing.`,
        links: [{ label: "Our Story", path: "/about" }, { label: "Heritage Map", path: "/about" }, { label: "Blog", path: "/blog" }],
        suggestions: ["Tell me about Mallesh Anna", "What crafts do you carry?", "What is Pochampally Ikkat?"]
      };

    default:
      return null;
  }
};

const ChatBot = () => {
  usePageMeta({
    title: 'AI Shopping Assistant',
    description: 'Chat with our AI Shopping Assistant to find handcrafted products, get styling recommendations, or learn more about Indian artisan heritage.'
  });

  const { products, currency, backendUrl, searchProducts } = useProducts();
  const { cartItems, getCartItems, getCartAmount, getCartCount, getWishlistProducts } = useCart();
  const { token, navigate } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const fileRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    if (!token || ordersLoaded) return;
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      const storedToken = localStorage.getItem("token");
      const res = await api.post(
        `/api/v1/order/userorders`,
        { userId },
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );
      if (res.data.success) {
        setOrders(res.data.orders.sort((a, b) => b.date - a.date));
        setOrdersLoaded(true);
      }
    } catch (err) {
      console.warn("Failed to fetch orders", err);
    }
  }, [token, backendUrl, ordersLoaded]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const greet = token
      ? "Namaste! I'm your Aharyas AI Assistant. I have access to your orders, cart, wishlist, and full knowledge of our heritage collections. How can I help you today?"
      : "Namaste! I'm your Aharyas AI Assistant. Ask me about our handcrafted collections, artisan stories, policies, or anything about Indian textile heritage. How can I help?";

    setMessages([{
      id: Date.now(), sender: "bot", text: greet,
      links: token
        ? [{ label: "My Orders", path: "/orders" }, { label: "My Cart", path: "/cart" }, { label: "Shop", path: "/shop/collection" }]
        : [{ label: "Shop Now", path: "/shop/collection" }, { label: "About Us", path: "/about" }, { label: "FAQs", path: "/faqs" }],
      suggestions: token
        ? ["Show my recent orders", "What's in my cart?", "Show new arrivals"]
        : ["What crafts do you carry?", "Tell me about Aharyas", "What is your return policy?"]
    }]);
  }, [token]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed && !image) return;

    setMessages(prev => [...prev,
    { id: Date.now(), sender: "user", text: trimmed, image },
    { id: Date.now() + 1, sender: "bot", typing: true }
    ]);
    setInput("");
    setImage(null);
    setIsLoading(true);

    const intent = detectIntent(trimmed);

    if (intent === "order_history") {
      if (!token) {
        setMessages(prev => prev.slice(0, -1).concat([{
          id: Date.now(), sender: "bot",
          text: "Please sign in to view your orders.",
          links: [{ label: "Sign In", path: "/login" }],
          suggestions: ["How do I create an account?", "Shop without account"]
        }]));
        setIsLoading(false); return;
      }
      await fetchOrders();
      setMessages(prev => prev.slice(0, -1).concat([{
        id: Date.now(), sender: "bot",
        text: orders.length ? `You have ${orders.length} order${orders.length !== 1 ? "s" : ""}:` : "No orders yet. Explore our heritage collections!",
        orders: orders.slice(0, 5),
        links: orders.length ? [] : [{ label: "Shop Now", path: "/shop/collection" }],
        suggestions: orders.length ? ["Track my latest order", "What's the return policy?", "Show my cart"] : ["Browse collections", "Tell me about our crafts"]
      }]));
      setIsLoading(false); return;
    }

    if (intent === "view_cart") {
      const cartList = getCartItems();
      const count = getCartCount();
      const total = getCartAmount();
      setMessages(prev => prev.slice(0, -1).concat([count > 0
        ? { id: Date.now(), sender: "bot", text: `Your cart has ${count} item${count !== 1 ? "s" : ""}:`, cartData: { items: cartList, count, total }, suggestions: ["Continue shopping", "What's the return policy?", "Track my order"] }
        : { id: Date.now(), sender: "bot", text: "Your cart is empty. Discover our handcrafted collections!", links: [{ label: "Shop Collection", path: "/shop/collection" }], suggestions: ["Show sarees", "Show new arrivals", "Tell me about our crafts"] }
      ]));
      setIsLoading(false); return;
    }

    if (intent === "view_wishlist") {
      if (!token) {
        setMessages(prev => prev.slice(0, -1).concat([{ id: Date.now(), sender: "bot", text: "Sign in to view your saved wishlist items.", links: [{ label: "Sign In", path: "/login" }] }]));
        setIsLoading(false); return;
      }
      const wishlistProducts = getWishlistProducts();
      setMessages(prev => prev.slice(0, -1).concat([wishlistProducts.length > 0
        ? { id: Date.now(), sender: "bot", text: `You have ${wishlistProducts.length} saved item${wishlistProducts.length !== 1 ? "s" : ""}:`, wishlistData: wishlistProducts, suggestions: ["Add all to cart", "Show my cart", "New arrivals"] }
        : { id: Date.now(), sender: "bot", text: "Your wishlist is empty. Heart items you love to save them!", links: [{ label: "Browse Collection", path: "/shop/collection" }] }
      ]));
      setIsLoading(false); return;
    }

    if (intent === "track_order") {
      if (!token) {
        setMessages(prev => prev.slice(0, -1).concat([{ id: Date.now(), sender: "bot", text: "Please sign in to track your orders.", links: [{ label: "Sign In", path: "/login" }] }]));
        setIsLoading(false); return;
      }
      await fetchOrders();
      const idMatch = trimmed.match(/[a-f0-9]{8,24}/i);
      const found = idMatch ? orders.find(o => o._id.includes(idMatch[0]) || o._id.endsWith(idMatch[0])) : orders[0];
      setMessages(prev => prev.slice(0, -1).concat([found
        ? { id: Date.now(), sender: "bot", text: idMatch ? "Found your order:" : "Your most recent order:", orders: [found], suggestions: ["What's the return policy?", "I have an issue with this order", "Show all my orders"] }
        : { id: Date.now(), sender: "bot", text: "No orders found yet.", links: [{ label: "Shop Now", path: "/shop/collection" }] }
      ]));
      setIsLoading(false); return;
    }

    if (intent === "search_products" && !image) {
      const results = searchProducts(trimmed);
      if (results.length > 0) {
        setMessages(prev => prev.slice(0, -1).concat([{
          id: Date.now(), sender: "bot",
          text: `Found ${results.length} result${results.length !== 1 ? "s" : ""} for "${trimmed}":`,
          products: results,
          suggestions: ["Filter by price", "Show bestsellers", "What's your return policy?"]
        }]));
        setIsLoading(false); return;
      }
    }

    if (intent === "craft_info") {
      const t = trimmed.toLowerCase();
      const craftKey = Object.keys(WEBSITE_KNOWLEDGE.crafts).find(k => t.includes(k.toLowerCase().split(" ")[0]));
      if (craftKey) {
        const craft = WEBSITE_KNOWLEDGE.crafts[craftKey];
        setMessages(prev => prev.slice(0, -1).concat([{
          id: Date.now(), sender: "bot",
          text: `Here's everything about ${craftKey}:`,
          infoCard: { type: "craft", data: { name: craftKey, ...craft } },
          links: [{ label: "Shop Collection", path: "/shop/collection" }, { label: "Heritage Map", path: "/about" }],
          suggestions: ["Tell me about Mallesh Anna", "Show me Ikkat products", "Other crafts?"]
        }]));
        setIsLoading(false); return;
      }
    }

    if (!image) {
      const instant = getInstantResponse(intent);
      if (instant) {
        setMessages(prev => prev.slice(0, -1).concat([{ id: Date.now(), sender: "bot", ...instant }]));
        setIsLoading(false); return;
      }
    }

    if (intent === "faq") {
      const t = trimmed.toLowerCase();
      const match = WEBSITE_KNOWLEDGE.faqs.find(f => {
        const words = f.q.toLowerCase().split(" ");
        return words.filter(w => w.length > 3).some(w => t.includes(w));
      });
      if (match) {
        setMessages(prev => prev.slice(0, -1).concat([{
          id: Date.now(), sender: "bot",
          text: match.a,
          links: [{ label: "All FAQs", path: "/faqs" }],
          suggestions: ["More questions", "Contact support", "Return policy"]
        }]));
        setIsLoading(false); return;
      }
    }

    try {
      const systemPrompt = buildSystemPrompt({
        products,
        orders,
        cartCount: getCartCount(),
        wishlistCount: getWishlistProducts().length,
      });

      const msgPayload = [
        { role: "system", content: systemPrompt },
        { role: "user", content: trimmed + (image ? " [User also sent an image]" : "") }
      ];

      const storedToken = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/chat/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(storedToken && { Authorization: `Bearer ${storedToken}` }),
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: msgPayload,
          max_tokens: 512,
          temperature: 0.7,
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const chatErr = new Error(data?.message || "Chat API error");
        chatErr.code = data?.code || (res.status === 401 ? 'INVALID_API_KEY' : 'API_ERROR');
        throw chatErr;
      }

      let reply = (data.content || "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/^(Hi!?\s|Hello!?\s|Sure!?\s|Of course!?\s|Namaste!?\s)/i, "")
        .trim() || "I'm having trouble right now. Please try again or contact aharyasofficial@gmail.com.";

      // Generate contextual suggested replies based on intent
      const suggestions = {
        "ai_general": ["Tell me more", "Show me products", "Contact support"],
        "about": ["Meet Mallesh Anna", "What crafts do you carry?", "Shop now"],
        "search_products": ["Show bestsellers", "Filter by category", "What's new?"],
      }[intent] || ["Browse collection", "Track my order", "Contact us"];

      setMessages(prev => prev.slice(0, -1).concat([{
        id: Date.now(), sender: "bot", text: reply,
        links: [{ label: "Shop Collection", path: "/shop/collection" }, { label: "Contact Us", path: "/contact" }],
        suggestions
      }]));
    } catch (err) {
      console.error("ChatBot error:", err.message);
      setMessages(prev => prev.slice(0, -1).concat([{
        id: Date.now(), sender: "bot",
        text: "I'm experiencing a connection issue. Please try again or reach us at aharyasofficial@gmail.com / +91 9063284008.",
        links: [{ label: "Support", path: "/support" }],
        suggestions: ["Try again", "Contact support"]
      }]));
    }

    setIsLoading(false);
  }, [input, image, token, orders, products, cartItems, getCartItems, getCartAmount,
    getCartCount, getWishlistProducts, fetchOrders, searchProducts]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage({ preview: reader.result, type: file.type, base64: reader.result.split(",")[1], name: file.name });
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white flex flex-col" style={{ height: "100dvh", paddingTop: "clamp(64px, 5vw, 80px)" }}>

      {/* Header */}
      <div className="border-b border-gray-200 bg-white flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center flex-shrink-0">
            <BotMessageSquare size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-black tracking-wide">Aharyas AI Assistant</h1>
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 font-medium">ONLINE</span>
            </div>
            <p className="text-xs text-gray-500 font-light">Ask about orders, crafts, policies & more</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate("/shop/collection")} className="hidden sm:flex items-center gap-1.5 text-xs border border-gray-300 hover:border-black text-black px-3 py-1.5 transition-colors">
              <ShoppingBag size={12} /> Shop
            </button>
            {token && (
              <button onClick={() => navigate("/orders")} className="hidden sm:flex items-center gap-1.5 text-xs border border-gray-300 hover:border-black text-black px-3 py-1.5 transition-colors">
                <Package size={12} /> Orders
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {quickActions.map((a, i) => {
              const Icon = a.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(a.q)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 hover:text-white hover:bg-black hover:border-black border border-gray-200 bg-white px-3 py-1.5 whitespace-nowrap transition-all flex-shrink-0 disabled:opacity-40"
                >
                  <Icon size={11} /> {a.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              entry={msg}
              currency={currency}
              onSuggestedReply={(r) => handleSend(r)}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {image && (
            <div className="flex items-center gap-3 mb-2 p-2 bg-gray-50 border border-gray-200">
              <img src={image.preview} alt="preview" className="w-10 h-10 object-cover" />
              <p className="text-xs text-gray-600 flex-1 truncate">{image.name}</p>
              <button onClick={() => setImage(null)} className="text-gray-400 hover:text-black"><X size={14} /></button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center border border-gray-300 hover:border-gray-400 focus-within:border-black transition-colors bg-white">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about orders, crafts, policies, artisans..."
                className="flex-1 px-4 py-3 text-sm font-light focus:outline-none bg-transparent placeholder-gray-400"
                disabled={isLoading}
              />
              <button onClick={() => fileRef.current.click()} className="px-3 py-3 text-gray-400 hover:text-black transition-colors" title="Upload image">
                <Image size={16} />
              </button>
              <input type="file" accept="image/*" ref={fileRef} onChange={handleImageUpload} className="hidden" />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || (!input.trim() && !image)}
              className="bg-black text-white p-3 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Full access to orders, cart, wishlist & website content • Sign in for personalized help
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideIn { animation: slideIn 0.2s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ChatBot;