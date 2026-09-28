'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Grid, Button, Switch,
  FormControlLabel, TextField, Divider, Alert, CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { SettingsService } from '@/lib/services/settings.service';

export default function AdminSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    maintenance_mode: false,
    new_user_credit: '0',
    default_low_balance_threshold: '100',
    support_email: '',
    support_phone: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    branch: '',
    admin_notifications_enabled: true,
    user_auto_approval: true,
    campaign_moderation: { enabled: false, threshold: 1000 },
    hutch_base_cost: '0.30',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await SettingsService.getMySettings();
      if (data && typeof data === 'object') {
        setForm(prev => ({
          ...prev,
          ...(data.maintenance_mode !== undefined && { maintenance_mode: data.maintenance_mode }),
          ...(data.new_user_credit !== undefined && { new_user_credit: String(data.new_user_credit) }),
          ...(data.default_low_balance_threshold !== undefined && { default_low_balance_threshold: String(data.default_low_balance_threshold) }),
          ...(data.support_email !== undefined && { support_email: data.support_email }),
          ...(data.support_phone !== undefined && { support_phone: data.support_phone }),
          ...(data.bank_name !== undefined && { bank_name: data.bank_name }),
          ...(data.account_name !== undefined && { account_name: data.account_name }),
          ...(data.account_number !== undefined && { account_number: data.account_number }),
          ...(data.branch !== undefined && { branch: data.branch }),
          ...(data.admin_notifications_enabled !== undefined && { admin_notifications_enabled: data.admin_notifications_enabled }),
          ...(data.user_auto_approval !== undefined && { user_auto_approval: data.user_auto_approval }),
          ...(data.campaign_moderation !== undefined && { campaign_moderation: data.campaign_moderation }),
          ...(data.hutch_base_cost !== undefined && { hutch_base_cost: String(data.hutch_base_cost) }),
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
        { category: 'system', key: 'maintenance_mode', value: form.maintenance_mode },
        { category: 'billing', key: 'new_user_credit', value: form.new_user_credit },
        { category: 'billing', key: 'default_low_balance_threshold', value: form.default_low_balance_threshold },
        { category: 'general', key: 'support_email', value: form.support_email },
        { category: 'general', key: 'support_phone', value: form.support_phone },
        { category: 'billing', key: 'bank_name', value: form.bank_name },
        { category: 'billing', key: 'account_name', value: form.account_name },
        { category: 'billing', key: 'account_number', value: form.account_number },
        { category: 'billing', key: 'branch', value: form.branch },
        { category: 'system', key: 'admin_notifications_enabled', value: form.admin_notifications_enabled },
        { category: 'system', key: 'user_auto_approval', value: form.user_auto_approval },
        { category: 'system', key: 'campaign_moderation', value: form.campaign_moderation },
        { category: 'gateway', key: 'hutch_base_cost', value: form.hutch_base_cost },
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
      <Typography variant="h4" fontWeight={800} mb={1}>System Settings</Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Manage global configurations, billing instructions, and platform defaults.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Card elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #e8eaf0' }}>
        <Typography variant="h6" fontWeight={700} mb={3}>Platform Operations</Typography>
        
        <FormControlLabel
          control={<Switch checked={form.maintenance_mode} onChange={e => setForm({ ...form, maintenance_mode: e.target.checked })} color="error" />}
          label={<Box><Typography fontWeight={600}>Maintenance Mode</Typography><Typography variant="caption" color="text.secondary">Locks out all users and resellers (except Super Admin).</Typography></Box>}
          sx={{ mb: 3, display: 'flex', alignItems: 'flex-start' }}
        />

        <FormControlLabel
          control={<Switch checked={form.user_auto_approval} onChange={e => setForm({ ...form, user_auto_approval: e.target.checked })} color="primary" />}
          label={<Box><Typography fontWeight={600}>User Registration Auto-Approval</Typography><Typography variant="caption" color="text.secondary">If disabled, new users will be in 'pending' status and require manual approval.</Typography></Box>}
          sx={{ mb: 3, display: 'flex', alignItems: 'flex-start' }}
        />

        <FormControlLabel
          control={<Switch checked={form.admin_notifications_enabled} onChange={e => setForm({ ...form, admin_notifications_enabled: e.target.checked })} color="primary" />}
          label={<Box><Typography fontWeight={600}>Admin Email Notifications</Typography><Typography variant="caption" color="text.secondary">Receive email alerts for new signups and bank slip requests.</Typography></Box>}
          sx={{ mb: 3, display: 'flex', alignItems: 'flex-start' }}
        />

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" fontWeight={700} mb={2}>Campaign Moderation</Typography>
        
        <FormControlLabel
          control={<Switch checked={form.campaign_moderation.enabled} onChange={e => setForm({ ...form, campaign_moderation: { ...form.campaign_moderation, enabled: e.target.checked } })} color="warning" />}
          label={<Box><Typography fontWeight={600}>Require Admin Approval for Large Campaigns</Typography><Typography variant="caption" color="text.secondary">Pause bulk campaigns exceeding the threshold until an admin approves them.</Typography></Box>}
          sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
        />
        
        {form.campaign_moderation.enabled && (
          <TextField 
            label="Recipient Threshold" 
            size="small" 
            type="number" 
            value={form.campaign_moderation.threshold} 
            onChange={e => setForm({ ...form, campaign_moderation: { ...form.campaign_moderation, threshold: parseInt(e.target.value) || 0 } })} 
            helperText="Campaigns with this many recipients or more will be flagged for manual approval." 
            sx={{ ml: 4, width: 300 }}
          />
        )}
      </Card>

      <Card elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #e8eaf0' }}>
        <Typography variant="h6" fontWeight={700} mb={1}>Gateway Configuration</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Configure upstream provider rates for accurate profit calculations.</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Hutch Base SMS Cost (Rs.)" size="small" type="number" inputProps={{ step: '0.01' }} value={form.hutch_base_cost} onChange={e => setForm({ ...form, hutch_base_cost: e.target.value })} helperText="The flat rate charged by Hutch per delivered message." />
          </Grid>
        </Grid>
      </Card>

      <Card elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #e8eaf0' }}>
        <Typography variant="h6" fontWeight={700} mb={3}>Global Billing & Thresholds</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="New Signup Default Credit Balance" size="small" type="number" value={form.new_user_credit} onChange={e => setForm({ ...form, new_user_credit: e.target.value })} helperText="Free testing credit given to new users automatically." />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Global Low Balance Threshold" size="small" type="number" value={form.default_low_balance_threshold} onChange={e => setForm({ ...form, default_low_balance_threshold: e.target.value })} helperText="System default for low balance email/SMS alerts." />
          </Grid>
        </Grid>
      </Card>

      <Card elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #e8eaf0' }}>
        <Typography variant="h6" fontWeight={700} mb={1}>Bank Transfer Instructions</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>These details are displayed to direct customers when they top up via Bank Transfer.</Typography>
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

      <Card elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #e8eaf0' }}>
        <Typography variant="h6" fontWeight={700} mb={3}>Support Contact</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Support Email" size="small" value={form.support_email} onChange={e => setForm({ ...form, support_email: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Support Phone" size="small" value={form.support_phone} onChange={e => setForm({ ...form, support_phone: e.target.value })} />
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
          sx={{ bgcolor: '#111827', '&:hover': { bgcolor: '#374151' }, borderRadius: 2, px: 4 }}
        >
          {saving ? 'Saving...' : 'Save System Settings'}
        </Button>
      </Box>
    </Box>
  );
}
