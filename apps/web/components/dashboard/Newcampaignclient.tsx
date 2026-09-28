'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    Box, Card, Typography, TextField, Button, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
    Tabs, Tab, Divider, Chip, Paper, Skeleton,
} from '@mui/material';
import TagIcon from '@mui/icons-material/Tag';
import SendIcon from '@mui/icons-material/Send';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PeopleIcon from '@mui/icons-material/People';
import { CampaignsService } from '@/lib/services/campaigns.service';
import { SenderIdsService } from '@/lib/services/sender-ids.service';
import { ContactsService } from '@/lib/services/contacts.service';
import { useRouter } from 'next/navigation';

export default function NewCampaignClient() {
    const router = useRouter();
    const [senderIds, setSenderIds] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [loadingMeta, setLoadingMeta] = useState(true);

    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [senderId, setSenderId] = useState('');
    const [recipientTab, setRecipientTab] = useState(0);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [manualNumbers, setManualNumbers] = useState('');
    const [scheduled, setScheduled] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const messageRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        Promise.allSettled([
            SenderIdsService.getAll(),
            ContactsService.getGroups?.() ?? Promise.resolve([]),
        ]).then(([sRes, gRes]) => {
            if (sRes.status === 'fulfilled') {
                const d = sRes.value?.data ?? sRes.value ?? [];
                setSenderIds(Array.isArray(d) ? d.filter((s: any) => s.status === 'approved') : []);
            }
            if (gRes.status === 'fulfilled') {
                const d = gRes.value?.data ?? gRes.value ?? [];
                setGroups(Array.isArray(d) ? d : []);
            }
        }).finally(() => setLoadingMeta(false));
    }, []);

    const insertMergeTag = (tag: string) => {
        const el = messageRef.current;
        if (el) {
            const start = el.selectionStart ?? message.length;
            const end = el.selectionEnd ?? message.length;
            const newVal = message.slice(0, start) + tag + message.slice(end);
            setMessage(newVal);
            setTimeout(() => {
                el.setSelectionRange(start + tag.length, start + tag.length);
                el.focus();
            }, 0);
        } else {
            setMessage(m => m + tag);
        }
    };

    const segments = Math.ceil(message.length / 160) || 1;
    const recipientCount = recipientTab === 0
        ? groups.filter(g => selectedGroups.includes(g.id)).reduce((acc: number, g: any) => acc + (g.count ?? 0), 0)
        : manualNumbers.split('\n').filter(n => n.trim()).length;
    const estimatedCredits = recipientCount * segments;

    const handleSubmit = async () => {
        if (!name || !message) return;
        setLoading(true); setError(null);
        try {
            await CampaignsService.create({
                name,
                message,
                ...(senderId ? { senderId } : {}),
                recipients: recipientTab === 0
                    ? { groupIds: selectedGroups }
                    : { numbers: manualNumbers.split('\n').map(n => n.trim()).filter(Boolean) },
                ...(scheduled && scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
            } as any);
            setSuccess(true);
            setTimeout(() => router.push('/dashboard/campaigns'), 1500);
        } catch (err: any) {
            setError(err.message ?? 'Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 760, mx: 'auto' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={800}>New Campaign</Typography>
                <Typography variant="body2" color="text.secondary">Set up a new SMS campaign to reach your audience.</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Campaign created! Redirecting...</Alert>}

            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, p: 3, mb: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Campaign Details</Typography>
                <TextField
                    fullWidth label="Campaign Name" placeholder="e.g. April Newsletter"
                    value={name} onChange={e => setName(e.target.value)}
                    sx={{ mb: 2 }}
                />

                {loadingMeta ? <Skeleton height={56} sx={{ mb: 2 }} /> : (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Sender ID (optional)</InputLabel>
                        <Select value={senderId} label="Sender ID (optional)" onChange={e => setSenderId(e.target.value)}>
                            <MenuItem value=""><em>Default</em></MenuItem>
                            {senderIds.map(s => <MenuItem key={s.id} value={s.id}>{s.senderId ?? s.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                )}

                {/* Message with merge tags */}
                <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Message
                    </Typography>
                    <Typography variant="caption" color="text.secondary">— insert merge tags:</Typography>
                    {['{name}', '{phone}', '{company}'].map(tag => (
                        <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            icon={<TagIcon sx={{ fontSize: '12px !important' }} />}
                            onClick={() => insertMergeTag(tag)}
                            sx={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.75rem', '&:hover': { bgcolor: '#eef2ff' } }}
                        />
                    ))}
                </Box>
                <TextField
                    fullWidth multiline rows={5}
                    placeholder="Hi {name}, here's your exclusive offer..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    inputProps={{ ref: messageRef, maxLength: 918 }}
                    helperText={
                        <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{message.length} characters</span>
                            <span>{segments} segment{segments !== 1 ? 's' : ''} = {segments} credit{segments !== 1 ? 's' : ''} per recipient</span>
                        </Box>
                    }
                />
            </Card>

            {/* Recipients */}
            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, mb: 2.5 }}>
                <Box sx={{ px: 3, pt: 2.5, pb: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon sx={{ color: '#4f6ef7' }} />
                    <Typography variant="subtitle1" fontWeight={700}>Recipients</Typography>
                </Box>
                <Tabs
                    value={recipientTab} onChange={(_, v) => setRecipientTab(v)}
                    sx={{ px: 3, borderBottom: '1px solid #e8eaf0', '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}
                >
                    <Tab label="Select Groups" />
                    <Tab label="Enter Numbers Manually" />
                </Tabs>
                <Box sx={{ p: 3 }}>
                    {recipientTab === 0 ? (
                        loadingMeta ? <Skeleton height={80} /> : groups.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No contact groups found. Create groups in Contacts first.</Typography>
                        ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {groups.map(g => {
                                    const sel = selectedGroups.includes(g.id);
                                    return (
                                        <Chip
                                            key={g.id}
                                            label={`${g.name} (${g.count ?? 0})`}
                                            onClick={() => setSelectedGroups(prev => sel ? prev.filter(id => id !== g.id) : [...prev, g.id])}
                                            color={sel ? 'primary' : 'default'}
                                            sx={{ fontWeight: 600 }}
                                        />
                                    );
                                })}
                            </Box>
                        )
                    ) : (
                        <TextField
                            fullWidth multiline rows={5}
                            label="Phone Numbers"
                            placeholder={"+94771234567\n+94777654321\n+447700900077"}
                            value={manualNumbers} onChange={e => setManualNumbers(e.target.value)}
                            helperText={`One number per line — ${manualNumbers.split('\n').filter(n => n.trim()).length} recipients`}
                        />
                    )}
                </Box>
            </Card>

            {/* Schedule */}
            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, p: 3, mb: 2.5 }}>
                <FormControlLabel
                    control={<Switch checked={scheduled} onChange={e => setScheduled(e.target.checked)} />}
                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ScheduleIcon fontSize="small" />
                        <Typography fontWeight={600}>Schedule for later</Typography>
                    </Box>}
                />
                {scheduled && (
                    <TextField
                        fullWidth label="Send Date & Time" type="datetime-local"
                        value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                    />
                )}
            </Card>

            {/* Preview / cost estimate */}
            <Paper elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, p: 3, mb: 3, bgcolor: '#f8f9fc' }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Cost Estimate</Typography>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Recipients', value: recipientCount },
                        { label: 'Segments/msg', value: segments },
                        { label: 'Total Credits', value: estimatedCredits },
                    ].map(item => (
                        <Box key={item.label}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</Typography>
                            <Typography variant="h5" fontWeight={800} sx={{ color: '#4f6ef7' }}>{item.value}</Typography>
                        </Box>
                    ))}
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant="outlined" size="large" sx={{ fontWeight: 600, borderRadius: 2 }}
                    onClick={() => router.back()}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained" size="large"
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                    onClick={handleSubmit}
                    disabled={loading || !name || !message}
                    sx={{ flex: 1, fontWeight: 700, bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3d5be0' }, borderRadius: 2 }}
                >
                    {loading ? 'Creating...' : scheduled ? 'Schedule Campaign' : 'Launch Campaign'}
                </Button>
            </Box>
        </Box>
    );
}