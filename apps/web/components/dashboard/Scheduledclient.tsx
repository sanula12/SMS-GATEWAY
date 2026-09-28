'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    Box, Card, Typography, Button, IconButton, Tooltip, Alert,
    Chip, Paper, CircularProgress, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import NextLink from 'next/link';
import * as XLSX from 'xlsx';
import { SchedulerService } from '@/lib/services/scheduler.service';
import { SenderIdsService } from '@/lib/services/sender-ids.service';
import StatusChip from '@/components/ui/Statuschip';
import { formatDate, truncate } from '@/lib/utils';
import DataTable, { ColumnDef } from '../shared/DataTable';

interface ImportResult {
    scheduled: number;
    skipped: number;
    errors: string[];
}

export default function ScheduledClient() {
    const [scheduled, setScheduled] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Sender IDs
    const [senderIds, setSenderIds] = useState<any[]>([]);
    const [senderId, setSenderId] = useState('');

    // Excel import state
    const [dragOver, setDragOver] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await SchedulerService.getScheduled();
            const data = res?.data ?? res ?? [];
            setScheduled(Array.isArray(data) ? data : []);
        } catch {
            setScheduled([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        SenderIdsService.getAll()
            .then(res => {
                const data = res?.data ?? res ?? [];
                setSenderIds(Array.isArray(data) ? data.filter((s: any) => s.status === 'approved') : []);
            })
            .catch(() => setSenderIds([]));
    }, []);

    const handleCancel = async (id: string) => {
        if (!confirm('Cancel this scheduled message?')) return;
        try {
            await SchedulerService.cancel(id);
            load();
        } catch (err: any) {
            alert(err?.response?.data?.message ?? 'Failed to cancel message');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            setImportFile(file);
            setImportResult(null);
            setImportError(null);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImportFile(file);
            setImportResult(null);
            setImportError(null);
        }
    };

    const handleDownloadTemplate = () => {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const sampleDate = tomorrow.toISOString().slice(0, 16).replace('T', ' ');

        const templateData = [
            {
                phone: '+94771234567',
                name: 'John Doe',
                message: 'Hello {name}, your appointment is confirmed!',
                send_at: sampleDate,
            },
            {
                phone: '+94712345678',
                name: 'Jane Smith',
                message: 'Hi {name}, thank you for your order.',
                send_at: sampleDate,
            },
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        ws['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 48 }, { wch: 22 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
        XLSX.writeFile(wb, 'scheduled_sms_template.xlsx');
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        setImportResult(null);
        setImportError(null);
        try {
            const res = await SchedulerService.importExcel(importFile, senderId || undefined);
            setImportResult(res ?? { scheduled: 0, skipped: 0, errors: [] });
            setImportFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            load();
        } catch (err: any) {
            setImportError(err?.response?.data?.message ?? err.message ?? 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    const columns: ColumnDef<any>[] = [
        { id: 'to', label: 'To', render: (s) => <span style={{ fontWeight: 600 }}>{s.to ?? s.recipient}</span> },
        { id: 'preview', label: 'Message Preview', render: (s) => <span style={{ color: '#475569', fontSize: '0.85rem' }}>{truncate(s.body ?? s.message ?? '', 55)}</span> },
        { id: 'scheduledFor', label: 'Scheduled For', render: (s) => <span style={{ color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(s.scheduledAt)}</span> },
        { id: 'status', label: 'Status', render: (s) => <StatusChip status={s.status ?? 'queued'} /> },
        {
            id: 'actions', label: 'Action', render: (s) => (
                s.status === 'queued' ? (
                    <Tooltip title="Cancel">
                        <IconButton size="small" sx={{ color: '#f44336' }} onClick={() => handleCancel(s.id)}>
                            <CancelIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                ) : null
            )
        }
    ];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Scheduled Messages</Typography>
                    <Typography variant="body2" color="text.secondary">Messages queued for future delivery.</Typography>
                </Box>
                <Button
                    component={NextLink} href="/dashboard/send"
                    variant="contained" startIcon={<AddIcon />}
                    sx={{ bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3d5be0' }, fontWeight: 700, borderRadius: 2 }}
                >
                    Schedule New
                </Button>
            </Box>

            {/* Scheduled Messages Table */}
            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, mb: 3 }}>
                <Box sx={{ p: -2 }}>
                    <DataTable
                        columns={columns}
                        data={scheduled}
                        loading={loading}
                        emptyMessage="No scheduled messages found. Schedule a message to see it here."
                    />
                </Box>
            </Card>

            {/* Excel Import Section */}
            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
                <Box sx={{ px: 3, py: 2.5 }}>
                    {/* Section Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <UploadFileIcon sx={{ color: '#4f6ef7' }} />
                            <Typography variant="h6" fontWeight={700}>Import Excel Schedule</Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadTemplate}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#4f6ef7', color: '#4f6ef7' }}
                        >
                            Download Template
                        </Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Upload an Excel file to schedule bulk SMS messages. Each row becomes a separately scheduled message.
                    </Typography>

                    {/* Required Columns Info */}
                    <Paper elevation={0} sx={{ bgcolor: '#f8f9fc', border: '1px solid #e8eaf0', borderRadius: 2, p: 2, mb: 2.5 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Required Column Headers
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {['phone', 'message', 'send_at'].map(col => (
                                <Chip
                                    key={col}
                                    label={col}
                                    size="small"
                                    sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: '#eef2ff', color: '#4f6ef7', fontSize: '0.8rem' }}
                                />
                            ))}
                            {['name (optional)'].map(col => (
                                <Chip
                                    key={col}
                                    label={col}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontFamily: 'monospace', fontWeight: 600, borderColor: '#94a3b8', color: '#64748b', fontSize: '0.8rem' }}
                                />
                            ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            <code>send_at</code> format: <code>YYYY-MM-DD HH:MM</code> or ISO 8601 (e.g. <code>2026-04-01T09:00:00Z</code>).
                            Use <code>{'{name}'}</code> in your message to personalise per row.
                        </Typography>
                    </Paper>

                    {/* Sender ID selector - required */}
                    <FormControl fullWidth size="small" required sx={{ mb: 2 }}>
                        <InputLabel>Sender ID *</InputLabel>
                        <Select
                            value={senderId}
                            label="Sender ID *"
                            onChange={e => setSenderId(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            {senderIds.length === 0 && (
                                <MenuItem disabled value="">
                                    {senderIds.length === 0 ? 'No approved sender IDs found' : 'Loading...'}
                                </MenuItem>
                            )}
                            {senderIds.map((s: any) => (
                                <MenuItem key={s.id} value={s.senderId ?? s.id}>
                                    {s.senderId}
                                    {s.isDefault && <Chip label="Default" size="small" sx={{ ml: 1, height: 18, fontSize: '0.7rem', bgcolor: '#eef2ff', color: '#4f6ef7' }} />}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Drop zone */}
                    <Box
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                            border: `2px dashed ${dragOver ? '#4f6ef7' : importFile ? '#4caf50' : '#c8d0e8'}`,
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            bgcolor: dragOver ? '#eef2ff' : importFile ? '#f1f8e9' : '#fafbff',
                            '&:hover': { borderColor: '#4f6ef7', bgcolor: '#eef2ff' },
                        }}
                    >
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleFileInput} />
                        <CloudUploadIcon sx={{ fontSize: 44, color: importFile ? '#4caf50' : '#94a3b8', mb: 1 }} />
                        {importFile ? (
                            <>
                                <Typography variant="body1" fontWeight={700} sx={{ color: '#4caf50' }}>{importFile.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{(importFile.size / 1024).toFixed(1)} KB — click to change</Typography>
                            </>
                        ) : (
                            <>
                                <Typography variant="body1" fontWeight={600} color="text.secondary">Drop your .xlsx file here</Typography>
                                <Typography variant="caption" color="text.secondary">or click to browse</Typography>
                            </>
                        )}
                    </Box>

                    {/* Error alert */}
                    {importError && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{importError}</Alert>}

                    {/* Success result */}
                    {importResult && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f1f8e9', border: '1px solid #a5d6a7', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: importResult.errors.length > 0 ? 1.5 : 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#2e7d32' }}>
                                    <CheckCircleIcon fontSize="small" />
                                    <Typography variant="body2" fontWeight={700}>{importResult.scheduled} scheduled</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b' }}>
                                    <Typography variant="body2">{importResult.skipped} skipped</Typography>
                                </Box>
                            </Box>
                            {importResult.errors.length > 0 && (
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <ErrorIcon sx={{ fontSize: 14 }} /> {importResult.errors.length} errors:
                                    </Typography>
                                    {importResult.errors.map((e, i) => (
                                        <Typography key={i} variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2 }}>• {e}</Typography>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Upload button */}
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={importing ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
                        onClick={handleImport}
                        disabled={importing || !importFile || !senderId}
                        sx={{ mt: 2.5, py: 1.4, fontWeight: 700, bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3d5be0' }, borderRadius: 2 }}
                    >
                        {importing ? 'Importing...' : 'Upload & Schedule'}
                    </Button>
                </Box>
            </Card>
        </Box>
    );
}