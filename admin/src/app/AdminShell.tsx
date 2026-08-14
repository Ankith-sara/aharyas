'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import Sidebar from '../components/Sidebar';
import Login from '../components/Login';

interface DecodedToken {
  role?: string;
  exp?: number;
  [key: string]: any;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkIsAdmin = (): boolean => {
    if (!token) return false;
    try {
      const decoded: DecodedToken = jwtDecode(token);
      if (decoded.role === 'admin' && decoded.exp && decoded.exp * 1000 > Date.now()) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const authenticated = mounted && checkIsAdmin();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 lg:ml-64 min-w-0 overflow-x-hidden p-4 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
