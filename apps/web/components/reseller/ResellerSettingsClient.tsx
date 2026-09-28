'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Grid, Button,
  TextField, Alert, CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import { SettingsService } from '@/lib/services/settings.service';

export default function ResellerSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    branch: '',
    support_email: '',
    support_phone: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await SettingsService.getMySettings();
      if (data && typeof data === 'object') {
        setForm(prev => ({
          ...prev,
          ...(data.bank_name !== undefined && { bank_name: data.bank_name }),
          ...(data.account_name !== undefined && { account_name: data.account_name }),
          ...(data.account_number !== undefined && { account_number: data.account_number }),
          ...(data.branch !== undefined && { branch: data.branch }),
          ...(data.support_email !== undefined && { support_email: data.support_email }),
          ...(data.support_phone !== undefined && { support_phone: data.support_phone }),
        }));
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = [
        { category: 'billing', key: 'bank_name', value: form.bank_name },
        { category: 'billing', key: 'account_name', value: form.account_name },
        { category: 'billing', key: 'account_number', value: form.account_number },
        { category: 'billing', key: 'branch', value: form.branch },
        { category: 'support', key: 'support_email', value: form.support_email },
        { category: 'support', key: 'support_phone', value: form.support_phone },
      ];
      await SettingsService.updateSettings(payload);
      setSuccess('Settings saved successfully');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', pb: 8, pt: 2 }}>
      <Typography variant="h4" fontWeight={800} mb={1}>Platform Settings</Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Configure the support contact and bank transfer details your customers will see.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {/* Support Contact Card */}
      <Card elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #e8eaf0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <HeadsetMicIcon sx={{ color: '#f26f2e', fontSize: 22 }} />
          <Typography variant="h6" fontWeight={700}>Support Contact</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Your customers will see these details in their dashboard sidebar when they need help. Leave blank to use platform defaults.
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth label="Support Email" size="small" type="email"
              value={form.support_email}
              onChange={e => setForm({ ...form, support_email: e.target.value })}
              placeholder="support@yourcompany.com"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth label="Support Phone" size="small"
              value={form.support_phone}
              onChange={e => setForm({ ...form, support_phone: e.target.value })}
              placeholder="+94 77 123 4567"
            />
          </Grid>
        </Grid>
      </Card>

      {/* Bank Transfer Card */}
      <Card elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #e8eaf0' }}>
        <Typography variant="h6" fontWeight={700} mb={1}>Bank Transfer Instructions</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>These details are displayed to your customers when they top up via Bank Transfer.</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Bank Name" size="small" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Account Name" size="small" value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Account Number" size="small" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Branch" size="small" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} />
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ bgcolor: '#e53935', '&:hover': { bgcolor: '#c62828' }, borderRadius: 2, px: 4 }}
        >
          {saving ? 'Saving...' : 'Save Details'}
        </Button>
      </Box>
    </Box>
  );
}
