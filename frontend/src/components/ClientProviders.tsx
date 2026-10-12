'use client';

import React from 'react';
import { QuoteCartProvider } from '../context/QuoteCartContext';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QuoteCartProvider>
      {children}
    </QuoteCartProvider>
  );
}
