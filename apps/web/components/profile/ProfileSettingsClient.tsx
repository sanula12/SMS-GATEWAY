'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Alert, Divider, MenuItem, InputAdornment, Tooltip, IconButton
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London',
  'Europe/Paris', 'Asia/Kolkata', 'Asia/Colombo', 'Asia/Singapore',
  'Australia/Sydney', 'Asia/Tokyo'
];

export default function ProfileSettingsClient() {
  const { user, updateUser, isLoading: authLoading } = useAuth(); // login function will refresh state if we call me()

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    timezone: 'UTC',
    password: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        timezone: user.timezone || 'UTC',
        password: '', // never populate password
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        timezone: form.timezone,
      };

      if (form.password) {
        payload.password = form.password;
      }

      await api.patch(`/accounts/${user.id}`, payload);
      
      updateUser(payload);
      setSuccess('Profile updated successfully!');
      
      // Clear password field
      setForm(prev => ({ ...prev, password: '' }));
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading && !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <Typography color="text.secondary">Loading profile...</Typography>
      </Box>
    );
  }
  if (!user) return <Alert severity="error" sx={{ m: 3 }}>Unable to load profile information. Please log in again.</Alert>;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 2 }}>
      {/* Hero Banner */}
      <Box sx={{
        mb: 4, borderRadius: 3, bgcolor: '#111827', color: '#fff',
        p: { xs: 3, md: 5 }, position: 'relative', overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 600 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <AccountCircleIcon sx={{ color: '#4f6ef7' }} />
            <Typography variant="overline" sx={{ color: '#4f6ef7', fontWeight: 700, letterSpacing: 1.5 }}>
              Account Profile
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 1.5, letterSpacing: '-0.02em' }}>
            Personal Settings
          </Typography>
          <Typography variant="body1" sx={{ color: '#9ca3af', lineHeight: 1.6 }}>
            Update your personal information, contact details, and secure your account.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={4}>
        {/* Personal Info */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountCircleIcon color="action" /> Profile Details
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  helperText="This is used for logins and alerts."
                />

                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="+947XXXXXXXX"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  helperText="Required for SMS alerts (like low balance)."
                />

                <TextField
                  fullWidth
                  select
                  label="Timezone"
                  value={form.timezone}
                  onChange={e => setForm({ ...form, timezone: e.target.value })}
                  helperText="Your local timezone for scheduled campaigns."
                >
                  {TIMEZONES.map(tz => (
                    <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security & Password */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', bgcolor: '#f8fafc', height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="action" /> Security
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                If you want to change your password, enter a new one below. Leave it blank to keep your current password.
              </Typography>

              <TextField
                fullWidth
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                sx={{ mb: 3 }}
              />

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600}>Role: {user?.role.replace('_', ' ').toUpperCase()}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Your account role and limits are managed by your administrator.
                </Typography>
              </Alert>

            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !form.name || !form.email}
          size="large"
          sx={{
            bgcolor: '#111827',
            color: '#fff',
            px: 5,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            '&:hover': { bgcolor: '#374151' }
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

    </Box>
  );
}
