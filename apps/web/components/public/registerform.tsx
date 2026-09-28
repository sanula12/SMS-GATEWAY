'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box, Button, TextField, Typography, Paper,
  Alert, CircularProgress, Link, Divider, Collapse,
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/WhitelabelContext';
import { proxy } from '@/lib/proxy';
import NextLink from 'next/link';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  referralCode: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const { login } = useAuth();
  const branding = useBranding();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const { confirmPassword, ...rest } = values;
      const payload = {
        ...rest,
        email: values.email.toLowerCase().trim(),
        ...((values.referralCode || branding.resellerId) ? { referralCode: values.referralCode || branding.resellerId } : {}),
      };

      const response = await proxy('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response?.accessToken && response?.user) {
        setSuccess(true);
        setTimeout(() => login(response.accessToken, response.user), 1500);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 440,
        borderRadius: 3,
        border: '1px solid #e8eaf0',
        overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <Box sx={{ bgcolor: '#1a1f36', px: 4, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1.5 }}>
          <PersonAddOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.1 }}>
            Create account
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Start sending SMS with SMSGate
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Account created! Redirecting...</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth label="Full Name" margin="normal"
            {...register('name')} error={!!errors.name} helperText={errors.name?.message}
            disabled={isLoading || success}
          />
          <TextField
            fullWidth label="Email address" type="email" margin="normal"
            {...register('email')} error={!!errors.email} helperText={errors.email?.message}
            disabled={isLoading || success}
          />
          <TextField
            fullWidth label="Password" type="password" margin="normal"
            {...register('password')} error={!!errors.password} helperText={errors.password?.message ?? 'At least 8 characters'}
            disabled={isLoading || success}
          />
          <TextField
            fullWidth label="Confirm Password" type="password" margin="normal"
            {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message}
            disabled={isLoading || success}
          />

          {/* Referral code toggle */}
          {!branding.isWhitelabel && (
            <Box sx={{ mt: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: '#4f6ef7', cursor: 'pointer', fontWeight: 600, display: 'inline', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => setShowReferral(p => !p)}
            >
              {showReferral ? '▾' : '▸'} Have a referral code?
            </Typography>
            <Collapse in={showReferral}>
              <TextField
                fullWidth label="Referral Code" margin="normal"
                {...register('referralCode')}
                disabled={isLoading || success}
                size="small"
              />
            </Collapse>
            </Box>
          )}

          <Button
            fullWidth type="submit" variant="contained" size="large"
            disabled={isLoading || success}
            sx={{
              mt: 3, py: 1.5, fontWeight: 700,
              bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3d5be0' },
              borderRadius: 2, fontSize: '0.95rem',
            }}
          >
            {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link
              component={NextLink} href="/login"
              sx={{ fontWeight: 700, color: '#4f6ef7', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}