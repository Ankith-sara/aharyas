'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function ProfileRedirect() {
  const router = useRouter();
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else if (user?._id) {
      router.push(`/profile/${user._id}`);
    }
  }, [user, token, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse">Loading profile...</p>
    </div>
  );
}
