'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useBranding } from '@/context/WhitelabelContext';

export default function MainViewShell({ children }: { children: React.ReactNode }) {
  const branding = useBranding();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f0f2f9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {/* Logo */}
      <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4, textDecoration: 'none' }}>
        <Box
          component="img"
          src={branding?.logoUrl || "/logo.png"}
          alt={branding?.companyName || "V SMS Logo"}
          sx={{ height: 100, width: 'auto', maxWidth: '100%', objectFit: 'contain', transform: 'scale(1.2)' }}
        />
      </Box>

      {children}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        {branding?.isWhitelabel ? (
          `© ${new Date().getFullYear()} ${branding.companyName || 'SMS Gateway'}. All rights reserved.`
        ) : (
          <>
            © {new Date().getFullYear()} V SMS. All rights reserved. A product of{' '}
            <Box
              component="a"
              href="https://virgincareer.lk"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
            >
              Virgin Career Production (Pvt) Ltd
            </Box>
          </>
        )}
      </Typography>
    </Box>
  );
}