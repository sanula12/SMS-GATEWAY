'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import Image from 'next/image';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Typography,
  IconButton, Avatar, Menu, MenuItem, Chip, Divider,
  useMediaQuery, useTheme, Tooltip, CircularProgress, Badge,
} from '@mui/material';
import DashboardIcon   from '@mui/icons-material/Dashboard';
import PeopleIcon      from '@mui/icons-material/People';
import SwapHorizIcon   from '@mui/icons-material/SwapHoriz';
import BadgeIcon       from '@mui/icons-material/Badge';
import MenuIcon        from '@mui/icons-material/Menu';
import LogoutIcon      from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SmsIcon         from '@mui/icons-material/Sms';
import LocalOfferIcon  from '@mui/icons-material/LocalOffer';
import StorefrontIcon  from '@mui/icons-material/Storefront';
import SettingsIcon    from '@mui/icons-material/Settings';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/WhitelabelContext';
import { WhitelabelService } from '@/lib/services/whitelabel.service';

export const RESELLER_DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Overview',   icon: <DashboardIcon />,  href: '/reseller' },
  { label: 'Customers',  icon: <PeopleIcon />,      href: '/reseller/customers' },
  { label: 'Credits',    icon: <SwapHorizIcon />,   href: '/reseller/credits' },
  { label: 'Buy Credits',icon: <AccountBalanceIcon />, href: '/reseller/topup' },
  { label: 'Logs',       icon: <SmsIcon />,         href: '/reseller/logs' },
  { label: 'Sender IDs', icon: <BadgeIcon />,       href: '/reseller/sender-ids' },
  { label: 'Packages',   icon: <LocalOfferIcon />,  href: '/reseller/packages' },
  { label: 'White-Label',icon: <StorefrontIcon />,  href: '/reseller/whitelabel' },
  { label: 'Support',    icon: <LiveHelpIcon />,    href: '/reseller/tickets' },
  { label: 'Settings',   icon: <SettingsIcon />,    href: '/reseller/settings' },
];

const pageTitles: Record<string, string> = {
  '/reseller':             'Reseller Overview',
  '/reseller/customers':   'My Customers',
  '/reseller/credits':     'Credit Management',
  '/reseller/topup':       'Buy Wholesale Credits',
  '/reseller/logs':        'Customer SMS Logs',
  '/reseller/sender-ids':  'Sender IDs',
  '/reseller/packages':    'Manage Packages',
  '/reseller/whitelabel':  'White-Label Configuration',
  '/reseller/settings':    'System Settings',
};

interface ResellerShellProps {
  children: React.ReactNode;
}

