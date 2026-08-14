'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RefundPolicyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.push('/refund-policy');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse">Redirecting...</p>
    </div>
  );
}
