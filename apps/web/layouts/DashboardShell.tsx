'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
  Tooltip,
  Badge,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SendIcon from '@mui/icons-material/Send';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import MessageIcon from '@mui/icons-material/Message';
import BadgeIcon from '@mui/icons-material/Badge';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import WebhookIcon from '@mui/icons-material/Webhook';
import AddCardIcon from '@mui/icons-material/AddCard';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/WhitelabelContext';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
  { label: 'Send SMS', icon: <SendIcon />, href: '/dashboard/send' },
  { label: 'Campaigns', icon: <CampaignIcon />, href: '/dashboard/campaigns' },
  { label: 'Contacts', icon: <PeopleIcon />, href: '/dashboard/contacts' },
  { label: 'Automated', icon: <EventRepeatIcon />, href: '/dashboard/automated' },
  { label: 'Scheduled', icon: <ScheduleIcon />, href: '/dashboard/scheduled' },
  { label: 'Messages', icon: <MessageIcon />, href: '/dashboard/messages' },
  { label: 'Sender IDs', icon: <BadgeIcon />, href: '/dashboard/sender-ids' },
  { label: 'API Keys', icon: <VpnKeyIcon />, href: '/dashboard/api-keys' },
  { label: 'Webhooks', icon: <WebhookIcon />, href: '/dashboard/webhooks' },
  { label: 'Support', icon: <LiveHelpIcon />, href: '/dashboard/tickets' },
  { label: 'Top Up', icon: <AddCardIcon />, href: '/dashboard/topup' },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/send': 'Send SMS',
  '/dashboard/campaigns': 'Campaigns',
  '/dashboard/campaigns/new': 'New Campaign',
  '/dashboard/automated': 'Recurring Automated Campaigns',
  '/dashboard/contacts': 'Contacts',
  '/dashboard/scheduled': 'Scheduled Messages',
  '/dashboard/messages': 'Message History',
  '/dashboard/sender-ids': 'Sender IDs',
  '/dashboard/api-keys': 'API Keys',
  '/dashboard/webhooks': 'Developer Webhooks',
  '/dashboard/topup': 'Top Up Credits',
};

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const branding = useBranding();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Notifications State
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [supportContact, setSupportContact] = useState<{ email?: string; phone?: string }>({});

  
  React.useEffect(() => {
    // Only allow customer role to access this shell
    if (!isLoading && user && user.role !== 'customer') {
      const roleRoutes: any = { super_admin: '/admin', reseller: '/reseller', customer: '/dashboard' };
      router.replace(roleRoutes[user.role] || '/login');
    }
  }, [user, isLoading, router]);

  React.useEffect(() => {
    if (user) {
      import('@/lib/services/notifications.service').then(({ NotificationsService }) => {
        NotificationsService.getUnread().then(setNotifications).catch(console.error);
      });
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      import('@/lib/services/settings.service').then(({ SettingsService }) => {
        SettingsService.getMySettings().then(data => {
          if (data) setSupportContact({ email: data.support_email || '', phone: data.support_phone || '' });
        }).catch(console.error);
      });
    }
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    const { NotificationsService } = await import('@/lib/services/notifications.service');
    await NotificationsService.markAsRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const pageTitle = pageTitles[pathname] ?? 'Dashboard';

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#1a1f36',
        color: '#fff',
      }}
    >
      {/* Logo / Brand */}
      <Box component={NextLink} href="/" sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "center", height: 60, textDecoration: "none", overflow: "hidden", flexShrink: 0 }}>
        {branding.logoUrl ? (
          // Reseller custom logo
          <Box
            component="img"
            src={branding.logoUrl}
            alt={branding.companyName}
            sx={{ height: 80, width: 'auto', maxWidth: '100%', objectFit: 'contain', borderRadius: 1 }}
          />
        ) : (
          <Box
            component="img"
            src="/logo.png"
            alt="V SMS Logo"
            sx={{ height: 80, width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
          />
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mx: 2 }} />

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: 6 }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.2)", borderRadius: 3 }, "&::-webkit-scrollbar-track": { bgcolor: "transparent" } }}>
      <List sx={{ px: 1.5, pt: 2 }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NextLink}
                href={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 1.5,
                  px: 2,
                  py: 1,
                  color: active ? '#fff' : '#8892b0',
                  bgcolor: active ? (branding.primaryColor || '#f26f2e') : 'transparent',
                  '&:hover': {
                    bgcolor: active ? (branding.primaryColor || '#f26f2e') : 'rgba(255,255,255,0.06)',
                    color: '#fff',
                  },
                  transition: 'all 0.15s',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: 'inherit',
                    '& svg': { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      </Box>

      {/* Need Help? Support Card */}
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
        <Box
          sx={{
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.05)',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: (branding.primaryColor || '#f26f2e'), fontSize: '0.8rem' }}>
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#fff', fontSize: '0.8rem' }}>
              {user?.name ?? 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#7c84a8', fontSize: '0.65rem' }}>
              Customer
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
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
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
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              border: 'none',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1,display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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

            <Typography variant="h6" fontWeight={700} sx={{ flex: 1, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
              {pageTitle}
            </Typography>

            {/* Live badge */}
            <Chip
              label="● GATEWAY LIVE"
              size="small"
              sx={{
                bgcolor: '#e8f5e9',
                color: '#2e7d32',
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: 0.8,
                display: { xs: 'none', sm: 'flex' },
              }}
            />

            {/* Credit balance */}
            <Chip
              label={`Rs. ${parseFloat(user?.creditBalance ?? '0').toFixed(2)}`}
              size="small"
              sx={{
                bgcolor: (branding.primaryColor || '#f26f2e') + '1A',
                color: (branding.primaryColor || '#f26f2e'),
                fontWeight: 700,
                fontSize: '0.75rem',
                display: { xs: 'none', sm: 'flex' },
              }}
            />

            <Tooltip title="Notifications">
              <IconButton size="small" onClick={e => setNotifAnchorEl(e.currentTarget)}>
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Help">
              <IconButton size="small">
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Avatar menu */}
            <IconButton
              onClick={e => setAnchorEl(e.currentTarget)}
              sx={{ p: 0.5 }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: (branding.primaryColor || '#f26f2e'),
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 4,
                sx: { mt: 1, minWidth: 180, borderRadius: 2 },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); router.push('/dashboard/profile'); }}>
                <AccountCircleIcon fontSize="small" sx={{ mr: 1.5 }} />
                Profile
              </MenuItem>
              <MenuItem
                onClick={() => { setAnchorEl(null); logout(); }}
                sx={{ color: 'error.main' }}
              >
                <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, maxWidth: '100%' }}>
          {children}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            borderTop: '1px solid #e8eaf0',
            bgcolor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {branding.isWhitelabel ? (
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
          <Typography variant="caption" color="text.secondary">
            Powered by {branding.isWhitelabel ? (branding.companyName || 'SMS Gateway') : 'V SMS'} v1.0
          </Typography>
        </Box>
      </Box>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notifAnchorEl}
        open={Boolean(notifAnchorEl)}
        onClose={() => setNotifAnchorEl(null)}
        PaperProps={{
          elevation: 3,
          sx: { width: 320, maxHeight: 400, mt: 1.5, borderRadius: 2 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" fontWeight={600}>Notifications</Typography>
          {notifications.length > 0 && (
            <Chip label={`${notifications.length} unread`} size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />
          )}
        </Box>
        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <ListItem sx={{ py: 3, justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">No new notifications</Typography>
            </ListItem>
          ) : (
            notifications.map(n => (
              <ListItem key={n.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid #f8f9fa' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={600} color="error.main">
                    {n.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1, pr: 2 }}>
                  {n.message}
                </Typography>
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ cursor: 'pointer', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => handleMarkAsRead(n.id)}
                >
                  Mark as read
                </Typography>
              </ListItem>
            ))
          )}
        </List>
      </Menu>

    </Box>
  );
}
