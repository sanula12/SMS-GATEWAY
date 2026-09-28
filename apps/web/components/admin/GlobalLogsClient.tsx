'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Card, CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, TextField, InputAdornment, MenuItem,
    Select, FormControl, InputLabel, Button, Skeleton, Pagination, Divider, Stack, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import { SmsService } from '@/lib/services/sms.service';
import StatusChip from '@/components/ui/Statuschip';
import EmptyState from '@/components/ui/Emptystate';
import { formatDate, truncate } from '@/lib/utils';
import DataTable, { ColumnDef } from '../shared/DataTable';

const STATUS_OPTIONS = ['All Statuses', 'sent', 'delivered', 'failed', 'pending'];

export default function GlobalLogsClient() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('All Statuses');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const PER_PAGE = 25;

    const load = async () => {
        setLoading(true);
        try {
            const res = await SmsService.getGlobalLogs({
                page, limit: PER_PAGE,
                status: status === 'All Statuses' ? undefined : status,
                search: search || undefined,
            } as any);
            const data = res?.data ?? res ?? [];
            setMessages(Array.isArray(data) ? data : []);
            setTotal(res?.total ?? data.length);
        } catch { setMessages([]); } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [page, status]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };
    const delivered = messages.filter(m => ['delivered', 'sent'].includes(m.status)).length;
    const failed = messages.filter(m => m.status === 'failed').length;

    
    const columns: ColumnDef<any>[] = [
        { id: 'id', label: 'ID', render: (m) => <span style={{ fontWeight: 600, color: '#4f6ef7', fontSize: '0.82rem' }}>#{m.id?.toString().slice(-4)}</span> },
        { id: 'account', label: 'Account', render: (m) => (
            <>
                <Typography variant="body2" fontWeight={600}>{m.accountName ?? 'Unknown'}</Typography>
                <Typography variant="caption" color="text.secondary">{m.from || 'Default Mask'}</Typography>
            </>
        ) },
        { id: 'recipient', label: 'Recipient Number', render: (m) => <span style={{ fontWeight: 600 }}>{m.to ?? m.recipient}</span> },
        { id: 'preview', label: 'Message Preview', render: (m) => <span style={{ color: '#475569', fontSize: '0.85rem' }}>{truncate(m.body ?? m.message ?? '', 40)}</span> },
        { id: 'status', label: 'Status', render: (m) => <StatusChip status={m.status} /> },
        { id: 'timestamp', label: 'Timestamp', render: (m) => <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{formatDate(m.createdAt ?? m.timestamp)}</span> },
        { id: 'cost', label: 'Cost', render: (m) => <span style={{ fontWeight: 600 }}>Rs. {parseFloat(m.creditCost ?? m.cost ?? '0').toFixed(4)}</span> }
    ];

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Global SMS Logs</Typography>
                    <Typography variant="body2" color="text.secondary">Trace all messages sent across the entire platform.</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ fontWeight: 600 }}>Export to CSV</Button>
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={load}
                        sx={{ bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3d5be0' }, fontWeight: 700 }}>
                        Refresh Logs
                    </Button>
                </Stack>
            </Box>

            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, mb: 2.5 }}>
                <Box sx={{ p: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 240 }}>
                        <TextField fullWidth placeholder="Search by number, ID, or account name..."
                            value={search} onChange={e => setSearch(e.target.value)} size="small"
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                    </form>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={status} label="Status" onChange={e => { setStatus(e.target.value); setPage(1); }}>
                            {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
                <Divider />
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fc' }}>
                                {['ID', 'Account', 'Recipient Number', 'Message Preview', 'Status', 'Timestamp', 'Cost'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748b', py: 1.5 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading
                                ? Array.from({ length: 10 }).map((_, i) => (
                                    <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                                ))
                                : messages.length === 0
                                    ? <TableRow><TableCell colSpan={7}><EmptyState title="No messages found" description="Try changing the filters." /></TableCell></TableRow>
                                    : messages.map((m, i) => (
                                        <TableRow key={m.id ?? i} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { bgcolor: '#eef2ff' } }}>
                                            <TableCell sx={{ fontWeight: 600, color: '#4f6ef7', fontSize: '0.82rem' }}>#{m.id?.toString().slice(-4) ?? i}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>{m.accountName ?? 'Unknown'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{m.from || 'Default Mask'}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{m.to ?? m.recipient}</TableCell>
                                            <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>{truncate(m.body ?? m.message ?? '', 40)}</TableCell>
                                            <TableCell><StatusChip status={m.status} /></TableCell>
                                            <TableCell sx={{ color: '#64748b', fontSize: '0.8rem' }}>{formatDate(m.createdAt ?? m.timestamp)}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Rs. {parseFloat(m.creditCost ?? m.cost ?? '0').toFixed(4)}</TableCell>
                                        </TableRow>
                                    ))
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8f9fc', borderTop: '1px solid #e8eaf0' }}>
                    <Typography variant="caption" color="text.secondary">
                        Showing {Math.min((page - 1) * PER_PAGE + 1, total)}–{Math.min(page * PER_PAGE, total)} of {total} entries
                    </Typography>
                    <Pagination count={Math.max(1, Math.ceil(total / PER_PAGE))} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
                </Box>
            </Card>
        </Box>
    );
}
