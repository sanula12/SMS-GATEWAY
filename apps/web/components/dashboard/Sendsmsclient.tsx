'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
    Box, Card, Typography, Tabs, Tab, TextField, Button, CircularProgress,
    Alert, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
    Divider, Skeleton, Grid, Avatar, Menu, IconButton, Tooltip, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmsIcon from '@mui/icons-material/Sms';
import GroupIcon from '@mui/icons-material/Group';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ContactsIcon from '@mui/icons-material/Contacts';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { SmsService } from '@/lib/services/sms.service';
import { SenderIdsService } from '@/lib/services/sender-ids.service';
import { ContactsService } from '@/lib/services/contacts.service';
import { useAuth } from '@/context/AuthContext';

function charInfo(text: string) {
    const len = text.length;
    const segments = Math.ceil(len / 160) || 1;
    return { len, segments };
}

export default function SendSmsClient() {
    const { user, updateUser } = useAuth();
    const [tab, setTab] = useState(0);
    const [senderIds, setSenderIds] = useState<any[]>([]);
    const [loadingSenders, setLoadingSenders] = useState(true);
    
    // Groups state for Merge Fields
    const [groups, setGroups] = useState<any[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);

    // Single SMS state
    const [sTo, setSTo] = useState('');
    const [sSenderId, setSSenderId] = useState('');
    const [sBody, setSBody] = useState('');
    const [sScheduled, setSScheduled] = useState(false);
    const [sScheduledAt, setSScheduledAt] = useState('');
    const [sLoading, setSLoading] = useState(false);
    const [sError, setSError] = useState<string | null>(null);
    const [sSuccess, setSSuccess] = useState(false);

    // Bulk SMS state
    const [bImportMethod, setBImportMethod] = useState<'paste' | 'group'>('paste');
    const [bGroupId, setBGroupId] = useState('');
    const [bNumbers, setBNumbers] = useState('');
    const [bSenderId, setBSenderId] = useState('');
    const [bBody, setBBody] = useState('');
    const [bCampaign, setBCampaign] = useState('');
    const [bScheduled, setBScheduled] = useState(false);
    const [bScheduledAt, setBScheduledAt] = useState('');
    const [bLoading, setBLoading] = useState(false);
    const [bError, setBError] = useState<string | null>(null);
    const [bSuccess, setBSuccess] = useState(false);

    // Merge Fields Menu
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const premiumShadow = '0px 2px 4px rgba(0, 0, 0, 0.04), 0px 4px 6px rgba(0, 0, 0, 0.02)';

    useEffect(() => {
        SenderIdsService.getAll()
            .then(res => {
                const data = res?.data ?? res ?? [];
                setSenderIds(Array.isArray(data) ? data.filter((s: any) => s.status === 'approved') : []);
            })
            .catch(() => setSenderIds([]))
            .finally(() => setLoadingSenders(false));

        ContactsService.getGroups()
            .then(res => {
                const data = res?.data ?? res ?? [];
                setGroups(Array.isArray(data) ? data : []);
            })
            .catch(() => setGroups([]))
            .finally(() => setLoadingGroups(false));
    }, []);

    const handleSingleSend = async () => {
        if (!sTo || !sBody) return;
        setSLoading(true); setSError(null); setSSuccess(false);
        try {
            await SmsService.sendSingle({
                to: sTo,
                body: sBody,
                ...(sSenderId ? { from: sSenderId } : {}),
                ...(sScheduled && sScheduledAt ? { scheduledAt: new Date(sScheduledAt).toISOString() } : {}),
            } as any);
            setSSuccess(true);
            setSTo(''); setSBody(''); setSScheduledAt('');
        } catch (err: any) {
            setSError(err.message ?? 'Failed to send message');
        } finally {
            setSLoading(false);
        }
    };

    const handleBulkSend = async () => {
        if (bImportMethod === 'paste') {
            const numbers = bNumbers.split(/[\n, ]+/).map(n => n.trim()).filter(Boolean);
            if (!numbers.length || !bBody) return;
            setBLoading(true); setBError(null); setBSuccess(false);
            try {
                await SmsService.sendBulk({
                    to: numbers,
                    body: bBody,
                    ...(bSenderId ? { from: bSenderId } : {}),
                    ...(bCampaign ? { campaignName: bCampaign } : {}),
                    ...(bScheduled && bScheduledAt ? { scheduledAt: new Date(bScheduledAt).toISOString() } : {}),
                } as any);
                setBSuccess(true);
                setBNumbers(''); setBBody(''); setBCampaign(''); setBScheduledAt('');
            } catch (err: any) {
                setBError(err.message ?? 'Failed to send bulk messages');
            } finally {
                setBLoading(false);
            }
        } else {
            if (!bGroupId || !bBody) return;
            setBLoading(true); setBError(null); setBSuccess(false);
            try {
                await SmsService.sendBulk({
                    groupId: bGroupId,
                    body: bBody,
                    ...(bSenderId ? { from: bSenderId } : {}),
                    ...(bCampaign ? { campaignName: bCampaign } : {}),
                    ...(bScheduled && bScheduledAt ? { scheduledAt: new Date(bScheduledAt).toISOString() } : {}),
                } as any);
                setBSuccess(true);
                setBBody(''); setBCampaign(''); setBScheduledAt('');
            } catch (err: any) {
                setBError(err.message ?? 'Failed to send bulk messages');
            } finally {
                setBLoading(false);
            }
        }
    };

    const insertMergeField = (field: string) => {
        setBBody(prev => prev + `{${field}}`);
        setAnchorEl(null);
    };

    const isSingle = tab === 0;
    const bodyText = isSingle ? sBody : bBody;
    const info = charInfo(bodyText);
    
    let recipientCount = 0;
    if (isSingle) {
        recipientCount = sTo ? 1 : 0;
    } else {
        if (bImportMethod === 'paste') {
            recipientCount = bNumbers.split(/[\n, ]+/).filter(n => n.trim()).length;
        } else {
            const grp = groups.find(g => g.id === bGroupId);
            recipientCount = grp ? grp.count : 0;
        }
    }
    
    const totalCost = recipientCount * info.segments;
    const currentBalance = parseFloat(user?.creditBalance || '0');
    const safeToSend = totalCost <= currentBalance;
    const isUsingMergeFields = !isSingle && bImportMethod === 'group' && (bBody.includes('{FIRSTNAME}') || bBody.includes('{LASTNAME}') || bBody.includes('{EMAIL}') || bBody.includes('{CUSTOM1}') || bBody.includes('{CUSTOM2}'));

    return (
        <Box sx={{ maxWidth: '100%', pb: 6, pt: 1 }}>
            {/* 1. The Hero Banner */}
            <Card elevation={0} sx={{ 
                p: { xs: 3, sm: 4 }, mb: 4, borderRadius: 3, 
                background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                color: '#fff', boxShadow: premiumShadow,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3
            }}>
                <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                        SMS Dispatcher
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2rem' }, fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5, lineHeight: 1.2 }}>
                        Send SMS Messages
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#D1D5DB' }}>
                        Configure and dispatch single or high-volume messages globally.
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>
                        Wallet Balance
                    </Typography>
                    <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', lineHeight: 1.2 }}>
                        Rs. {currentBalance.toFixed(2)}
                    </Typography>
                </Box>
            </Card>

            <Grid container spacing={3}>
                {/* LEFT COLUMN: The Dispatch Form */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, overflow: 'hidden' }}>
                        <Tabs
                            value={tab}
                            onChange={(_, v) => setTab(v)}
                            sx={{
                                px: 2, pt: 1, bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
                                '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.85rem', minHeight: 48 },
                                '& .Mui-selected': { color: '#111827 !important' },
                                '& .MuiTabs-indicator': { bgcolor: '#111827' }
                            }}
                        >
                            <Tab icon={<SmsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Single SMS" />
                            <Tab icon={<GroupIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Bulk Campaign" />
                        </Tabs>

                        <Box sx={{ p: 3 }}>
                            {isSingle ? (
                                // --- SINGLE SMS TAB ---
                                <>
                                    {sError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{sError}</Alert>}
                                    {sSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Message queued for delivery.</Alert>}
                                    
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', mb: 1 }}>Recipient Number</Typography>
                                            <TextField
                                                fullWidth size="small" placeholder="+94771234567"
                                                value={sTo} onChange={e => setSTo(e.target.value)}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', mb: 1 }}>Sender ID</Typography>
                                            {loadingSenders ? (
                                                <Skeleton height={40} sx={{ borderRadius: 2 }} />
                                            ) : (
                                                <FormControl fullWidth size="small">
                                                    <Select value={sSenderId} displayEmpty onChange={e => setSSenderId(e.target.value)} sx={{ borderRadius: 2 }}>
                                                        <MenuItem value=""><em>System Default</em></MenuItem>
                                                        {senderIds.map(s => <MenuItem key={s.id} value={s.senderId}>{s.senderId ?? s.name}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mt: 3 }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', mb: 1 }}>Message Content</Typography>
                                        <TextField
                                            fullWidth multiline rows={5} placeholder="Type your message..."
                                            value={sBody} onChange={e => setSBody(e.target.value)}
                                            inputProps={{ maxLength: 918 }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Box>

                                    <Divider sx={{ my: 3, borderColor: '#F3F4F6' }} />
                                    <FormControlLabel
                                        control={<Switch size="small" checked={sScheduled} onChange={e => setSScheduled(e.target.checked)} color="primary" />}
                                        label={<Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>Schedule this message</Typography>}
                                    />
                                    {sScheduled && (
                                        <Box sx={{ mt: 2 }}>
                                            <TextField
                                                size="small" type="datetime-local"
                                                value={sScheduledAt} onChange={e => setSScheduledAt(e.target.value)}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            />
                                        </Box>
                                    )}
                                </>
                            ) : (
                                // --- BULK SMS TAB ---
                                <>
                                    {bError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{bError}</Alert>}
                                    {bSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Bulk campaign queued successfully.</Alert>}
                                    
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', mb: 1 }}>Campaign Name</Typography>
                                            <TextField
                                                fullWidth size="small" placeholder="e.g. Flash Sale"
                                                value={bCampaign} onChange={e => setBCampaign(e.target.value)}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', mb: 1 }}>Sender ID</Typography>
                                            {loadingSenders ? (
                                                <Skeleton height={40} sx={{ borderRadius: 2 }} />
                                            ) : (
                                                <FormControl fullWidth size="small">
                                                    <Select value={bSenderId} displayEmpty onChange={e => setBSenderId(e.target.value)} sx={{ borderRadius: 2 }}>
                                                        <MenuItem value=""><em>System Default</em></MenuItem>
                                                        {senderIds.map(s => <MenuItem key={s.id} value={s.senderId}>{s.senderId ?? s.name}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        </Grid>
                                    </Grid>
                                    
                                    <Divider sx={{ my: 3, borderColor: '#F3F4F6' }} />

                                    <Box sx={{ mb: 3 }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', mb: 1 }}>Import Method</Typography>
                                        <ToggleButtonGroup
                                            color="primary"
                                            value={bImportMethod}
                                            exclusive
                                            onChange={(_, val) => { if (val) setBImportMethod(val); }}
                                            size="small"
                                            sx={{ mb: 2, display: 'flex' }}
                                        >
                                            <ToggleButton value="paste" sx={{ flex: 1, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }}>Paste Numbers</ToggleButton>
                                            <ToggleButton value="group" sx={{ flex: 1, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }}>Select Contact Group</ToggleButton>
                                        </ToggleButtonGroup>

                                        {bImportMethod === 'paste' ? (
                                            <TextField
                                                fullWidth multiline rows={4} placeholder="+94771234567&#10;+447700900077"
                                                value={bNumbers} onChange={e => setBNumbers(e.target.value)}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            />
                                        ) : (
                                            <FormControl fullWidth size="small">
                                                {loadingGroups ? (
                                                    <Skeleton height={40} sx={{ borderRadius: 2 }} />
                                                ) : (
                                                    <Select value={bGroupId} displayEmpty onChange={e => setBGroupId(e.target.value)} sx={{ borderRadius: 2 }}>
                                                        <MenuItem value="" disabled><em>Select a group...</em></MenuItem>
                                                        {groups.map(g => (
                                                            <MenuItem key={g.id} value={g.id}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                                    <span>{g.name}</span>
                                                                    <Typography variant="caption" color="text.secondary">{g.count} contacts</Typography>
                                                                </Box>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                )}
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                                    Need to import an Excel/CSV file? Do it from the <a href="/dashboard/contacts" style={{ color: '#4f46e5', textDecoration: 'none' }}>Contacts page</a> first.
                                                </Typography>
                                            </FormControl>
                                        )}
                                    </Box>

                                    <Box sx={{ mt: 3, position: 'relative' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Message Content</Typography>
                                            
                                            {/* Merge Fields Button */}
                                            {bImportMethod === 'group' && (
                                                <Button 
                                                    size="small" 
                                                    startIcon={<ContactsIcon sx={{ fontSize: 16 }} />}
                                                    onClick={(e) => setAnchorEl(e.currentTarget)}
                                                    sx={{ textTransform: 'none', fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', py: 0 }}
                                                >
                                                    Merge Fields
                                                </Button>
                                            )}
                                        </Box>
                                        
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl)}
                                            onClose={() => setAnchorEl(null)}
                                            PaperProps={{ elevation: 0, sx: { border: '1px solid #E5E7EB', boxShadow: premiumShadow, borderRadius: 2, minWidth: 150 } }}
                                        >
                                            <MenuItem onClick={() => insertMergeField('FIRSTNAME')} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{'{FIRSTNAME}'}</MenuItem>
                                            <MenuItem onClick={() => insertMergeField('LASTNAME')} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{'{LASTNAME}'}</MenuItem>
                                            <MenuItem onClick={() => insertMergeField('EMAIL')} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{'{EMAIL}'}</MenuItem>
                                            <Divider sx={{ my: 0.5 }} />
                                            <MenuItem onClick={() => insertMergeField('CUSTOM1')} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{'{CUSTOM1}'}</MenuItem>
                                            <MenuItem onClick={() => insertMergeField('CUSTOM2')} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{'{CUSTOM2}'}</MenuItem>
                                        </Menu>

                                        <TextField
                                            inputRef={textareaRef}
                                            fullWidth multiline rows={5} placeholder="Type your message..."
                                            value={bBody} onChange={e => setBBody(e.target.value)}
                                            inputProps={{ maxLength: 918 }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Box>

                                    <Divider sx={{ my: 3, borderColor: '#F3F4F6' }} />
                                    <FormControlLabel
                                        control={<Switch size="small" checked={bScheduled} onChange={e => setBScheduled(e.target.checked)} color="primary" />}
                                        label={<Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>Schedule this campaign</Typography>}
                                    />
                                    {bScheduled && (
                                        <Box sx={{ mt: 2 }}>
                                            <TextField
                                                size="small" type="datetime-local"
                                                value={bScheduledAt} onChange={e => setBScheduledAt(e.target.value)}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            />
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    </Card>
                </Grid>

                {/* RIGHT COLUMN: Dispatch Summary */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, bgcolor: '#F9FAFB', position: 'sticky', top: 24 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <InfoOutlinedIcon sx={{ color: '#4f46e5' }} />
                            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Dispatch Summary</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography sx={{ fontSize: '0.85rem', color: '#6B7280' }}>Recipients</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>{recipientCount.toLocaleString()}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography sx={{ fontSize: '0.85rem', color: '#6B7280' }}>Segments per Message</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                                    {isUsingMergeFields ? '~' : ''}{info.segments}
                                </Typography>
                                {info.segments > 1 && (
                                    <Box sx={{ bgcolor: '#FEF3C7', color: '#D97706', px: 1, py: 0.2, borderRadius: 1, fontSize: '0.65rem', fontWeight: 700 }}>MULTIPART</Box>
                                )}
                            </Box>
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF', textAlign: 'right', mb: 2 }}>
                            {isUsingMergeFields ? 'Variables will affect final length' : `${info.len} characters`}
                        </Typography>

                        <Divider sx={{ my: 2, borderColor: '#E5E7EB' }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                                {isUsingMergeFields ? 'Estimated Cost' : 'Total Credit Cost'}
                            </Typography>
                            <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: totalCost > 0 ? '#4f46e5' : '#111827' }}>
                                {isUsingMergeFields ? '~' : ''}{totalCost.toLocaleString()}
                            </Typography>
                        </Box>

                        {!safeToSend && recipientCount > 0 ? (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.8rem', fontWeight: 600 } }}>
                                Insufficient credits to dispatch this campaign.
                            </Alert>
                        ) : null}

                        <Button 
                            fullWidth variant="contained" 
                            disabled={
                                (isSingle ? (sLoading || !sTo || !sBody) : (bLoading || recipientCount === 0 || !bBody))
                                || !safeToSend
                            }
                            onClick={isSingle ? handleSingleSend : handleBulkSend}
                            sx={{ 
                                bgcolor: '#111827', '&:hover': { bgcolor: '#374151' }, 
                                borderRadius: 2, py: 1.4, fontWeight: 600 
                            }}
                        >
                            {isSingle 
                                ? (sLoading ? <CircularProgress size={20} color="inherit" /> : (sScheduled ? 'Schedule Message' : 'Dispatch Message'))
                                : (bLoading ? <CircularProgress size={20} color="inherit" /> : (bScheduled ? 'Schedule Campaign' : 'Dispatch Campaign'))
                            }
                        </Button>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
