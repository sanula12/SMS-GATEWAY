'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Button, Skeleton, Grid, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NextLink from 'next/link';
import { CampaignsService } from '@/lib/services/campaigns.service';
import StatusChip from '@/components/ui/Statuschip';
import { formatDate } from '@/lib/utils';
import DataTable, { ColumnDef } from '../shared/DataTable';

export default function CampaignReportClient({ id }: { id: string }) {
    const [stats, setStats] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const premiumShadow = '0px 2px 4px rgba(0, 0, 0, 0.04), 0px 4px 6px rgba(0, 0, 0, 0.02)';

    useEffect(() => {
        CampaignsService.getStats(id)
            .then(res => {
                setStats(res);
            })
            .catch(console.error);

        CampaignsService.getMessages(id)
            .then(res => {
                const data = res?.data ?? res ?? [];
                setMessages(Array.isArray(data) ? data : []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const columns: ColumnDef<any>[] = [
        { id: 'to', label: 'Recipient', render: (c) => <span style={{ fontWeight: 600 }}>{c.to}</span> },
        { id: 'status', label: 'Status', render: (c) => <StatusChip status={c.status} /> },
        { id: 'segments', label: 'Segments', render: (c) => c.segmentCount ?? 1 },
        { id: 'cost', label: 'Cost', render: (c) => `Rs. ${c.creditCost ?? '0.00'}` },
        { id: 'date', label: 'Date', render: (c) => <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>{formatDate(c.createdAt)}</span> },
    ];

    if (loading) return <Box p={4}><Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 3 }} /><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Box>;
    if (!stats) return <Box p={4}><Typography color="error">Campaign not found</Typography></Box>;

    const { campaign, stats: summary } = stats;

    return (
        <Box sx={{ maxWidth: '100%', pb: 6 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton component={NextLink} href="/dashboard/campaigns">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight={800}>{campaign.name} Report</Typography>
                <StatusChip status={campaign.status} />
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Total Messages</Typography>
                        <Typography variant="h4" fontWeight={800} color="#111827">{summary.total}</Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Delivered</Typography>
                        <Typography variant="h4" fontWeight={800} color="#10B981">{summary.delivered}</Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Failed</Typography>
                        <Typography variant="h4" fontWeight={800} color="#EF4444">{summary.failed}</Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Delivery Rate</Typography>
                        <Typography variant="h4" fontWeight={800} color="#4F46E5">{summary.deliveryRate}%</Typography>
                    </Card>
                </Grid>
            </Grid>

            <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #E5E7EB', bgcolor: '#F9FAFB' }}>
                    <Typography variant="subtitle2" fontWeight={700}>Message Log</Typography>
                </Box>
                <DataTable
                    columns={columns}
                    data={messages}
                    exportable={true}
                    exportFilename={`${campaign.name.replace(/\s+/g, '_')}_Report.xlsx`}
                />
            </Card>
        </Box>
    );
}
