'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { QuoteCartProvider } from '../context/QuoteCartContext';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QuoteCartProvider>
        {children}
      </QuoteCartProvider>
    </AuthProvider>
  );
}
