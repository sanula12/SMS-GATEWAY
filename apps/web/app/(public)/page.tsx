'use client';

import React, { useState } from 'react';
import {
  Box, Button, Container, Typography, Grid, Card, CardContent,
  AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemButton,
  Divider, Chip, Stack, TextField, CircularProgress, Alert,
} from '@mui/material';
import Link from 'next/link';
import SendIcon from '@mui/icons-material/Send';
import SpeedIcon from '@mui/icons-material/Speed';
import ApiIcon from '@mui/icons-material/Api';
import CampaignIcon from '@mui/icons-material/Campaign';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CodeIcon from '@mui/icons-material/Code';
import BusinessIcon from '@mui/icons-material/Business';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SmsIcon from '@mui/icons-material/Sms';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LockIcon from '@mui/icons-material/Lock';
import HandshakeIcon from '@mui/icons-material/Handshake';
import StorefrontIcon from '@mui/icons-material/Storefront';
import Image from 'next/image';

const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.send.virgincareer.lk';

const features = [
  {
    icon: <SendIcon sx={{ fontSize: 32 }} />,
    title: 'Bulk SMS Campaigns',
    desc: 'Send thousands of SMS messages at once with our high-throughput campaign engine. Schedule, track, and optimize at scale.',
    color: '#f26f2e',
  },
  {
    icon: <ApiIcon sx={{ fontSize: 32 }} />,
    title: 'Developer API',
    desc: 'RESTful API with full documentation. Integrate SMS into your apps in minutes with our simple, well-documented endpoints.',
    color: '#0891b2',
  },
  {
    icon: <NotificationsActiveIcon sx={{ fontSize: 32 }} />,
    title: 'Real-Time Delivery',
    desc: 'Know the exact status of every message. Track delivery receipts in real-time across your entire message history.',
    color: '#059669',
  },
  {
    icon: <GroupIcon sx={{ fontSize: 32 }} />,
    title: 'Contact Management',
    desc: 'Organize your contacts into groups. Import via CSV and manage thousands of recipients effortlessly.',
    color: '#d97706',
  },
  {
    icon: <CampaignIcon sx={{ fontSize: 32 }} />,
    title: 'Custom Sender IDs',
    desc: 'Send messages from your own brand name. Customers see your company name instead of a random number.',
    color: '#7c3aed',
  },
  {
    icon: <BusinessIcon sx={{ fontSize: 32 }} />,
    title: 'Reseller Platform',
    desc: 'Launch your own SMS business. Full white-label reseller support with credit management for your customers.',
    color: '#be185d',
  },
];

const steps = [
  { num: '01', title: 'Create an Account', desc: 'Sign up in seconds. No setup fees, no commitments.' },
  { num: '02', title: 'Top Up Credits', desc: 'Choose a credit bundle that fits your volume and budget.' },
  { num: '03', title: 'Start Sending', desc: 'Use our dashboard or API to send your first message immediately.' },
];

const resellerPerks = [
  'White-label the platform with your own branding',
  'Set your own pricing and keep the margin',
  'Full customer credit management dashboard',
  'Dedicated reseller support',
];

