'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Button, Skeleton, IconButton, Tooltip, Grid, Avatar,
    TextField, FormControl, Select, MenuItem
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { CampaignsService } from '@/lib/services/campaigns.service';
import StatusChip from '@/components/ui/Statuschip';
import EmptyState from '@/components/ui/Emptystate';
import { formatDate } from '@/lib/utils';
import DataTable, { ColumnDef } from '../shared/DataTable';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';

export default function CampaignsClient() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    const router = useRouter();

    const premiumShadow = '0px 2px 4px rgba(0, 0, 0, 0.04), 0px 4px 6px rgba(0, 0, 0, 0.02)';

    useEffect(() => {
        CampaignsService.getAll()
            .then(res => {
                const data = res?.data ?? res ?? [];
                setCampaigns(Array.isArray(data) ? data : []);
            })
            .catch(() => setCampaigns([]))
            .finally(() => setLoading(false));
    }, []);

    // Quick Stats
    const totalCampaigns = campaigns.length;
    const totalDelivered = campaigns.reduce((acc, c) => acc + (c.deliveredCount ?? c.delivered ?? 0), 0);
    const totalFailed = campaigns.reduce((acc, c) => acc + (c.failedCount ?? c.failed ?? 0), 0);

    // Filter Logic
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter(c => {
            const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [campaigns, searchQuery, statusFilter]);

    
    const columns: ColumnDef<any>[] = [
        { id: 'name', label: 'Campaign Name', render: (c) => <span style={{ fontWeight: 700, color: '#111827' }}>{c.name}</span> },
        { id: 'type', label: 'Type', render: (c) => <span style={{ textTransform: 'capitalize', color: '#4B5563', fontSize: '0.85rem' }}>{c.type ?? 'bulk'}</span> },
        { id: 'status', label: 'Status', render: (c) => <StatusChip status={c.status} /> },
        { id: 'total', label: 'Total', render: (c) => <span style={{ fontWeight: 600, color: '#374151' }}>{c.totalCount ?? c.total ?? '-'}</span> },
        { id: 'delivered', label: 'Delivered', render: (c) => <span style={{ color: '#10B981', fontWeight: 600 }}>{c.deliveredCount ?? c.delivered ?? '-'}</span> },
        { id: 'failed', label: 'Failed', render: (c) => <span style={{ color: '#EF4444', fontWeight: 600 }}>{c.failedCount ?? c.failed ?? '-'}</span> },
        { id: 'date', label: 'Date', render: (c) => <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>{formatDate(c.createdAt)}</span> },
        { id: 'actions', label: '', align: 'right', render: (c) => (
            <Tooltip title="View Report">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); router.push('/dashboard/campaigns/' + c.id); }} sx={{ color: '#6B7280', '&:hover': { color: '#4f46e5' } }}>
                    <VisibilityIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        ) }
    ];

    return (
        <Box sx={{ maxWidth: '100%', pb: 6 }}>
            {/* 1. The Hero Banner */}
            <Card elevation={0} sx={{ 
                p: 4, mb: 4, borderRadius: 3, 
                background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                color: '#fff', boxShadow: premiumShadow,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3
            }}>
                <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>
                        Campaign Manager
                    </Typography>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
                        Campaign History
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#D1D5DB' }}>
                        Track delivery metrics and performance for your previous broadcasts.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        component={NextLink} href="/dashboard/send"
                        variant="contained" startIcon={<SendIcon sx={{ width: 16 }} />}
                        sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, fontWeight: 600, px: 3 }}
                    >
                        New Campaign
                    </Button>
                </Box>
            </Card>

            <Grid container spacing={3}>
                {/* LEFT COLUMN: The Table */}
                <Grid size={{ xs: 12, md: 9 }}>
                    <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, overflow: 'hidden' }}>
                        
                        {/* Filters Section */}
                        <Box sx={{ p: 2, display: 'flex', gap: 2, bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField 
                                size="small"
                                placeholder="Search campaigns..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 }, flex: 1, minWidth: 140 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 150, flex: { xs: 1, sm: 'none' } }}>
                                <Select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    displayEmpty
                                    sx={{ bgcolor: '#fff', borderRadius: 2 }}
                                >
                                    <MenuItem value="all">All Statuses</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="processing">Processing</MenuItem>
                                    <MenuItem value="failed">Failed</MenuItem>
                                    <MenuItem value="scheduled">Scheduled</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ p: -2 }}><DataTable columns={columns} data={filteredCampaigns} loading={loading} emptyMessage={campaigns.length === 0 ? "Create your first bulk campaign to start reaching your audience." : "Try adjusting your search filters."} /></Box>
                    </Card>
                </Grid>

                {/* RIGHT COLUMN: Summary Stats */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, bgcolor: '#F9FAFB', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <AssessmentOutlinedIcon sx={{ color: '#4f46e5' }} />
                            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Lifetime Stats</Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Campaigns</Typography>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>{totalCampaigns}</Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Delivered</Typography>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>{totalDelivered.toLocaleString()}</Typography>
                        </Box>

                        <Box>
                            <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Failed</Typography>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#EF4444' }}>{totalFailed.toLocaleString()}</Typography>
                        </Box>
                    </Card>

                    <Card elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, bgcolor: '#fff' }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#EEF2FF', color: '#4f46e5' }}><RocketLaunchIcon /></Avatar>
                            <Box>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>Pro Tip</Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mt: 0.5 }}>
                                    Scheduling campaigns for off-peak hours can improve delivery speeds by up to 30%.
                                </Typography>
                            </Box>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}