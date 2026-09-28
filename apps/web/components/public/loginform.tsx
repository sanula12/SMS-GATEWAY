'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box, Button, TextField, Typography, Paper,
  Alert, CircularProgress, Link, Divider,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '@/context/AuthContext';
import { proxy } from '@/lib/proxy';
import NextLink from 'next/link';
import { useBranding } from '@/context/WhitelabelContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const branding = useBranding();
  const primaryColor = branding?.primaryColor || '#4f6ef7';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await proxy('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          email: values.email.toLowerCase().trim(),
          domain: typeof window !== 'undefined' ? window.location.host : undefined,
        }),
      });

      if (response?.accessToken && response?.user) {
        // login() handles cookie storage + redirect based on role
        login(response.accessToken, response.user);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 420,
        borderRadius: 3,
        border: '1px solid #e8eaf0',
        overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header bar */}
      <Box sx={{ bgcolor: primaryColor, px: 4, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1.5 }}>
          <LockOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.1 }}>
            Welcome back
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Sign in to your account
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Email address"
            type="email"
            margin="normal"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={isLoading}
            sx={{ mb: 0.5 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isLoading}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{
              mt: 3,
              py: 1.5,
              fontWeight: 700,
              bgcolor: primaryColor,
              '&:hover': { opacity: 0.9, bgcolor: primaryColor },
              borderRadius: 2,
              fontSize: '0.95rem',
            }}
          >
            {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link
              component={NextLink}
              href="/register"
              sx={{ fontWeight: 700, color: primaryColor, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Create account
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}