function ResellerContactSection() {
  const [form, setForm] = React.useState({ name: '', company: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) return 'Please enter your full name.';
    if (!form.company.trim() || form.company.trim().length < 2) return 'Please enter your company name.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    if (!form.message.trim() || form.message.trim().length < 10) return 'Please write a message (at least 10 characters).';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError('');
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
      const res = await fetch(`${apiBase}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          message: form.message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Something went wrong. Please try again.');
      }
      setSuccess(true);
      setForm({ name: '', company: '', email: '', phone: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box id="resellers" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="flex-start">
          {/* LEFT: Info */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#be185d12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StorefrontIcon sx={{ color: '#be185d', fontSize: 26 }} />
              </Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#be185d' }}>
                Become a Reseller
              </Typography>
            </Box>
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 2 }}>
              Launch your own SMS business
            </Typography>
            <Typography sx={{ color: '#64748b', mb: 4, lineHeight: 1.8, fontSize: '1rem' }}>
              Want to resell SMS credits under your own brand? We offer a fully white-labeled reseller program. Reach out and our team will set you up with a dedicated reseller account.
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              {resellerPerks.map(perk => (
                <Box key={perk} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon sx={{ color: '#be185d', fontSize: 20 }} />
                  <Typography sx={{ color: '#374151', fontSize: '0.95rem' }}>{perk}</Typography>
                </Box>
              ))}
            </Stack>
            <Box sx={{ p: 3, bgcolor: '#fdf2f8', borderRadius: 3, border: '1px solid #fce7f3' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <HandshakeIcon sx={{ color: '#be185d', fontSize: 20 }} />
                <Typography sx={{ fontWeight: 700, color: '#9d174d', fontSize: '0.9rem' }}>Reseller accounts are by invitation only</Typography>
              </Box>
              <Typography sx={{ color: '#831843', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Fill in the form and our team will review your application and get back to you within 1–2 business days.
              </Typography>
            </Box>
          </Grid>

          {/* RIGHT: Contact Form */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid #f1f5f9', borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', mb: 0.5 }}>Contact Us</Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.9rem', mb: 3 }}>Tell us about your business and we will get back to you.</Typography>

              {success ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CheckCircleIcon sx={{ fontSize: 56, color: '#10b981', mb: 2 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#0f172a', mb: 1 }}>Message Sent!</Typography>
                  <Typography sx={{ color: '#64748b' }}>Thank you for your interest. Our team will reach out to you within 1–2 business days.</Typography>
                  <Button sx={{ mt: 3, color: '#be185d' }} onClick={() => setSuccess(false)}>Send another inquiry</Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleSubmit}>
                  {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth name="name" label="Full Name" required
                        value={form.name} onChange={handleChange}
                        size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth name="company" label="Company Name"
                        value={form.company} onChange={handleChange}
                        size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth name="email" label="Email Address" type="email" required
                        value={form.email} onChange={handleChange}
                        size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth name="phone" label="Phone Number"
                        value={form.phone} onChange={handleChange}
                        size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth name="message" label="Tell us about your business" required multiline rows={4}
                        value={form.message} onChange={handleChange}
                        placeholder="How many SMS do you plan to send per month? What industry are you in?"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <HandshakeIcon />}
                        sx={{
                          bgcolor: '#be185d',
                          fontWeight: 700,
                          borderRadius: 2.5,
                          py: 1.5,
                          boxShadow: 'none',
                          '&:hover': { bgcolor: '#9d174d', boxShadow: 'none' },
                        }}
                      >
                        {loading ? 'Sending...' : 'Submit Reseller Inquiry'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default function LandingPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      {/* NAVBAR */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #f1f5f9',
          color: '#1e293b',
        }}
      >
        <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexGrow: 1 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="V SMS Logo"
              sx={{ height: 85, width: 'auto', maxWidth: '100%', objectFit: 'contain', transform: 'scale(1.2)' }}
            />
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Button component="a" href="#features" sx={{ color: '#64748b', fontWeight: 500, '&:hover': { color: '#f26f2e', bgcolor: 'transparent' } }}>Features</Button>
            <Button component="a" href="#how-it-works" sx={{ color: '#64748b', fontWeight: 500, '&:hover': { color: '#f26f2e', bgcolor: 'transparent' } }}>How It Works</Button>
            <Button component="a" href="#resellers" sx={{ color: '#64748b', fontWeight: 500, '&:hover': { color: '#f26f2e', bgcolor: 'transparent' } }}>Resellers</Button>
            <Button component="a" href={DOCS_URL} target="_blank" rel="noopener" sx={{ color: '#64748b', fontWeight: 500, '&:hover': { color: '#f26f2e', bgcolor: 'transparent' } }}>API Docs</Button>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
            <Button component={Link} href="/login" variant="outlined" sx={{ borderColor: '#e2e8f0', color: '#374151', fontWeight: 600, borderRadius: 2, '&:hover': { borderColor: '#f26f2e', color: '#f26f2e', bgcolor: 'transparent' } }}>
              Log In
            </Button>
            <Button component={Link} href="/register" variant="contained" sx={{ bgcolor: '#f26f2e', fontWeight: 600, borderRadius: 2, boxShadow: 'none', '&:hover': { bgcolor: '#d9581f', boxShadow: 'none' } }}>
              Get Started
            </Button>
          </Box>

          <IconButton sx={{ display: { md: 'none' } }} onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* MOBILE DRAWER */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <List>
            {[['Features', '#features'], ['How It Works', '#how-it-works'], ['Resellers', '#resellers'], ['API Docs', DOCS_URL]].map(([label, href]) => (
              <ListItem key={label} disablePadding>
                <ListItemButton component="a" href={href} onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2, fontWeight: 500 }}>
                  {label}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1}>
            <Button component={Link} href="/login" variant="outlined" fullWidth sx={{ borderRadius: 2, fontWeight: 600 }}>Log In</Button>
            <Button component={Link} href="/register" variant="contained" fullWidth sx={{ bgcolor: '#f26f2e', borderRadius: 2, fontWeight: 600, boxShadow: 'none' }}>Get Started</Button>
          </Stack>
        </Box>
      </Drawer>

      {/* HERO */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #f8faff 0%, #fee8db 50%, #f0fdf4 100%)',
          pt: { xs: 8, md: 14 },
          pb: { xs: 8, md: 14 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', bgcolor: '#f26f2e10', filter: 'blur(60px)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: -80, right: -80, width: 350, height: 350, borderRadius: '50%', bgcolor: '#05966910', filter: 'blur(60px)', zIndex: 0 }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Chip label="Enterprise SMS Platform" size="small" sx={{ mb: 3, bgcolor: '#fee8db', color: '#f26f2e', fontWeight: 700, border: '1px solid #fcd1b7', borderRadius: 99 }} />
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.4rem', md: '3.8rem' },
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              mb: 3,
            }}
          >
            Send SMS at Scale,{' '}
            <Box component="span" sx={{ color: '#f26f2e' }}>Instantly</Box>
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.05rem', md: '1.25rem' }, color: '#64748b', maxWidth: 580, mx: 'auto', mb: 5, lineHeight: 1.7 }}>
            A complete V SMS Gateway for businesses, developers, and resellers. Send bulk campaigns, automate messages via API, and track delivery in real time.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/register"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ bgcolor: '#f26f2e', px: 4, py: 1.5, borderRadius: 2.5, fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 20px #f26f2e40', '&:hover': { bgcolor: '#d9581f', boxShadow: '0 6px 24px #f26f2e50' } }}
            >
              Start for Free
            </Button>
            <Button
              component="a"
              href={DOCS_URL}
              target="_blank"
              variant="outlined"
              size="large"
              startIcon={<CodeIcon />}
              sx={{ borderColor: '#e2e8f0', color: '#374151', px: 4, py: 1.5, borderRadius: 2.5, fontWeight: 700, fontSize: '1rem', '&:hover': { borderColor: '#f26f2e', color: '#f26f2e', bgcolor: '#f5f3ff' } }}
            >
              View API Docs
            </Button>
          </Stack>
          <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap" sx={{ mt: 6, color: '#94a3b8' }}>
            {['Reliable Delivery', 'Real-Time Tracking', 'Simple REST API', 'White-label Ready'].map(badge => (
              <Box key={badge} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{badge}</Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* FEATURES */}
      <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 8 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#f26f2e', mb: 1 }}>
              Everything You Need
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              A complete SMS infrastructure
            </Typography>
            <Typography sx={{ color: '#64748b', mt: 2, fontSize: '1.1rem', maxWidth: 520, mx: 'auto' }}>
              From single messages to millions, our platform handles every use case your business needs.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={f.title}>
                <Card
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    border: '1px solid #f1f5f9',
                    borderRadius: 3,
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: f.color + '40', boxShadow: `0 8px 30px ${f.color}15`, transform: 'translateY(-2px)' },
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: 2.5, bgcolor: f.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5, color: f.color }}>
                      {f.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', mb: 1 }}>{f.title}</Typography>
                    <Typography sx={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.9rem' }}>{f.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* HOW IT WORKS */}
      <Box id="how-it-works" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#f8faff' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 8 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#f26f2e', mb: 1 }}>
              Simple Process
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Up and running in minutes
            </Typography>
          </Box>
          <Grid container spacing={4} justifyContent="center">
            {steps.map((step, idx) => (
              <Grid size={{ xs: 12, md: 4 }} key={step.num}>
                <Box sx={{ textAlign: 'center', position: 'relative' }}>
                  {idx < steps.length - 1 && (
                    <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', top: 28, left: '65%', right: '-35%', height: 2, bgcolor: '#e2e8f0', zIndex: 0 }} />
                  )}
                  <Box sx={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', bgcolor: '#f26f2e', mb: 3 }}>
                    <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1rem' }}>{step.num}</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1 }}>{step.title}</Typography>
                  <Typography sx={{ color: '#64748b', lineHeight: 1.7 }}>{step.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* DEVELOPER / API SECTION */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#0891b2', mb: 1 }}>
                For Developers
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 2 }}>
                Integrate SMS in minutes
              </Typography>
              <Typography sx={{ color: '#64748b', mb: 4, lineHeight: 1.8, fontSize: '1rem' }}>
                Our REST API is clean, consistent, and thoroughly documented. Send a message with a single HTTP POST request. Get delivery receipts via webhooks.
              </Typography>
              <Stack spacing={2} sx={{ mb: 4 }}>
                {['Simple REST API with JSON responses', 'API key authentication', 'Webhook delivery receipts', 'Interactive Swagger documentation', 'Code examples in multiple languages'].map(item => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
                    <Typography sx={{ color: '#374151', fontSize: '0.95rem' }}>{item}</Typography>
                  </Box>
                ))}
              </Stack>
              <Button
                component="a"
                href={DOCS_URL}
                target="_blank"
                variant="contained"
                startIcon={<CodeIcon />}
                sx={{ bgcolor: '#0891b2', borderRadius: 2, fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: '#0e7490', boxShadow: 'none' } }}
              >
                Browse API Documentation
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  bgcolor: '#0f172a',
                  borderRadius: 3,
                  p: 3,
                  fontFamily: '"Fira Code", "Consolas", monospace',
                  fontSize: '0.85rem',
                  lineHeight: 2,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  overflowX: 'auto',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981' }} />
                </Box>
                <Typography component="div" sx={{ color: '#64748b', fontFamily: 'inherit', fontSize: '0.8rem', mb: 1 }}># Send an SMS via API</Typography>
                <Typography component="div" sx={{ color: '#38bdf8', fontFamily: 'inherit', fontSize: '0.8rem' }}>curl -X POST \</Typography>
                <Typography component="div" sx={{ color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.8rem', pl: 2 }}>https://send.virgincareer.lk/api/sms/send \</Typography>
                <Typography component="div" sx={{ color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.8rem', pl: 2 }}>-H &quot;Authorization: Bearer YOUR_KEY&quot; \</Typography>
                <Typography component="div" sx={{ color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.8rem', pl: 2 }}>-d &apos;&#123;</Typography>
                <Typography component="div" sx={{ color: '#a3e635', fontFamily: 'inherit', fontSize: '0.8rem', pl: 4 }}>&quot;to&quot;: &quot;+94771234567&quot;,</Typography>
                <Typography component="div" sx={{ color: '#a3e635', fontFamily: 'inherit', fontSize: '0.8rem', pl: 4 }}>&quot;message&quot;: &quot;Hello from the API!&quot;</Typography>
                <Typography component="div" sx={{ color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.8rem', pl: 2 }}>&#125;&apos;</Typography>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #1e293b' }}>
                  <Typography component="div" sx={{ color: '#64748b', fontFamily: 'inherit', fontSize: '0.8rem', mb: 0.5 }}># Response</Typography>
                  <Typography component="div" sx={{ color: '#10b981', fontFamily: 'inherit', fontSize: '0.8rem' }}>&#123; &quot;success&quot;: true, &quot;messageId&quot;: &quot;abc-123&quot; &#125;</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* RESELLER SECTION */}
      <ResellerContactSection />

      {/* CTA BANNER */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          background: 'linear-gradient(135deg, #f26f2e 0%, #7c3aed 100%)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <LockIcon sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 40, mb: 2 }} />
          <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', mb: 2 }}>
            Ready to start sending?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 5, fontSize: '1.15rem', maxWidth: 480, mx: 'auto' }}>
            Join businesses already using our platform. Create an account and send your first message today.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/register"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ bgcolor: '#fff', color: '#f26f2e', px: 5, py: 1.75, fontWeight: 800, fontSize: '1rem', borderRadius: 2.5, boxShadow: '0 8px 30px rgba(0,0,0,0.2)', '&:hover': { bgcolor: '#f0fdf4' } }}
            >
              Create Free Account
            </Button>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              size="large"
              sx={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff', px: 5, py: 1.75, fontWeight: 700, fontSize: '1rem', borderRadius: 2.5, '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Log In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box sx={{ bgcolor: '#0f172a', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-between" alignItems="flex-start">
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  component="img"
                  src="/logo.png"
                  alt="V SMS Logo"
                  sx={{ height: 80, width: 'auto', maxWidth: '100%', objectFit: 'contain', transform: 'scale(1.2)' }}
                />
              </Box>
              <Typography sx={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.8 }}>
                Enterprise-grade SMS infrastructure for businesses of all sizes.
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>Platform</Typography>
              {[['Features', '#features'], ['How It Works', '#how-it-works'], ['API Docs', DOCS_URL]].map(([label, href]) => (
                <Box key={label} sx={{ mb: 1 }}>
                  <Typography component="a" href={href} sx={{ color: '#64748b', fontSize: '0.875rem', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>Account</Typography>
              {[['Log In', '/login'], ['Register', '/register']].map(([label, href]) => (
                <Box key={label} sx={{ mb: 1 }}>
                  <Typography component={Link} href={href} sx={{ color: '#64748b', fontSize: '0.875rem', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: '#1e293b', my: 4 }} />
          <Typography sx={{ color: '#475569', fontSize: '0.8rem', textAlign: 'center' }}>
            © {new Date().getFullYear()} V SMS. All rights reserved. A product of{' '}
            <Box
              component="a"
              href="https://virgincareer.lk"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, '&:hover': { color: '#f26f2e', textDecoration: 'underline' } }}
            >
              Virgin Career Production (Pvt) Ltd
            </Box>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
