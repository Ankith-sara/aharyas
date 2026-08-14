'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, X, BotMessageSquare, ShoppingBag, Heart, Truck, HelpCircle,
  Package, MapPin, ChevronRight, Sparkles, ArrowRight, CheckCircle,
  Clock, Tag, Phone, Mail, MessageSquare, RotateCcw, Image as ImageIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProducts } from "../../context/ProductContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { api } from '../../context/api';

const WEBSITE_KNOWLEDGE = {
  brand: {
    name: "Aharyas",
    tagline: "India's first conscious luxury fashion brand where heritage meets high design",
    story: "Aharyas was born from profound respect for artisans and an ambitious vision to bring their work the visibility it deserves. We bridge India's storied craft heritage with the world of mindful fashion.",
    mission: "To preserve dying crafts, uplift artisan voices, and create fashion that feels timeless, ethical, and soulfully elegant.",
    vision: "To craft India's first luxury clothing brand where heritage meets high design, rooted deeply in culture, craft, and community.",
    stats: { artisans: "300+", crafts: "50+", states: "15+" }
  },
  artisans: {
    mallesh: {
      name: "Mallesh Anna",
      location: "Pochampally",
      craft: "Pochampally Ikkat weaving",
      experience: "40+ years",
      story: "From the weaving town of Pochampally, Mallesh Anna has spent over 40 years breathing life into threads. He began as a young boy, watching his parents tie and dye yarn late into the night. Today, at 56, he still rises before dawn, preparing yarns with care and weaving with quiet pride."
    }
  },
  crafts: {
    "Pochampally Ikkat": {
      description: "Where threads are dyed before they're woven, creating a beautifully blurred, rhythmic art. Pochampally Ikkat from Telangana is a UNESCO-recognised craft.",
      state: "Telangana/Andhra Pradesh",
      technique: "Resist-dyeing of threads before weaving"
    },
    "Kalamkari": {
      description: "Hand-painted and block-printed stories — each fabric a canvas of myth, memory, and meaning.",
      state: "Andhra Pradesh",
      technique: "Hand-painting and block-printing with natural dyes"
    }
  },
  policies: {
    returns: {
      summary: "No cash refunds — replacements & exchanges only",
      cancellation: "Cancel within 6 hours of order placement by emailing support@aharyas.com"
    },
    shipping: {
      free: "Free shipping on orders above ₹999",
      domestic: "0–7 business days for domestic orders"
    }
  },
  contact: {
    email: "aharyasofficial@gmail.com",
    phone: "+91 9063284008",
    hours: "Monday–Saturday, 9 AM – 6 PM"
  }
};

const detectIntent = (text: string) => {
  const t = text.toLowerCase();
  if (/\b(my order|order status|track|where is my|order id|order number)\b/.test(t)) return "track_order";
  if (/\b(my orders|past orders|order history|previous orders|all orders)\b/.test(t)) return "order_history";
  if (/\b(my cart|cart|what.s in|show cart|view cart)\b/.test(t)) return "view_cart";
  if (/\b(my wishlist|saved items|wishlist|favorites|favourites)\b/.test(t)) return "view_wishlist";
  if (/\b(return|refund|exchange|cancel|replacement)\b/.test(t)) return "policy_return";
  if (/\b(shipping|delivery|ship|deliver|dispatch)\b/.test(t)) return "policy_shipping";
  if (/\b(contact|support|help|email|phone|call)\b/.test(t)) return "support";
  if (/\b(about|aharyas|brand|story|artisan|mallesh)\b/.test(t)) return "about";
  return "ai_general";
};

export default function AssistantPage() {
  const router = useRouter();
  const { products, currency, searchProducts } = useProducts();
  const { cartItems, getCartItems, getCartAmount, getCartCount, getWishlistProducts } = useCart();
  const { token } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const greet = token
      ? "Namaste! I'm your Aharyas AI Assistant. Ask me about orders, collections, or artisan stories."
      : "Namaste! I'm your Aharyas AI Assistant. How can I help you discover our handcrafted collections today?";

    setMessages([{
      id: Date.now(),
      sender: "bot",
      text: greet,
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

  const handleSend = async (text = input) => {
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

    if (intent === "policy_return") {
      setMessages(prev => prev.slice(0, -1).concat([{
        id: Date.now(), sender: "bot",
        text: "Here is our Return Policy:\n• Replacements or exchanges within 15 days\n• No cash refunds\n• Cancel within 6 hours by emailing aharyasofficial@gmail.com",
        suggestions: ["Contact support", "Track order"]
      }]));
      setIsLoading(false);
      return;
    }

    if (intent === "policy_shipping") {
      setMessages(prev => prev.slice(0, -1).concat([{
        id: Date.now(), sender: "bot",
        text: "Shipping Details:\n• Free shipping on orders above ₹999\n• Domestic delivery within 0-7 business days\n• Tracking code provided upon dispatch",
        suggestions: ["Return policy", "Track order"]
      }]));
      setIsLoading(false);
      return;
    }

    if (intent === "support") {
      setMessages(prev => prev.slice(0, -1).concat([{
        id: Date.now(), sender: "bot",
        text: `You can reach our team at:\n📧 Email: ${WEBSITE_KNOWLEDGE.contact.email}\n📞 Phone: ${WEBSITE_KNOWLEDGE.contact.phone}\n🕒 Hours: ${WEBSITE_KNOWLEDGE.contact.hours}`,
        suggestions: ["Return policy", "Track order"]
      }]));
      setIsLoading(false);
      return;
    }

    if (intent === "view_cart") {
      const cartList = getCartItems();
      const count = getCartCount();
      const total = getCartAmount();
      setMessages(prev => prev.slice(0, -1).concat([
        count > 0
          ? { id: Date.now(), sender: "bot", text: `Your cart contains ${count} item(s) totaling ${currency}${total}.` }
          : { id: Date.now(), sender: "bot", text: "Your cart is currently empty." }
      ]));
      setIsLoading(false);
      return;
    }

    // Default response
    setTimeout(() => {
      setMessages(prev => prev.slice(0, -1).concat([{
        id: Date.now(),
        sender: "bot",
        text: `Thank you for asking about "${trimmed}". Explore our handcrafted collections or contact aharyasofficial@gmail.com for custom queries!`,
        suggestions: ["Shop collections", "View cart", "Return policy"]
      }]));
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="bg-white flex flex-col min-h-screen pt-16 sm:pt-20">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white py-3 px-4 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <BotMessageSquare size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-black">Aharyas AI Assistant</h1>
            <p className="text-xs text-gray-500 font-light">Handcrafted support & product guidance</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md p-4 text-sm ${msg.sender === 'user' ? 'bg-black text-white' : 'bg-gray-50 border border-gray-200 text-gray-800'}`}>
              {msg.typing ? (
                <p className="text-xs text-gray-400 animate-pulse">Thinking...</p>
              ) : (
                <p className="whitespace-pre-wrap font-light">{msg.text}</p>
              )}
              {msg.suggestions && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {msg.suggestions.map((s: string, i: number) => (
                    <button key={i} onClick={() => handleSend(s)} className="text-xs border border-gray-300 px-2 py-1 hover:bg-black hover:text-white transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white p-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about orders, sizing, fabrics..."
            className="flex-1 px-4 py-3 border border-gray-300 text-sm font-light focus:outline-none focus:border-black"
          />
          <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="bg-black text-white p-3 hover:bg-gray-800 disabled:opacity-50">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
