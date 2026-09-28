'use client';

import React, { useState } from 'react';
import {
  Box, Card, Typography, TextField, Button,
  Divider, Alert, CircularProgress, Avatar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useAuth } from '@/context/AuthContext';
import { AccountsService } from '@/lib/services/accounts.service';

export default function ProfileClient() {
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user?.id) return;
    
    setError(null);
    setSuccess(null);

    if (password && password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (password && password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const payload: any = { name };
      if (password) payload.password = password;

      await AccountsService.update(user.id, payload);
      
      setSuccess("Profile updated! (Log out and back in to see your new name on the top right).");
      setPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (user === undefined) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Avatar
          sx={{ width: 80, height: 80, bgcolor: '#4f6ef7', fontSize: '2rem', mx: 'auto', mb: 2 }}
        >
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </Avatar>
        <Typography variant="h5" fontWeight={800}>{user.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', mt: 0.5 }}>
          {user.role} ACCOUNT
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, p: 4 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3 }}>
          Account Settings
        </Typography>

        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField label="Email Address" value={user.email} disabled fullWidth />
          <TextField label="Display Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <VpnKeyIcon fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700}>Change Password</Typography>
          </Box>

          <TextField label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
          <TextField label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth />
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSave} disabled={loading || !name} sx={{ bgcolor: '#4f6ef7', fontWeight: 700, px: 4 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}