'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, Button, Skeleton, Stack, Chip, Divider, IconButton, Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { CampaignsService } from '@/lib/services/campaigns.service';
import EmptyState from '@/components/ui/Emptystate';
import DataTable, { ColumnDef } from '../shared/DataTable';
import { formatDate, truncate } from '@/lib/utils';

export default function CampaignModerationClient() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await CampaignsService.getPending();
            setCampaigns(data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load pending campaigns');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        setError(null);
        setSuccess(null);
        try {
            await CampaignsService.approve(id);
            setSuccess('Campaign approved successfully');
            load();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject this campaign? Credits will be refunded.')) return;
        
        setActionLoading(id);
        setError(null);
        setSuccess(null);
        try {
            const res = await CampaignsService.reject(id);
            setSuccess(`Campaign rejected. Refunded: Rs. ${res.refundedCredits || 0}`);
            load();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    
    const columns: ColumnDef<any>[] = [
        { id: 'name', label: 'Campaign Name', render: (c) => <span style={{ fontWeight: 600, color: '#1e293b' }}>{c.name}</span> },
        { id: 'account', label: 'Account', render: (c) => (
            <>
                <Typography variant="body2" fontWeight={600}>{c.accountName ?? 'Unknown'}</Typography>
                <Typography variant="caption" color="text.secondary">ID: {c.accountId.slice(0,8)}...</Typography>
            </>
        ) },
        { id: 'recipients', label: 'Recipients', render: (c) => <Chip label={c.totalCount.toLocaleString()} size="small" sx={{ fontWeight: 700, bgcolor: '#e0e7ff', color: '#4338ca' }} /> },
        { id: 'message', label: 'Message Preview', render: (c) => (
            <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {c.message}
            </Typography>
        ) },
        { id: 'type', label: 'Type', render: (c) => (
            <Chip label={c.type.toUpperCase()} size="small" sx={{ fontSize: '0.65rem', fontWeight: 700, bgcolor: c.type === 'bulk' ? '#eef2ff' : '#f0fdf4', color: c.type === 'bulk' ? '#4f46e5' : '#16a34a' }} />
        ) },
        { id: 'submitted', label: 'Submitted', render: (c) => (
            <Typography variant="caption" sx={{ color: '#64748b' }}>{formatDate(c.createdAt)}</Typography>
        ) },
        { id: 'actions', label: 'Actions', render: (c) => (
            <Stack direction="row" spacing={1}>
                <Button
                    size="small" variant="contained"
                    onClick={() => handleApprove(c.id)}
                    disabled={actionLoading === c.id}
                    sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', borderRadius: 2 }}
                >
                    Approve
                </Button>
                <Button
                    size="small" variant="outlined" color="error"
                    onClick={() => handleReject(c.id)}
                    disabled={actionLoading === c.id}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                    Reject
                </Button>
            </Stack>
        ) }
    ];

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Campaign Moderation</Typography>
                    <Typography variant="body2" color="text.secondary">Review and approve large bulk campaigns before they are sent.</Typography>
                </Box>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} sx={{ fontWeight: 600 }}>
                    Refresh List
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
                <Box sx={{ p: -2 }}><DataTable columns={columns} data={campaigns} loading={loading} emptyMessage="All clear! No campaigns are waiting for approval." /></Box>
            </Card>
        </Box>
    );
}

