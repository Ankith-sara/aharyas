'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquareText, X, Send, BotMessageSquare,
  Sparkles, ExternalLink
} from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: number;
  sender: 'bot' | 'user';
  text: string;
  typing?: boolean;
  suggestions?: string[];
  links?: { label: string; url: string }[];
}

const GREETINGS_REGEX = /\b(hi|hello|hey|namaste|greetings|good morning|good afternoon|good evening|hiya|helo)\b/i;
const BRAND_REGEX = /\b(what is aharyas|about aharyas|who is aharyas|tell me about aharyas|brand|who created|founded|avani|what do you do)\b/i;
const CRAFTS_REGEX = /\b(craft|crafts|what crafts do you carry|ikkat|kalamkari|zardozi|weaving|artisan|artisans|heritage|technique)\b/i;
const BESTSELLER_REGEX = /\b(best\s*sell(ing|er)?s?|best product|best products|bestseller|bestsellers|popular|top items|recommend|recommendation|trending|must buy)\b/i;
const CHEAPEST_REGEX = /\b(least value|lowest price|cheapest|least expensive|budget|entry level|minimum price|lowest cost|value for money|affordable)\b/i;
const EXPENSIVE_REGEX = /\b(highest price|most expensive|luxury|costliest|maximum price|premium|flagship)\b/i;
const ORDER_TRACK_REGEX = /\b(track|track my order|where is my order|order status|order id|tracking)\b/i;
const CART_REGEX = /\b(cart|view cart|my cart|basket|items in cart)\b/i;
const WISHLIST_REGEX = /\b(wishlist|view wishlist|saved|favorites|favourites)\b/i;
const RETURN_REGEX = /\b(return|return policy|refund|exchange|cancel|cancellation|replacement)\b/i;
const SHIPPING_REGEX = /\b(shipping|shipping policy|shipping details|delivery|ship|deliver|dispatch|charges)\b/i;
const SUPPORT_REGEX = /\b(contact|contact support|support|help|email|phone|call|customer care)\b/i;

