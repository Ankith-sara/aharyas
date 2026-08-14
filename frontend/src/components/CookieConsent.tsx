'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'aharyas_cookie_consent';

const applyPreferences = (prefs: { analytics: boolean; marketing: boolean }) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('consent', 'update', {
      analytics_storage: prefs.analytics ? 'granted' : 'denied',
      ad_storage: prefs.marketing ? 'granted' : 'denied',
      ad_user_data: prefs.marketing ? 'granted' : 'denied',
      ad_personalization: prefs.marketing ? 'granted' : 'denied',
    });
  }
};

const PrefRow = ({
  label,
  desc,
  locked,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  locked?: boolean;
  checked?: boolean;
  onChange?: () => void;
}) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-black">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
    </div>

    {locked ? (
      <span className="flex-shrink-0 text-[10px] tracking-widest uppercase text-gray-400 mt-1 pt-0.5">
        Always on
      </span>
    ) : (
      <button
        role="checkbox"
        aria-checked={checked}
        aria-label={`${label} cookies`}
        onClick={onChange}
        className="flex-shrink-0 flex items-center justify-center w-11 h-11 -mr-1 -mt-1 focus-visible:outline-none group"
      >
        <span
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
            checked ? 'bg-black border-black' : 'bg-white border-gray-300 group-hover:border-gray-500 group-active:border-gray-700'
          }`}
        >
          {checked && <Check size={12} strokeWidth={3} className="text-white" />}
        </span>
      </button>
    )}
  </div>
);

export default function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: true, marketing: false });

  useEffect(() => {
    if (pathname === '/assistant') {
      setVisible(false);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        applyPreferences(parsed.prefs || { analytics: false, marketing: false });
        return;
      }
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setVisible(true), 1400);
    return () => clearTimeout(t);
  }, [pathname]);

  const save = (accepted: boolean, customPrefs?: { analytics: boolean; marketing: boolean }) => {
    const finalPrefs = accepted ? customPrefs || prefs : { analytics: false, marketing: false };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted, prefs: finalPrefs, ts: Date.now(), version: 1 }));
    } catch {
      /* private browsing */
    }
    applyPreferences(finalPrefs);
    setVisible(false);
  };

  const acceptAll = () => {
    const all = { analytics: true, marketing: true };
    setPrefs(all);
    save(true, all);
  };
  const acceptEssential = () => save(false);
  const saveCustom = () => save(true, prefs);
  const toggle = (key: 'analytics' | 'marketing') => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9999] flex justify-start sm:px-4 sm:pb-4"
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
    >
      <div
        className="cookie-banner flex flex-col w-full sm:max-w-lg bg-white border-t sm:border border-black sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        style={{
          maxHeight: 'min(92dvh, 500px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100">
          <p className="text-[10px] tracking-[0.25em] uppercase font-medium text-gray-500">Cookie preferences</p>
          <button
            onClick={acceptEssential}
            aria-label="Dismiss"
            className="w-11 h-11 -mr-2 flex items-center justify-center text-gray-400 hover:text-black active:text-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            We use cookies to keep your cart, remember preferences, and understand how people discover our handcrafted collections.{' '}
            <button
              onClick={() => setShowDetails((d) => !d)}
              className="underline underline-offset-2 text-black hover:no-underline active:no-underline"
            >
              {showDetails ? 'Hide details' : 'Manage preferences'}
            </button>
          </p>

          {showDetails && (
            <div className="mt-4 border-t border-gray-100 pt-1">
              <PrefRow
                key="essential"
                label="Essential"
                desc="Cart, authentication, security. Cannot be disabled."
                locked
                checked
              />
              <PrefRow
                key="analytics"
                label="Analytics"
                desc="Helps us understand which products and pages resonate most."
                checked={prefs.analytics}
                onChange={() => toggle('analytics')}
              />
              <PrefRow
                key="marketing"
                label="Marketing"
                desc="Personalised ads and social media features."
                checked={prefs.marketing}
                onChange={() => toggle('marketing')}
              />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-4 sm:px-5 pt-1 pb-3 flex flex-row gap-2">
          <button
            onClick={acceptAll}
            className="flex-1 bg-black text-white text-[11px] tracking-[0.18em] uppercase py-3 px-3 hover:bg-gray-900 active:bg-gray-800 transition-colors min-h-[44px]"
          >
            Accept all
          </button>
          {showDetails ? (
            <button
              onClick={saveCustom}
              className="flex-1 border border-black text-black text-[11px] tracking-[0.18em] uppercase py-3 px-3 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px]"
            >
              Save preferences
            </button>
          ) : (
            <button
              onClick={acceptEssential}
              className="flex-1 border border-gray-300 text-gray-600 text-[11px] tracking-[0.18em] uppercase py-3 px-3 hover:border-black hover:text-black transition-colors min-h-[44px]"
            >
              Essential only
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
