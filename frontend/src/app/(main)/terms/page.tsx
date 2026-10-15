import type { Metadata } from 'next';
import TermsContent from '@/components/TermsContent';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use and Catalogue Conditions for SA Healthcare.',
};

export default function TermsOfUsePage() {
  return <TermsContent />;
}
