'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar,
  CircularProgress, Button,
Select, MenuItem, FormControl } from '@mui/material';
import PeopleIcon               from '@mui/icons-material/People';
import GroupsIcon               from '@mui/icons-material/Groups';
import BlockIcon                from '@mui/icons-material/Block';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowForwardIcon         from '@mui/icons-material/ArrowForward';
import { useRouter }            from 'next/navigation';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { AccountsService }      from '@/lib/services/accounts.service';
import { StatsService, AdminDashboardStats } from '@/lib/services/stats.service';
import api                      from '@/lib/api';
import StatusChip               from '@/components/ui/Statuschip';
import { formatDate }           from '@/lib/utils';
import TrendingUpIcon           from '@mui/icons-material/TrendingUp';
import SmsIcon from '@mui/icons-material/Sms';
import DataTable, { ColumnDef } from '../shared/DataTable';

// ── Stat card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgcolor: string;
}

function StatCard({ title, value, icon, color, bgcolor }: StatCardProps) {

    return (
    <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
        <Box sx={{
          width: 52, height: 52, borderRadius: 2, bgcolor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Box sx={{ color, '& svg': { fontSize: 26 } }}>{icon}</Box>
        </Box>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="h5" fontWeight={800} noWrap>{value}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>{title}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AdminOverviewClient() {

    const columns: ColumnDef<any>[] = [
        { id: 'name', label: 'Name', render: (account) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: account.role === 'reseller' ? '#e53935' : '#4f6ef7' }}>
                    {account.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{account.name}</Typography>
            </Box>
        ) },
        { id: 'email', label: 'Email', render: (account) => <span style={{ color: 'text.secondary' }}>{account.email}</span> },
        { id: 'role', label: 'Role', render: (account) => (
            <Chip
                label={account.role.toUpperCase()}
                size="small"
                sx={{
                    bgcolor: account.role === 'reseller' ? '#ffebee' : '#eef2ff',
                    color: account.role === 'reseller' ? '#e53935' : '#4f6ef7',
                    fontWeight: 700, fontSize: '0.65rem', height: 20,
                }}
            />
        ) },
        { id: 'status', label: 'Status', render: (account) => <StatusChip status={account.status} /> },
        { id: 'credits', label: 'Credits', render: (account) => <span style={{ fontWeight: 700 }}>{parseFloat(account.creditBalance || '0').toLocaleString()}</span> },
        { id: 'joined', label: 'Joined', render: (account) => <span style={{ color: 'text.secondary' }}>{formatDate(account.createdAt)}</span> }
    ];

  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');
  const [health, setHealth] = useState<'online' | 'offline' | 'loading'>('loading');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    AccountsService.getAll()
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data ?? res ?? [];
        setAccounts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load accounts:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    StatsService.getAdminDashboardStats(range)
      .then((statsRes) => {
        if (!isMounted) return;
        setStats(statsRes);
      })
      .catch((err) => {
        console.warn('Could not load admin stats:', err);
      });

    api.get('/sms/admin/health')
      .then(res => {
        if (!isMounted) return;
        setHealth(res.data.status);
      })
      .catch(() => {
        if (isMounted) setHealth('offline');
      });

    return () => {
      isMounted = false;
    };
  }, [range]);

  const customers    = accounts.filter(a => a.role === 'customer');
  const resellers    = accounts.filter(a => a.role === 'reseller');
  const suspended    = accounts.filter(a => a.status === 'suspended');
  const totalCredits = accounts.reduce((sum, a) => sum + parseFloat(a.creditBalance ?? '0'), 0);

  const recent = [...accounts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
            {/* Stat cards */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">Overview of system metrics</Typography>
          </Box>
          <Chip 
            size="small" 
            label={health === 'loading' ? 'Checking Hutch API...' : health === 'online' ? 'Hutch API: ONLINE' : 'Hutch API: OFFLINE'}
            sx={{ 
              fontWeight: 700, 
              bgcolor: health === 'online' ? '#e8f5e9' : health === 'offline' ? '#ffebee' : '#f0f2f9',
              color: health === 'online' ? '#4caf50' : health === 'offline' ? '#f44336' : '#6b7280',
              border: `1px solid ${health === 'online' ? '#4caf50' : health === 'offline' ? '#f44336' : '#e5e7eb'}`
            }} 
            icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: health === 'online' ? '#4caf50' : health === 'offline' ? '#f44336' : '#9ca3af', ml: 1 }} />}
          />
        </Box>
        <Select 
          size="small" 
          value={range} 
          onChange={(e) => setRange(e.target.value)}
          sx={{ bgcolor: '#fff', minWidth: 150, borderRadius: 2 }}
        >
          <MenuItem value="7">Last 7 Days</MenuItem>
          <MenuItem value="30">Last 30 Days</MenuItem>
          <MenuItem value="90">Last 90 Days</MenuItem>
          <MenuItem value="all">Lifetime</MenuItem>
        </Select>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Total Customers" value={customers.length}
            icon={<PeopleIcon />} color="#4f6ef7" bgcolor="#eef2ff" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Total Resellers" value={resellers.length}
            icon={<GroupsIcon />} color="#e53935" bgcolor="#fde8e8" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title={range === 'all' ? "Lifetime Revenue" : `Revenue (Last ${range} Days)`} value={stats ? `Rs. ${stats.overall.totalGrossRevenue.toFixed(2)}` : '—'}
            icon={<AccountBalanceWalletIcon />} color="#4caf50" bgcolor="#e8f5e9" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title={range === 'all' ? "Est. Net Profit" : `Est. Profit (Last ${range} Days)`} value={stats ? `Rs. ${stats.overall.totalProfit.toFixed(2)}` : '—'}
            icon={<TrendingUpIcon />} color="#00bcd4" bgcolor="#e0f7fa" />
        </Grid>
      </Grid>

      {/* Charts */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Revenue Chart */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, p: 2, height: 350 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Revenue (Last 30 Days)</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={stats.dailyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8898aa' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#8898aa' }} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs. ${val}`} />
                  <RechartsTooltip cursor={{ fill: '#f8f9fc' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#4caf50" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* SMS Volume Chart */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, p: 2, height: 350 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>SMS Volume (Last 30 Days)</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={stats.dailySms}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8898aa' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#8898aa' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: '#f8f9fc' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="delivered" stackId="a" fill="#4f6ef7" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="failed" stackId="a" fill="#f44336" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recent accounts table */}
      <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
        <Box sx={{
          px: 3, py: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f0f2f9',
        }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Recent Accounts</Typography>
            <Typography variant="caption" color="text.secondary">Latest registered users</Typography>
          </Box>
          <Button
            endIcon={<ArrowForwardIcon />}
            size="small"
            onClick={() => router.push('/admin/accounts')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            View all
          </Button>
        </Box>

        <Box sx={{ p: -2 }}><DataTable columns={columns} data={recent} emptyMessage="No recent users found." /></Box>
      </Card>
    </Box>
  );
}

