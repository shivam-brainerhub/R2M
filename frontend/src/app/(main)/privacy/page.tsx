import type { Metadata } from 'next';
import PrivacyContent from '@/components/PrivacyContent';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy and POPIA compliance statement for SA Healthcare.',
};

export default function PrivacyPolicyPage() {
  return <PrivacyContent />;
}
