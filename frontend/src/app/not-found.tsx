import type { Metadata } from 'next';
import ClientProviders from '@/components/ClientProviders';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NotFoundView from '@/components/NotFoundView';

export const metadata: Metadata = {
  title: 'Page Not Found',
};

export default function NotFound() {
  return (
    <ClientProviders>
      <Navbar />
      <main className="flex-1 flex flex-col">
        <NotFoundView />
      </main>
      <Footer />
    </ClientProviders>
  );
}
