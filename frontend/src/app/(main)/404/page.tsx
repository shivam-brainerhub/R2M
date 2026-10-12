import type { Metadata } from 'next';
import NotFoundView from '@/components/NotFoundView';

export const metadata: Metadata = {
  title: 'Page Not Found',
};

export default function Page404() {
  return <NotFoundView />;
}
