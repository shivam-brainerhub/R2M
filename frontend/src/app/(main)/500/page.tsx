import type { Metadata } from 'next';
import ServerErrorView from '@/components/ServerErrorView';

export const metadata: Metadata = {
  title: 'Internal Server Error',
};

export default function Page500() {
  return <ServerErrorView />;
}
