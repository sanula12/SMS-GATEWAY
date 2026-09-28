import TicketDetailClient from '@/components/tickets/TicketDetailClient';
import { use } from 'react';

export default function Page({ params }: { params: Promise<{ id: string }> }) { 
  const resolvedParams = use(params);
  return <TicketDetailClient id={resolvedParams.id} baseUrl='/admin/tickets' />; 
}
