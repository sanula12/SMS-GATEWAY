'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, CircularProgress,
  Button,
Select, MenuItem, FormControl } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SendIcon from '@mui/icons-material/Send';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter } from 'next/navigation';
import { StatsService } from '@/lib/services/stats.service';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

function StatCard({ title, value, icon, color, bgcolor, subtitle }: any) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ color, '& svg': { fontSize: 26 } }}>{icon}</Box>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800}>{value}</Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ResellerOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');

  useEffect(() => {
    StatsService.getResellerDashboardStats(range)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!stats) return <Typography>Error loading stats</Typography>;

  const { overall, dailySms, topCustomers } = stats;

  const smsOptions = {
    chart: { type: 'area' as const, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
    colors: ['#4caf50', '#f44336'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
    xaxis: { categories: dailySms.map((d: any) => new Date(d.date).getDate() + ' ' + new Date(d.date).toLocaleString('default', { month: 'short' })),
             labels: { style: { colors: '#6B7280', fontSize: '12px' } },
             axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: '#6B7280' } } },
    grid: { borderColor: '#F3F4F6', strokeDashArray: 4, yaxis: { lines: { show: true } } },
    legend: { position: 'top' as const, horizontalAlign: 'right' as const },
    tooltip: { theme: 'light' as const }
  };

  const smsSeries = [
    { name: 'Delivered', data: dailySms.map((d: any) => d.delivered) },
    { name: 'Failed', data: dailySms.map((d: any) => d.failed) },
  ];

  return (
    <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Overview of your customers' SMS volume and revenue.</Typography>
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

      {/* Top row stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Total Customers" value={overall.totalCustomers} subtitle={`${overall.activeCustomers} active`} icon={<PeopleIcon />} color="#7c3aed" bgcolor="#f3e8ff" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Total SMS Sent" value={overall.totalSms.toLocaleString()} subtitle="All time" icon={<SendIcon />} color="#0284c7" bgcolor="#e0f2fe" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Total Revenue" value={`Rs. ${overall.totalRevenue.toLocaleString()}`} subtitle="From package sales" icon={<AttachMoneyIcon />} color="#059669" bgcolor="#d1fae5" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Profit" value={`Rs. ${overall.totalProfit.toLocaleString()}`} subtitle="After wholesale cost" icon={<AttachMoneyIcon />} color="#d97706" bgcolor="#fef3c7" />
        </Grid>
      </Grid>

      {/* Second row stats (Delivery rate) */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard title="Delivered SMS" value={overall.totalDelivered.toLocaleString()} icon={<CheckCircleIcon />} color="#4caf50" bgcolor="#e8f5e9" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard title="Failed SMS" value={overall.totalFailed.toLocaleString()} icon={<ErrorIcon />} color="#f44336" bgcolor="#ffebee" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Customer SMS Volume (Last 30 Days)</Typography>
            {dailySms.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography color="text.secondary">No SMS data available for the last 30 days.</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 350 }}>
                <Chart options={smsOptions} series={smsSeries} type="area" height="100%" />
              </Box>
            )}
          </Card>
        </Grid>

        {/* Top Customers */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, height: '100%' }}>
            <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f2f9' }}>
              <Typography variant="h6" fontWeight={700}>Top Customers</Typography>
              <Button endIcon={<ArrowForwardIcon />} size="small" onClick={() => router.push('/reseller/customers')} sx={{ textTransform: 'none' }}>
                All
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fafbff' }}>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>SMS Sent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topCustomers.length === 0 ? (
                    <TableRow><TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>No customer data yet</TableCell></TableRow>
                  ) : (
                    topCustomers.map((c: any) => (
                      <TableRow key={c.accountId} sx={{ '&:hover': { bgcolor: '#f5f0ff' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: '#7c3aed', fontSize: '0.75rem' }}>
                              {c.accountName?.[0]?.toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>{c.accountName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#0284c7' }}>
                            {c.total.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}