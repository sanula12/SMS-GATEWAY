'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Alert, Divider, InputAdornment, Tooltip, IconButton, CircularProgress, Chip
} from '@mui/material';
import { WhitelabelService, WhitelabelConfig } from '@/lib/services/whitelabel.service';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '@/lib/api';

export default function ResellerWhitelabelClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState<WhitelabelConfig>({
    domain: '',
    companyName: '',
    logoUrl: '',
    primaryColor: '#111827',
    supportEmail: '',
  });

  useEffect(() => {
    WhitelabelService.getMyConfig()
      .then(data => {
        setForm({
          domain: data.domain || '',
          companyName: data.companyName || '',
          logoUrl: data.logoUrl || '',
          primaryColor: data.primaryColor || '#111827',
          supportEmail: data.supportEmail || '',
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load whitelabel configuration.');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let finalLogoUrl = form.logoUrl;

      // Upload file to Bunny CDN only when user clicks Save
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const { data } = await api.post('/upload/image?folder=logos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalLogoUrl = data.url;
        setForm(prev => ({ ...prev, logoUrl: finalLogoUrl }));
        setSelectedFile(null);
      }

      await WhitelabelService.updateConfig({
        domain: form.domain ? form.domain.replace(/^https?:\/\//, '').trim() : null,
        companyName: form.companyName,
        logoUrl: finalLogoUrl || null,
        primaryColor: form.primaryColor,
        supportEmail: form.supportEmail || null,
      });

      try {
        localStorage.setItem('reseller_branding', JSON.stringify({
          companyName: form.companyName,
          logoUrl: finalLogoUrl || null,
          primaryColor: form.primaryColor,
        }));
      } catch (e) {}

      setSuccess('White-label configuration saved successfully! Your branding will apply to your portal.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const displayedLogo = previewUrl || form.logoUrl;

  if (loading) return <Typography sx={{ p: 4 }}>Loading settings...</Typography>;

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Hero Banner */}
      <Box sx={{
        mb: 4, borderRadius: 3, bgcolor: '#111827', color: '#fff',
        p: { xs: 3, md: 5 }, position: 'relative', overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 600 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <StorefrontIcon sx={{ color: '#4f6ef7' }} />
            <Typography variant="overline" sx={{ color: '#4f6ef7', fontWeight: 700, letterSpacing: 1.5 }}>
              Brand & White-Label
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 1.5, letterSpacing: '-0.02em' }}>
            Customize Your Portal
          </Typography>
          <Typography variant="body1" sx={{ color: '#9ca3af', lineHeight: 1.6 }}>
            Set up your custom domain, upload your logo, and configure your brand colors. Your customers will see your brand, not ours.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                Brand Settings
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={form.companyName}
                  onChange={e => setForm(prev => ({ ...prev, companyName: e.target.value }))}
                  helperText="This name will appear on the dashboard sidebar and page titles."
                />

                <TextField
                  fullWidth
                  label="Custom Domain"
                  placeholder="portal.yourbrand.com"
                  value={form.domain}
                  onChange={e => setForm(prev => ({ ...prev, domain: e.target.value }))}
                  helperText="Leave empty to use the default platform domain."
                  InputProps={{
                    startAdornment: <InputAdornment position="start">https://</InputAdornment>
                  }}
                />

                {/* Logo Uploader */}
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Brand Logo</Typography>
                  <Box
                    sx={{
                      border: '2px dashed #e5e7eb',
                      borderRadius: 2,
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#f9fafb',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f3f4f6', borderColor: '#d1d5db' },
                      position: 'relative',
                    }}
                    component="label"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                    {displayedLogo ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={displayedLogo} alt="Logo Preview" style={{ maxHeight: 60, maxWidth: 220, objectFit: 'contain', marginBottom: 8 }} />
                        <Typography variant="caption" color="primary" fontWeight={600}>Click to replace image</Typography>
                        {selectedFile && (
                          <Chip label="Ready to upload upon saving" color="warning" size="small" sx={{ mt: 1, fontSize: '0.7rem' }} />
                        )}
                        {!selectedFile && form.logoUrl && (
                          <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.65rem', mt: 0.5, maxWidth: 280, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {form.logoUrl}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9ca3af' }}>
                        <CloudUploadIcon sx={{ fontSize: 36, mb: 1, color: '#d1d5db' }} />
                        <Typography variant="body2" fontWeight={600} color="text.secondary">Click to choose logo</Typography>
                        <Typography variant="caption">PNG, JPG, SVG up to 5MB (Uploaded when saving)</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Primary Brand Color - Safe input avoiding MUI React 19 type=color re-render loop */}
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Primary Brand Color</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      component="input"
                      type="color"
                      value={form.primaryColor || '#111827'}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const color = e.target.value;
                        setForm(prev => ({ ...prev, primaryColor: color }));
                      }}
                      sx={{
                        width: 52,
                        height: 52,
                        p: 0.5,
                        border: '1px solid #d1d5db',
                        borderRadius: 2,
                        cursor: 'pointer',
                        bgcolor: '#fff',
                        flexShrink: 0,
                      }}
                    />
                    <TextField
                      fullWidth
                      value={form.primaryColor}
                      onChange={e => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#111827"
                      helperText="Pick a swatch or enter hex code (used for buttons, accents, icons)"
                    />
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  label="Support Email"
                  placeholder="support@yourbrand.com"
                  value={form.supportEmail}
                  onChange={e => setForm(prev => ({ ...prev, supportEmail: e.target.value }))}
                />

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || !form.companyName}
                    sx={{
                      bgcolor: '#111827',
                      color: '#fff',
                      px: 4,
                      py: 1.2,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#374151' }
                    }}
                  >
                    {saving ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={18} color="inherit" />
                        <span>{selectedFile ? 'Uploading to Bunny CDN & Saving...' : 'Saving...'}</span>
                      </Box>
                    ) : (
                      'Save Configuration'
                    )}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', bgcolor: '#f8fafc' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Custom Domain Setup Guide
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                To use your custom domain, you must create a CNAME record in your DNS settings (e.g., Cloudflare, GoDaddy) pointing to our platform servers.
              </Typography>

              <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 2, border: '1px solid #e5e7eb', mb: 3 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                  DNS Record Type
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>CNAME</Typography>

                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                  Name / Host
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>portal (or subdomain)</Typography>

                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                  Target / Value
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f1f5f9', p: 1, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>send.virgincareer.lk</Typography>
                  <Tooltip title="Copy">
                    <IconButton size="small" onClick={() => copyToClipboard('send.virgincareer.lk')}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Alert severity="info" icon={false} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>SSL Provisioning</Typography>
                <Typography variant="body2" color="text.secondary">
                  Once your CNAME propagates, our proxy will automatically serve your custom logo, brand color, and company name whenever clients visit your domain!
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
