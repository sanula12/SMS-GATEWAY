const fs = require('fs');

const createPageContent = (base) => `import TicketDetailClient from '@/components/tickets/TicketDetailClient';
import { use } from 'react';

export default function Page({ params }: { params: Promise<{ id: string }> }) { 
  const resolvedParams = use(params);
  return <TicketDetailClient id={resolvedParams.id} baseUrl='${base}' />; 
}
`;

fs.writeFileSync('apps/web/app/admin/tickets/[id]/page.tsx', createPageContent('/admin/tickets'));
fs.writeFileSync('apps/web/app/reseller/tickets/[id]/page.tsx', createPageContent('/reseller/tickets'));
fs.writeFileSync('apps/web/app/dashboard/tickets/[id]/page.tsx', createPageContent('/dashboard/tickets'));
