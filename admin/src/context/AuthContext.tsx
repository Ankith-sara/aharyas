'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  token: string;
  login: (t: string) => void;
  logout: () => void;
  backendUrl: string;
}

const AuthContext = createContext<AuthContextType>({
  token: '',
  login: () => {},
  logout: () => {},
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3040',
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('token') || '';
      setToken(savedToken);
    }
  }, []);

  const login = (t: string) => {
    setToken(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', t);
    }
  };

  const logout = () => {
    setToken('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  };

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3040';

  return (
    <AuthContext.Provider value={{ token, login, logout, backendUrl }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
