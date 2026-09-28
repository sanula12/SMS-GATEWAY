import { Metadata } from 'next';
import ResellerWhitelabelClient from '@/components/reseller/ResellerWhitelabelClient';

export const metadata: Metadata = {
  title: 'White-Label Settings | Reseller',
};

export default function ResellerWhitelabelPage() {
  return <ResellerWhitelabelClient />;
}
