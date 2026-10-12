'use client';

import { useEffect } from 'react';
import ClientProviders from '@/components/ClientProviders';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServerErrorView from '@/components/ServerErrorView';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <ClientProviders>
      <Navbar />
      <main className="flex-1 flex flex-col">
        <ServerErrorView error={error} reset={reset} />
      </main>
      <Footer />
    </ClientProviders>
  );
}