export default function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { products, currency } = useProducts();
  const { getCartCount, getCartAmount, wishlistItems } = useCart();
  const { user } = useAuth();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: "Namaste! I'm your Aharyas AI Assistant. How can I help you explore our handcrafted luxury collections today?",
      suggestions: [
        'What is Aharyas?',
        'What crafts do you carry?',
        'Best selling products',
        'Return Policy',
      ],
    },
  ]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const generateResponse = (text: string) => {
    const trimmed = text.trim().toLowerCase();

    // 1. Greetings
    if (GREETINGS_REGEX.test(trimmed) && trimmed.length < 20) {
      return {
        text: `Namaste${user?.name ? ` ${user.name}` : ''}! How can I assist you with Aharyas today?`,
        suggestions: ['What is Aharyas?', 'What crafts do you carry?', 'Best selling products', 'Track my order'],
      };
    }

    // 2. What is Aharyas
    if (BRAND_REGEX.test(trimmed)) {
      return {
        text: "Aharyas is India's premier conscious luxury fashion brand where heritage craft meets high design.\n\nFounded by Avani Reddy, we connect 300+ rural artisans directly to global markets. Every piece — from Pochampally Ikkat sarees to hand-loomed linens and Zardozi accessories — is ethically crafted with love and authenticity.",
        suggestions: ['What crafts do you carry?', 'Best selling products', 'Contact Support'],
        links: [{ label: 'Read Our Story', url: '/about' }],
      };
    }

    // 3. Crafts
    if (CRAFTS_REGEX.test(trimmed)) {
      return {
        text: "We work with over 50+ traditional Indian crafts across 15 states, including:\n\n✨ **Pochampally Ikkat**: UNESCO-recognised tie-and-dye weaving from Telangana.\n🎨 **Kalamkari**: Hand-painted & block-printed natural dye art.\n🧵 **Zardozi Embroidery**: Intricate metallic threadwork.\n🌿 **Organic Linens & Silks**: Breathable, hand-loomed luxury.",
        suggestions: ['Best selling products', 'Explore Collections', 'Return Policy'],
        links: [{ label: 'Explore Collections', url: '/shop/collection' }],
      };
    }

    // 4. Best Selling Products
    if (BESTSELLER_REGEX.test(trimmed)) {
      const topProducts = products?.slice(0, 3) || [];
      let textContent = "Here are our most celebrated handcrafted creations:\n\n";

      if (topProducts.length > 0) {
        topProducts.forEach((p, idx) => {
          textContent += `${idx + 1}. **${p.name}** — ${currency}${p.price}\n`;
        });
      } else {
        textContent += "1. **Pochampally Ikkat Silk Saree** — Timeless geometric luxury\n2. **Handcrafted Linen Co-ord Set** — Modern breathable silhouette\n3. **Kalamkari Artisan Dress** — Naturally dyed heritage elegance";
      }

      return {
        text: textContent,
        suggestions: ['What crafts do you carry?', 'View Cart', 'Return Policy'],
        links: [{ label: 'Shop Best Sellers', url: '/shop/collection' }],
      };
    }

    // 5. Cheapest / Lowest Price / Value for Money
    if (CHEAPEST_REGEX.test(trimmed)) {
      if (products && products.length > 0) {
        const sorted = [...products].sort((a, b) => a.price - b.price);
        const cheapest = sorted[0];
        return {
          text: `Every Aharyas product is ethically handcrafted in small batches to deliver maximum artisan value.\n\nOur most budget-friendly entry piece is **${cheapest.name}** priced at **${currency}${cheapest.price}**.\n\nOther affordable artisan favorites include:\n${sorted.slice(1, 3).map(p => `• **${p.name}** — ${currency}${p.price}`).join('\n')}`,
          suggestions: ['Best selling products', 'Explore Collections', 'Return Policy'],
          links: [{ label: 'View Collection', url: '/shop/collection' }],
        };
      }
      return {
        text: "Every Aharyas product is ethically handcrafted in small batches. Our entry-level handcrafted pieces start from ₹499.",
        suggestions: ['Best selling products', 'Explore Collections'],
        links: [{ label: 'Explore Collections', url: '/shop/collection' }],
      };
    }

    // 6. Most Expensive / Luxury Flagships
    if (EXPENSIVE_REGEX.test(trimmed)) {
      if (products && products.length > 0) {
        const sorted = [...products].sort((a, b) => b.price - a.price);
        const priciest = sorted[0];
        return {
          text: `Our most exclusive luxury flagship piece is **${priciest.name}** priced at **${currency}${priciest.price}**.\n\nOther flagship heritage creations:\n${sorted.slice(1, 3).map(p => `• **${p.name}** — ${currency}${p.price}`).join('\n')}`,
          suggestions: ['Best selling products', 'What crafts do you carry?'],
          links: [{ label: 'View Collection', url: '/shop/collection' }],
        };
      }
    }

    // 5. Track Order
    if (ORDER_TRACK_REGEX.test(trimmed)) {
      return {
        text: "You can track your order status anytime by entering your Order ID on our tracking portal.",
        suggestions: ['Return Policy', 'Contact Support'],
        links: [{ label: 'Track Order Now', url: '/track-order' }],
      };
    }

    // 6. Cart
    if (CART_REGEX.test(trimmed)) {
      const count = getCartCount();
      const amount = getCartAmount();
      if (count > 0) {
        return {
          text: `You have **${count} item(s)** in your cart totaling **${currency}${amount}**.`,
          suggestions: ['Checkout', 'Best selling products'],
          links: [{ label: 'Go to Cart', url: '/cart' }],
        };
      }
      return {
        text: "Your shopping cart is currently empty. Discover our handcrafted collections!",
        suggestions: ['Best selling products', 'What crafts do you carry?'],
        links: [{ label: 'Explore Shop', url: '/shop/collection' }],
      };
    }

    // 7. Wishlist
    if (WISHLIST_REGEX.test(trimmed)) {
      const count = wishlistItems?.length || 0;
      return {
        text: count > 0 ? `You have **${count} saved item(s)** in your wishlist.` : "Your wishlist is empty.",
        suggestions: ['Best selling products', 'View Cart'],
        links: [{ label: 'View Wishlist', url: '/wishlist' }],
      };
    }

    // 8. Return Policy
    if (RETURN_REGEX.test(trimmed)) {
      return {
        text: "Return & Exchange Policy:\n• Replacements or size exchanges accepted within 15 days of delivery.\n• Items must be unused with original tags intact.\n• Note: We offer exchanges & replacements (no cash refunds).\n• Cancellations accepted within 6 hours of order placement.",
        suggestions: ['Shipping Policy', 'Contact Support'],
        links: [{ label: 'Read Full Policy', url: '/refund-policy' }],
      };
    }

    // 9. Shipping Policy
    if (SHIPPING_REGEX.test(trimmed)) {
      return {
        text: "Shipping & Delivery:\n• Free express shipping on domestic orders above ₹999.\n• Standard delivery: 0–7 business days across India.\n• Tracking details sent via SMS/Email upon dispatch.",
        suggestions: ['Return Policy', 'Track Order'],
        links: [{ label: 'Shipping Details', url: '/shipping-policy' }],
      };
    }

    // 10. Support
    if (SUPPORT_REGEX.test(trimmed)) {
      return {
        text: "Our dedicated support team is here to assist you:\n\n Email: aharyasofficial@gmail.com\n📞 **Phone**: +91 9063284008\n🕒 **Hours**: Mon – Sat, 9:00 AM – 6:00 PM IST",
        suggestions: ['Return Policy', 'Track Order'],
        links: [{ label: 'Contact Us', url: '/contact' }],
      };
    }

    // 11. Generic Product Search or Smart Fallback
    const matchedProducts = products?.filter(p =>
      p.name.toLowerCase().includes(trimmed) || p.category?.toLowerCase().includes(trimmed) || p.subCategory?.toLowerCase().includes(trimmed)
    ).slice(0, 2);

    if (matchedProducts && matchedProducts.length > 0) {
      let productText = `We found matching items for "${text}":\n\n`;
      matchedProducts.forEach(p => {
        productText += `• **${p.name}** (${currency}${p.price})\n`;
      });
      return {
        text: productText,
        suggestions: ['Best selling products', 'View Cart'],
        links: [{ label: 'View Collection', url: '/shop/collection' }],
      };
    }

    return {
      text: `I'd be happy to help with "${text}". Aharyas crafts sustainable, luxury artisan wearables in limited small batches. Would you like to explore our latest collections, check return policies, or speak with support?`,
      suggestions: ['What is Aharyas?', 'What crafts do you carry?', 'Best selling products', 'Contact Support'],
    };
  };

  const handleSend = (userText = input) => {
    const text = userText.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now(), sender: 'user', text };
    const typingMsg: Message = { id: Date.now() + 1, sender: 'bot', text: '', typing: true };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      const response = generateResponse(text);
      setMessages(prev =>
        prev.slice(0, -1).concat({
          id: Date.now() + 2,
          sender: 'bot',
          text: response.text,
          suggestions: response.suggestions,
          links: response.links,
        })
      );
      setIsLoading(false);
    }, 400);
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-black text-white p-3.5 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20 flex items-center justify-center group ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        aria-label="Ask ఆ Assistant"
      >
        <MessageSquareText size={20} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-light tracking-wide pl-0 group-hover:pl-2">
          Ask ఆ
        </span>
      </button>

      {/* Slide-Over Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Slide-Over Side View Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-black text-white p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <BotMessageSquare size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white">Aharyas AI Assistant</h2>
              <p className="text-[10px] text-gray-400 font-light">Craft, Collections & Order Guidance</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close Assistant Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3.5 rounded-lg text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-black text-white rounded-br-none shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-xs'
                }`}
              >
                {msg.typing ? (
                  <div className="flex items-center gap-1.5 py-1 text-gray-400">
                    <Sparkles size={12} className="animate-spin text-gray-600" />
                    <span className="text-[11px] font-light">Formulating response...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-line font-light">{msg.text}</div>
                )}

                {/* Optional Quick Link Buttons */}
                {msg.links && msg.links.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                    {msg.links.map((link, idx) => (
                      <Link
                        key={idx}
                        href={link.url}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-black underline underline-offset-2 hover:opacity-70 transition-opacity"
                      >
                        {link.label} <ExternalLink size={10} />
                      </Link>
                    ))}
                  </div>
                )}

                {/* Suggestions Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-gray-100">
                    {msg.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s)}
                        className="text-[10px] bg-gray-100 hover:bg-black hover:text-white border border-gray-200 px-2.5 py-1 rounded-full text-gray-700 font-light transition-all duration-200"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-gray-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about crafts, orders, sizing..."
              className="flex-1 px-3.5 py-2.5 text-xs border border-gray-200 focus:outline-none focus:border-black font-light rounded-sm bg-gray-50 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-black text-white p-2.5 rounded-sm hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </form>
          <div className="mt-2 text-center text-[9px] text-gray-400 font-light">
            Powered by Aharyas Artisan AI · Fast Heritage Support
          </div>
        </div>
      </div>
    </>
  );
}
