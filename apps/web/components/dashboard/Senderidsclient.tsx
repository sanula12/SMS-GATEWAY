'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Skeleton, IconButton, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Alert, CircularProgress, Chip,
    Grid, Link
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { SenderIdsService } from '@/lib/services/sender-ids.service';
import { StorageService } from '@/lib/services/storage.service';
import StatusChip from '@/components/ui/Statuschip';
import EmptyState from '@/components/ui/Emptystate';
import { formatDate } from '@/lib/utils';
import DataTable, { ColumnDef } from '../shared/DataTable';

export default function SenderIdsClient() {
    const [senderIds, setSenderIds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Request dialog
    const [open, setOpen] = useState(false);
    const [senderId, setSenderId] = useState('');
    const [nicFile, setNicFile] = useState<File | null>(null);
    const [brFile, setBrFile] = useState<File | null>(null);
    const [reqLetterFile, setReqLetterFile] = useState<File | null>(null);

    const [reqLoading, setReqLoading] = useState(false);
    const [reqError, setReqError] = useState<string | null>(null);
    const [reqSuccess, setReqSuccess] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await SenderIdsService.getAll();
            const data = res?.data ?? res ?? [];
            setSenderIds(Array.isArray(data) ? data : []);
        } catch {
            setSenderIds([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleRequest = async () => {
        if (!senderId) {
            setReqError("Sender ID is required.");
            return;
        }
        if (!nicFile || !brFile || !reqLetterFile) {
            setReqError("All three supporting documents are required.");
            return;
        }

        setReqLoading(true); setReqError(null); setReqSuccess(false);
        try {
            // 1. Upload files
            const nicRes = await StorageService.uploadDocument(nicFile, 'sender-ids');
            const brRes = await StorageService.uploadDocument(brFile, 'sender-ids');
            const reqRes = await StorageService.uploadDocument(reqLetterFile, 'sender-ids');

            // 2. Submit request
            await SenderIdsService.create({ 
                senderId, 
                country: 'LK',
                nicUrl: nicRes.url,
                brUrl: brRes.url,
                requestLetterUrl: reqRes.url
            });

            setReqSuccess(true);
            setSenderId(''); 
            setNicFile(null); setBrFile(null); setReqLetterFile(null);
            setTimeout(() => { setOpen(false); setReqSuccess(false); load(); }, 2000);
        } catch (err: any) {
            setReqError(err.response?.data?.message || err.message || 'Failed to request Sender ID');
        } finally {
            setReqLoading(false);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await SenderIdsService.setDefault(id);
            setSenderIds(prev => prev.map(s => ({ ...s, isDefault: s.id === id })));
        } catch { }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this Sender ID?')) return;
        try {
            await SenderIdsService.remove(id);
            load();
        } catch { }
    };

    const renderFileUploader = (label: string, file: File | null, setFile: (f: File | null) => void) => (
        <Box sx={{ border: '1px dashed #c8d0e8', borderRadius: 2, p: 2, textAlign: 'center', bgcolor: '#fafafa', position: 'relative' }}>
            {file ? (
                <Box>
                    <Typography variant="body2" fontWeight={600} color="success.main" noWrap>
                        {file.name}
                    </Typography>
                    <Typography variant="caption" sx={{ cursor: 'pointer', color: 'error.main', textDecoration: 'underline' }} onClick={() => setFile(null)}>
                        Remove
                    </Typography>
                </Box>
            ) : (
                <>
                    <UploadFileIcon sx={{ color: '#a0abce', mb: 1 }} />
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                        {label}
                    </Typography>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    />
                </>
            )}
        </Box>
    );

    
    const columns: ColumnDef<any>[] = [
        { id: 'senderId', label: 'Sender ID', render: (s) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{s.senderId}</span>
                {s.status === 'approved' && (
                    <Tooltip title={s.isDefault ? "Default Sender ID" : "Set as Default"}>
                        <IconButton
                            size="small"
                            onClick={() => handleSetDefault(s.id)}
                            
                            sx={{ color: s.isDefault ? '#fbbf24' : '#e5e7eb', p: 0.5 }}
                        >
                            {s.isDefault ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        ) },
        { id: 'status', label: 'Status', render: (s) => <StatusChip status={s.status} /> },
        { id: 'dateRequested', label: 'Date Requested', render: (s) => <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>{formatDate(s.createdAt)}</span> },
        { id: 'actions', label: 'Actions', render: (s) => (
            <Tooltip title="Delete">
                <IconButton size="small" onClick={() => handleDelete(s.id)}  sx={{ color: '#f44336' }}>
                    {<DeleteIcon fontSize="small" />}
                </IconButton>
            </Tooltip>
        ) }
    ];

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Sender IDs</Typography>
                    <Typography variant="body2" color="text.secondary">Manage the names or numbers that appear as the SMS sender.</Typography>
                </Box>
                <Button
                    variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
                    sx={{ bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3d5be0' }, fontWeight: 700, borderRadius: 2 }}
                >
                    Request New Sender ID
                </Button>
            </Box>

            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
                <Box sx={{ p: -2 }}><DataTable columns={columns} data={senderIds} loading={loading} emptyMessage="Request your first Sender ID to get started." /></Box>
            </Card>

            {/* Request Dialog */}
            <Dialog open={open} onClose={() => !reqLoading && setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Request Sender ID</DialogTitle>
                <DialogContent dividers>
                    {reqError && <Alert severity="error" sx={{ mb: 2 }}>{reqError}</Alert>}
                    {reqSuccess && <Alert severity="success" sx={{ mb: 2 }}>Sender ID submitted and documents uploaded successfully! Waiting for review.</Alert>}
                    
                    <TextField
                        fullWidth label="Sender ID" placeholder="e.g. MyBrand"
                        value={senderId} onChange={e => setSenderId(e.target.value.slice(0, 11))}
                        margin="normal" autoFocus
                        helperText={`${senderId.length}/11 characters — alphanumeric only, no spaces`}
                    />
                    
                    <Box sx={{ mt: 3, mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>Required Documents</Typography>
                        <Typography variant="caption" color="text.secondary">Please attach the following to verify your business identity.</Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            {renderFileUploader('NIC Copy', nicFile, setNicFile)}
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            {renderFileUploader('Business Reg (BR)', brFile, setBrFile)}
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            {renderFileUploader('Request Letter', reqLetterFile, setReqLetterFile)}
                            <Box sx={{ textAlign: 'center', mt: 1 }}>
                                <Link href="/TRCSL_Sender_ID_Request_Letter_Template.docx" target="_blank" download="TRCSL_Sender_ID_Request_Letter_Template.docx" variant="caption" sx={{ fontWeight: 600 }}>
                                    Download Template
                                </Link>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8f9fc' }}>
                    <Button onClick={() => setOpen(false)} disabled={reqLoading}>Cancel</Button>
                    <Button variant="contained" onClick={handleRequest}
                        disabled={reqLoading || !senderId || !nicFile || !brFile || !reqLetterFile || reqSuccess}
                        sx={{ bgcolor: '#4f6ef7', fontWeight: 700 }}>
                        {reqLoading ? <CircularProgress size={18} color="inherit" /> : 'Submit Request'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

