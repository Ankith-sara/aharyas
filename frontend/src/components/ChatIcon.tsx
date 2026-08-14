'use client';

import Link from 'next/link';
import { MessageSquareText } from 'lucide-react';

export default function ChatIcon() {
  return (
    <Link
      href="/assistant"
      className="fixed bottom-6 right-6 z-40 bg-black text-white p-3.5 rounded-full shadow-lg hover:scale-105 transition-all duration-300 border border-white/20 flex items-center justify-center group"
      aria-label="Ask Aharyas AI Assistant"
    >
      <MessageSquareText size={20} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-light tracking-wide pl-0 group-hover:pl-2">
        Ask Aharyas AI
      </span>
    </Link>
  );
}
