'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Skeleton, IconButton, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Alert, CircularProgress, Divider,
    FormGroup, FormControlLabel, Checkbox, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckIcon from '@mui/icons-material/Check';
import { ApiKeysService } from '@/lib/services/api-keys.service';
import { formatDate } from '@/lib/utils';
import EmptyState from '@/components/ui/Emptystate';
import DataTable, { ColumnDef } from '../shared/DataTable';
import { useBranding } from '@/context/WhitelabelContext';

const PERMISSIONS = [
    { key: 'send_sms', label: 'Send SMS' },
    { key: 'view_messages', label: 'View Messages' },
    { key: 'manage_contacts', label: 'Manage Contacts' },
    { key: 'manage_campaigns', label: 'Manage Campaigns' },
    { key: 'view_reports', label: 'View Reports' },
];

export default function ApiKeysClient() {
    const { companyName } = useBranding();
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Generate dialog
    const [genOpen, setGenOpen] = useState(false);
    const [keyName, setKeyName] = useState('');
    const [permissions, setPermissions] = useState<string[]>(['send_sms', 'view_messages']);
    const [genLoading, setGenLoading] = useState(false);
    const [genError, setGenError] = useState<string | null>(null);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Revoke dialog
    const [revokeId, setRevokeId] = useState<string | null>(null);
    const [revokeLoading, setRevokeLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await ApiKeysService.getAll();
            const data = res?.data ?? res ?? [];
            setKeys(Array.isArray(data) ? data : []);
        } catch {
            setKeys([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleGenerate = async () => {
        if (!keyName) return;
        setGenLoading(true); setGenError(null);
        try {
            const res = await ApiKeysService.create({ name: keyName, permissions } as any);
            setNewKey(res?.key ?? res?.apiKey ?? null);
            setKeyName(''); setPermissions(['send_sms', 'view_messages']);
            load();
        } catch (err: any) {
            setGenError(err.message ?? 'Failed to generate key');
        } finally {
            setGenLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRevoke = async () => {
        if (!revokeId) return;
        setRevokeLoading(true);
        try {
            await ApiKeysService.revoke?.(revokeId) ?? await (ApiKeysService as any).delete?.(revokeId);
            setRevokeId(null);
            load();
        } catch { } finally {
            setRevokeLoading(false);
        }
    };

    const togglePermission = (p: string) => {
        setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    };

    
    const columns: ColumnDef<any>[] = [
        { id: 'name', label: 'Name', render: (k) => <span style={{ fontWeight: 700 }}>{k.name}</span> },
        { id: 'key', label: 'Key', render: (k) => (
            <Box sx={{ fontFamily: 'monospace', fontSize: '0.82rem', bgcolor: '#f1f3f9', px: 1, py: 0.3, borderRadius: 1, display: 'inline-block', color: '#4f6ef7' }}>
                {k.keyPrefix ?? k.key?.slice(0, 20) ?? 'sg_live_'}...
            </Box>
        ) },
        { id: 'permissions', label: 'Permissions', render: (k) => <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{(k.permissions ?? []).join(', ') || '-'}</span> },
        { id: 'lastUsed', label: 'Last Used', render: (k) => <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{k.lastUsed ? formatDate(k.lastUsed) : 'Never'}</span> },
        { id: 'created', label: 'Created', render: (k) => <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(k.createdAt)}</span> },
        { id: 'actions', label: 'Actions', render: (k) => (
            <Tooltip title="Revoke key">
                <IconButton size="small" sx={{ color: '#f44336' }} onClick={() => setRevokeId(k.id)}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        ) }
    ];

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>API Keys</Typography>
                    <Typography variant="body2" color="text.secondary">Manage API keys for programmatic access to SMSGate.</Typography>
                </Box>
                <Button
                    variant="contained" startIcon={<AddIcon />}
                    onClick={() => { setGenOpen(true); setNewKey(null); setGenError(null); }}
                    sx={{ bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3d5be0' }, fontWeight: 700, borderRadius: 2 }}
                >
                    Generate New Key
                </Button>
            </Box>

            {/* Quick Start Integration Snippets */}
            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, mb: 3, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#1a1f36', p: 3, color: '#fff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <VpnKeyIcon fontSize="small" sx={{ color: '#7ee8a2' }} /> Quick Start Integration
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, maxWidth: 600 }}>
                                Use the snippet below to send your first message. Replace <code>YOUR_API_KEY</code> with a key generated below.
                            </Typography>
                        </Box>
                          <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => window.open(`${process.env.NEXT_PUBLIC_DOCS_URL || 'http://localhost:4321'}?endpoint=${encodeURIComponent(window.location.origin.replace('//', '//api.'))}&brand=${encodeURIComponent(companyName)}`, '_blank')}
                              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', '&:hover': { borderColor: '#fff' }, textTransform: 'none' }}
                          >
                            View Full Documentation
                        </Button>
                    </Box>

                    <Box sx={{ mt: 3, bgcolor: '#0f1322', borderRadius: 2, p: 2, position: 'relative', overflowX: 'auto' }}>
                        <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#e2e8f0', margin: 0 }}>
                            {`curl \${typeof window !== 'undefined' ? window.location.origin.replace('//', '//api.') : 'https://api.yourdomain.com'}/api/v1/sms/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+94771234567",
    "body": "Hello from the API!"
  }'`}
                        </Typography>
                    </Box>
                </Box>
            </Card>

            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
                <Box sx={{ p: -2 }}><DataTable columns={columns} data={keys} loading={loading} emptyMessage="Generate your first key to start using the API." /></Box>
            </Card>

            {/* Generate Key Dialog */}
            <Dialog open={genOpen} onClose={() => !genLoading && setGenOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VpnKeyIcon sx={{ color: '#4f6ef7' }} /> Generate New API Key
                </DialogTitle>
                <DialogContent>
                    {genError && <Alert severity="error" sx={{ mb: 2 }}>{genError}</Alert>}

                    {newKey ? (
                        <Box>
                            <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                                <strong>Save this key now.</strong> It will never be shown again.
                            </Alert>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: '#1a1f36', borderRadius: 2, position: 'relative' }}>
                                <Typography
                                    sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#7ee8a2', wordBreak: 'break-all', pr: 5 }}
                                >
                                    {newKey}
                                </Typography>
                                <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopy(newKey)}
                                        sx={{ position: 'absolute', top: 8, right: 8, color: copied ? '#7ee8a2' : '#94a3b8' }}
                                    >
                                        {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                            </Paper>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                Copy and store this key in a secure location such as a password manager or environment variable.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <TextField
                                fullWidth label="Key Name" placeholder="e.g. Production Server"
                                value={keyName} onChange={e => setKeyName(e.target.value)}
                                margin="normal" autoFocus
                            />
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2, mb: 1 }}>Permissions</Typography>
                            <FormGroup>
                                {PERMISSIONS.map(p => (
                                    <FormControlLabel
                                        key={p.key}
                                        control={<Checkbox checked={permissions.includes(p.key)} onChange={() => togglePermission(p.key)} size="small" />}
                                        label={<Typography variant="body2">{p.label}</Typography>}
                                    />
                                ))}
                            </FormGroup>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setGenOpen(false)}>
                        {newKey ? 'Close' : 'Cancel'}
                    </Button>
                    {!newKey && (
                        <Button
                            variant="contained" onClick={handleGenerate}
                            disabled={genLoading || !keyName || permissions.length === 0}
                            sx={{ bgcolor: '#4f6ef7', fontWeight: 700 }}
                        >
                            {genLoading ? <CircularProgress size={18} color="inherit" /> : 'Generate Key'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Revoke Confirm Dialog */}
            <Dialog open={!!revokeId} onClose={() => setRevokeId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Revoke API Key?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        This action is irreversible. Any application using this key will immediately lose access.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setRevokeId(null)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleRevoke} disabled={revokeLoading} sx={{ fontWeight: 700 }}>
                        {revokeLoading ? <CircularProgress size={18} color="inherit" /> : 'Revoke Key'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}