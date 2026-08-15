'use client';

import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google Sign-In will not work.');
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || '1003625070176-4rmpt4ceej1d56otr4holtdfq8u6af37.apps.googleusercontent.com'}>
      <AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        {children}
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}