export default function ResellerShell({ children }: ResellerShellProps) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout, isLoading } = useAuth();
  React.useEffect(() => {
    // Only allow reseller role to access this shell
    if (!isLoading && user && user.role !== 'reseller') {
      const roleRoutes: any = { super_admin: '/admin', reseller: '/reseller', customer: '/dashboard' };
      router.replace(roleRoutes[user.role] || '/login');
    }
  }, [user, isLoading, router]);


  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl,   setAnchorEl]   = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [supportContact, setSupportContact] = useState<{ email?: string; phone?: string }>({});

  useEffect(() => {
    // Resellers always see platform admin's contact info (from global settings)
    fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/proxy'}/settings/global`)
      .then(r => r.json())
      .then(data => {
        if (data) setSupportContact({ email: data.support_email || '', phone: data.support_phone || '' });
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (user) {
      import('@/lib/services/notifications.service').then(({ NotificationsService }) => {
        NotificationsService.getUnread().then(setNotifications).catch(console.error);
      });
    }
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    const { NotificationsService } = await import('@/lib/services/notifications.service');
    await NotificationsService.markAsRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const hostBranding = useBranding();
  const [brandingLoading, setBrandingLoading] = useState(true);
  const [branding, setBranding] = useState(() => ({
    companyName: hostBranding.isWhitelabel ? hostBranding.companyName : '',
    logoUrl: hostBranding.isWhitelabel ? hostBranding.logoUrl : null,
    primaryColor: hostBranding.isWhitelabel ? (hostBranding.primaryColor || '#f26f2e') : '#f26f2e',
  }));

  useEffect(() => {
    try {
      const cached = localStorage.getItem('reseller_branding');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.companyName || parsed.logoUrl)) {
          setBranding({
            companyName: parsed.companyName || '',
            logoUrl: parsed.logoUrl || null,
            primaryColor: parsed.primaryColor || '#f26f2e',
          });
        }
      }
    } catch (e) {}

    let active = true;
    WhitelabelService.getMyConfig()
      .then(cfg => {
        if (!active) return;
        if (cfg) {
          const updated = {
            companyName: cfg.companyName || '',
            logoUrl: cfg.logoUrl || null,
            primaryColor: cfg.primaryColor || '#7c3aed',
          };
          setBranding(updated);
          try {
            localStorage.setItem('reseller_branding', JSON.stringify(updated));
          } catch (e) {}
        }
      })
      .catch((err) => {
        console.error('Error fetching whitelabel config:', err);
      })
      .finally(() => {
        if (active) {
          setBrandingLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const pageTitle = pageTitles[pathname] ?? 'Reseller Panel';

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1a1f36', color: '#fff' }}>

      {/* Logo */}
      <Box component={NextLink} href="/" sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "center", height: 80, textDecoration: "none", overflow: "hidden", flexShrink: 0 }}>
        {brandingLoading && !hostBranding.isWhitelabel ? null : branding.logoUrl ? (
          <Box
            component="img"
            src={branding.logoUrl}
            alt={branding.companyName || 'Logo'}
            sx={{
              height: 40,
              maxWidth: '100%',
              width: 'auto',
              objectFit: 'contain',
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
        ) : branding.companyName ? (
           <Typography variant="h6" fontWeight={800} color="#fff">{branding.companyName}</Typography>
        ) : (
          <Box
            component="img"
            src="/logo.png"
            alt="V SMS Logo"
            sx={{ height: 40, width: 'auto', maxWidth: '100%', objectFit: 'contain', flexShrink: 0 }}
          />
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mx: 2 }} />

      {/* Nav items */}
      <Box sx={{ flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: 6 }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.2)", borderRadius: 3 }, "&::-webkit-scrollbar-track": { bgcolor: "transparent" } }}>
      <List sx={{ px: 1.5, pt: 2 }}>
        {navItems.map(item => {
          const active =
            pathname === item.href ||
            (item.href !== '/reseller' && pathname.startsWith(item.href));

          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NextLink}
                href={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 1.5, px: 2, py: 1,
                  color:  active ? '#fff' : '#8892b0',
                  bgcolor: active ? branding.primaryColor : 'transparent',
                  '&:hover': {
                    bgcolor: active ? branding.primaryColor : 'rgba(255,255,255,0.06)',
                    color: '#fff',
                  },
                  transition: 'all 0.15s',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit', '& svg': { fontSize: 20 } }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      </Box>

      {/* Credit balance card */}
      <Box sx={{ px: 2, pb: 1, flexShrink: 0 }}>
        <Box sx={{
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          p: 1.5,
        }}>
          <Typography variant="caption" sx={{ color: '#c4b5fd', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Credit Balance
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2 }}>
            Rs. {parseFloat(user?.creditBalance ?? '0').toFixed(2)}
          </Typography>
        </Box>
      </Box>

      {/* Need Help? Support Card — shows platform admin contact */}
      {(supportContact.email || supportContact.phone) && (
        <Box sx={{ px: 2, pb: 1, flexShrink: 0 }}>
          <Box sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
              <HeadsetMicIcon sx={{ fontSize: 14, color: '#f26f2e' }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#f26f2e', textTransform: 'uppercase', letterSpacing: 0.8 }}>Need Help?</Typography>
            </Box>
            {supportContact.email && (
              <Typography component="a" href={`mailto:${supportContact.email}`} sx={{ display: 'block', fontSize: '0.72rem', color: '#8892b0', textDecoration: 'none', mb: 0.25, '&:hover': { color: '#fff' }, wordBreak: 'break-all' }}>
                {supportContact.email}
              </Typography>
            )}
            {supportContact.phone && (
              <Typography component="a" href={`tel:${supportContact.phone}`} sx={{ display: 'block', fontSize: '0.72rem', color: '#8892b0', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                {supportContact.phone}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Bottom user card */}
      <Box sx={{ p: 2, flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <Box sx={{
          borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)',
          p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: branding.primaryColor, fontSize: '0.8rem' }}>
            {user?.name?.[0]?.toUpperCase() ?? 'R'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap
              sx={{ color: '#fff', fontSize: '0.8rem' }}>
              {user?.name ?? 'Reseller'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8892b0', fontSize: '0.65rem' }}>
              Reseller
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f2f9' }}>

      {/* Sidebar — desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: RESELLER_DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: RESELLER_DRAWER_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Sidebar — mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: RESELLER_DRAWER_WIDTH, border: 'none' },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Right side — AppBar + content + footer */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#fff',
            borderBottom: '1px solid #e8eaf0',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}

            <Typography variant="h6" fontWeight={700}
              sx={{ flex: 1, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
              {pageTitle}
            </Typography>

            {/* Reseller badge */}
            <Chip
              icon={<StorefrontIcon sx={{ fontSize: '14px !important', color: `${branding.primaryColor} !important` }} />}
              label="RESELLER"
              size="small"
              sx={{
                bgcolor: 'rgba(0,0,0,0.04)',
                color: branding.primaryColor,
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: 0.8,
                display: { xs: 'none', sm: 'flex' },
              }}
            />

            {/* Credit balance chip */}
            <Chip
              label={`Rs. ${parseFloat(user?.creditBalance ?? '0').toFixed(2)}`}
              size="small"
              sx={{
                bgcolor: 'rgba(0,0,0,0.04)',
                color: branding.primaryColor,
                fontWeight: 700,
                fontSize: '0.75rem',
                display: { xs: 'none', sm: 'flex' },
              }}
            />

            {/* Notifications Button */}
            <Tooltip title="Notifications">
              <IconButton size="small" onClick={e => setNotifAnchorEl(e.currentTarget)}>
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Avatar menu */}
            <IconButton onClick={e => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: branding.primaryColor, fontSize: '0.85rem', fontWeight: 700 }}>
                {user?.name?.[0]?.toUpperCase() ?? 'R'}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{ elevation: 4, sx: { mt: 1, minWidth: 180, borderRadius: 2 } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); router.push('/reseller/profile'); }}>
                <AccountCircleIcon fontSize="small" sx={{ mr: 1.5 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); logout(); }} sx={{ color: 'error.main' }}>
                <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                Logout
              </MenuItem>
            </Menu>

            {/* Notifications Menu */}
            <Menu
              anchorEl={notifAnchorEl}
              open={Boolean(notifAnchorEl)}
              onClose={() => setNotifAnchorEl(null)}
              PaperProps={{
                elevation: 3,
                sx: { width: 340, maxHeight: 420, mt: 1.5, borderRadius: 2 },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
                {notifications.length > 0 && (
                  <Chip label={`${notifications.length} unread`} size="small" color="error" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                )}
              </Box>
              <List sx={{ p: 0 }}>
                {notifications.length === 0 ? (
                  <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No new notifications</Typography>
                  </ListItem>
                ) : (
                  notifications.map(n => (
                    <ListItem
                      key={n.id}
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        borderBottom: '1px solid #f8f9fa',
                        px: 2,
                        py: 1.5,
                        cursor: n.type === 'ticket' ? 'pointer' : 'default',
                        '&:hover': { bgcolor: '#f8fafc' },
                      }}
                      onClick={() => {
                        if (n.type === 'ticket') {
                          router.push('/reseller/tickets');
                          setNotifAnchorEl(null);
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={n.type}
                            size="small"
                            color={n.type === 'ticket' ? 'warning' : 'default'}
                            sx={{ height: 18, fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 700 }}
                          />
                          <Typography variant="caption" fontWeight={700} color="text.primary">
                            {n.title}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#475569', mb: 1, pr: 1 }}>
                        {n.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem', '&:hover': { textDecoration: 'underline' } }}
                        onClick={e => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                      >
                        Mark as read
                      </Typography>
                    </ListItem>
                  ))
                )}
              </List>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, maxWidth: '100%' }}>
          {children}
        </Box>

        {/* Footer */}
        <Box sx={{
          px: 3, py: 1.5,
          borderTop: '1px solid #e8eaf0',
          bgcolor: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} {branding?.companyName || 'V SMS Infrastructure'}. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Reseller Panel v1.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
