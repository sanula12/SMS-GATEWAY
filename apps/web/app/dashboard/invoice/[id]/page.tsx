import InvoiceClient from '@/components/dashboard/InvoiceClient';
import { use } from 'react';

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <InvoiceClient txId={resolvedParams.id} />;
}
