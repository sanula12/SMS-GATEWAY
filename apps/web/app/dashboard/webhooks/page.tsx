import WebhooksClient from '@/components/dashboard/WebhooksClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Webhooks',
};

export default function WebhooksPage() {
  return <WebhooksClient />;
}
