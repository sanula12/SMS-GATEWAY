'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import Image from 'next/image';
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
import DashboardIcon      from '@mui/icons-material/Dashboard';
import PeopleIcon         from '@mui/icons-material/People';
import GroupsIcon         from '@mui/icons-material/Groups';
import BadgeIcon          from '@mui/icons-material/Badge';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SettingsIcon from '@mui/icons-material/Settings';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import ReceiptLongIcon    from '@mui/icons-material/ReceiptLong';
import MenuIcon           from '@mui/icons-material/Menu';
import LogoutIcon         from '@mui/icons-material/Logout';
import AccountCircleIcon  from '@mui/icons-material/AccountCircle';
import NotificationsIcon  from '@mui/icons-material/Notifications';
import HelpOutlineIcon    from '@mui/icons-material/HelpOutline';
import SmsIcon            from '@mui/icons-material/Sms';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HandshakeIcon from '@mui/icons-material/Handshake';
import { useAuth } from '@/context/AuthContext';

// ── Constants ──────────────────────────────────────────────────────────────
export const ADMIN_DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Overview',     icon: <DashboardIcon />,  href: '/admin' },
  { label: 'Accounts',     icon: <PeopleIcon />,      href: '/admin/accounts' },
  { label: 'Resellers',    icon: <GroupsIcon />,      href: '/admin/resellers' },
  { label: 'Sender IDs',   icon: <BadgeIcon />,       href: '/admin/sender-ids' },
  { label: 'Transactions', icon: <ReceiptLongIcon />, href: '/admin/transactions' },
  { label: 'Packages',     icon: <LocalOfferIcon />,  href: '/admin/packages' },
  { label: 'Moderation',   icon: <AdminPanelSettingsIcon />, href: '/admin/moderation' },
  { label: 'Global Logs',  icon: <SmsIcon />,         href: '/admin/logs' },
  { label: 'Inquiries',    icon: <HandshakeIcon />,   href: '/admin/inquiries' },
  { label: 'Support',      icon: <LiveHelpIcon />,    href: '/admin/tickets' },
  { label: 'Settings',     icon: <SettingsIcon />,    href: '/admin/settings' },
];

const pageTitles: Record<string, string> = {
  '/admin':                'Admin Overview',
  '/admin/accounts':       'Accounts',
  '/admin/resellers':      'Resellers',
  '/admin/sender-ids':     'Sender ID Approvals',
  '/admin/transactions':   'Credit Transactions',
  '/admin/packages':       'Packages',
  '/admin/moderation':     'Campaign Moderation',
  '/admin/logs':           'Global SMS Logs',
  '/admin/inquiries':      'Reseller Inquiries',
  '/admin/settings':       'System Settings',
};

// ── Component ──────────────────────────────────────────────────────────────
interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'));
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout, isLoading } = useAuth();
  React.useEffect(() => {
    // Only allow super_admin role to access this shell
    if (!isLoading && user && user.role !== 'super_admin') {
      const roleRoutes: any = { super_admin: '/admin', reseller: '/reseller', customer: '/dashboard' };
      router.replace(roleRoutes[user.role] || '/login');
    }
  }, [user, isLoading, router]);


  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl,   setAnchorEl]   = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  React.useEffect(() => {
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

  const pageTitle = pageTitles[pathname] ?? 'Admin';

  // ── Sidebar content ────────────────────────────────────────────────────
  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1a1f36', color: '#fff' }}>

      {/* Logo */}
      <Box component={NextLink} href="/" sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "center", height: 60, textDecoration: "none", overflow: "hidden", flexShrink: 0 }}>
        <Box
          component="img"
          src="/logo.png"
          alt="V SMS Logo"
          sx={{ height: 80, width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
        />
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mx: 2 }} />

      {/* Nav items */}
      <Box sx={{ flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: 6 }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.2)", borderRadius: 3 }, "&::-webkit-scrollbar-track": { bgcolor: "transparent" } }}>
      <List sx={{ px: 1.5, pt: 2 }}>
        {navItems.map(item => {
          const active =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NextLink}
                href={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 1.5, px: 2, py: 1,
                  color:  active ? '#fff' : '#8892b0',
                  bgcolor: active ? '#f26f2e' : 'transparent',
                  '&:hover': {
                    bgcolor: active ? '#f26f2e' : 'rgba(255,255,255,0.06)',
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

      {/* Bottom user card */}
      <Box sx={{ p: 2, flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <Box sx={{
          borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)',
          p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#f26f2e', fontSize: '0.8rem' }}>
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap
              sx={{ color: '#fff', fontSize: '0.8rem' }}>
              {user?.name ?? 'Admin'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#ef9a9a', fontSize: '0.65rem' }}>
              Super Admin
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // ── Shell ──────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f2f9' }}>

      {/* Sidebar — desktop (permanent) */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: ADMIN_DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: ADMIN_DRAWER_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Sidebar — mobile (temporary) */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: ADMIN_DRAWER_WIDTH, border: 'none' },
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

            {/* Admin badge */}
            <Chip
              icon={<AdminPanelSettingsIcon sx={{ fontSize: '14px !important' }} />}
              label="ADMIN"
              size="small"
              sx={{
                bgcolor: '#fde8e8',
                color: '#f26f2e',
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: 0.8,
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
            <IconButton onClick={e => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#f26f2e', fontSize: '0.85rem', fontWeight: 700 }}>
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
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
              <MenuItem onClick={() => { setAnchorEl(null); router.push('/admin/profile'); }}>
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
                <Typography variant="subtitle2" fontWeight={700}>Admin Notifications</Typography>
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
                        cursor: n.type === 'inquiry' || n.type === 'ticket' ? 'pointer' : 'default',
                        '&:hover': { bgcolor: '#f8fafc' },
                      }}
                      onClick={() => {
                        if (n.type === 'inquiry') {
                          router.push('/admin/inquiries');
                          setNotifAnchorEl(null);
                        } else if (n.type === 'ticket') {
                          router.push('/admin/tickets');
                          setNotifAnchorEl(null);
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={n.type}
                            size="small"
                            color={n.type === 'inquiry' ? 'primary' : n.type === 'ticket' ? 'warning' : 'default'}
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
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Admin Panel v1.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
