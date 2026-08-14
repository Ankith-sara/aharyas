'use client';

import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthContextProvider } from '../context/AuthContext';
import { ProductContextProvider } from '../context/ProductContext';
import { CartContextProvider } from '../context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-google-client-id';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContextProvider>
        <ProductContextProvider>
          <CartContextProvider>
            <ToastContainer
              position="top-right"
              autoClose={3500}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnFocusLoss={false}
              pauseOnHover
              draggable
              toastClassName="text-sm font-light"
            />
            {children}
          </CartContextProvider>
        </ProductContextProvider>
      </AuthContextProvider>
    </GoogleOAuthProvider>
  );
}
