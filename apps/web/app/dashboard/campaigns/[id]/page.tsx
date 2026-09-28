import CampaignReportClient from '@/components/dashboard/CampaignReportClient';
import { use } from 'react';

export default function CampaignReportPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return <CampaignReportClient id={resolvedParams.id} />;
}
