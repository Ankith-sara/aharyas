'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackOrderRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.push('/orders');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse">Redirecting to orders...</p>
    </div>
  );
}
