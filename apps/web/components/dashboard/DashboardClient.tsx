'use client';

import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Button, Grid, Avatar, TextField, CircularProgress, Divider, Select, MenuItem, FormControl } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import BoltIcon from '@mui/icons-material/Bolt';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { SenderIdsService } from '@/lib/services/sender-ids.service';

export default function DashboardClient() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  
  // Dashboard Data State
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const [deliveryRate, setDeliveryRate] = useState(0);
  const [sparklineData, setSparklineData] = useState<{date?: string, val: number}[]>([{val: 0}]);
  const [range, setRange] = useState('30');
  
  // Quick Fire SMS State
  const [quickPhone, setQuickPhone] = useState('');
  const [quickMsg, setQuickMsg] = useState('');
  const [quickSenderId, setQuickSenderId] = useState('');
  const [quickSending, setQuickSending] = useState(false);
  const [senderIds, setSenderIds] = useState<any[]>([]);

  const premiumShadow = '0px 2px 4px rgba(0, 0, 0, 0.04), 0px 4px 6px rgba(0, 0, 0, 0.02)';

  // Fetch recent messages and stats on load
  const loadDashboardData = async () => {
    try {
      setLoadingData(true);
      const [messagesRes, statsRes, sendersRes] = await Promise.all([
        api.get('/sms/messages'),
        api.get(`/stats/dashboard?range=${range}`),
        SenderIdsService.getAll().catch(() => []) // Catch error so dashboard doesn't fail
      ]);
      
      const messagesPayload = messagesRes.data;
      setMessages(messagesPayload?.data ?? messagesPayload ?? []);
      
      const stats = statsRes.data;
      setTotalMessages(stats.messages);
      setDeliveryRate(stats.messages > 0 ? Math.round((stats.delivered / stats.messages) * 100) : 0);
      
      if (stats.dailySms && stats.dailySms.length > 0) {
        setSparklineData(stats.dailySms);
      } else {
        setSparklineData([{val: 0}]);
      }

      // Handle sender IDs
      const sendersData = sendersRes?.data ?? sendersRes ?? [];
      setSenderIds(Array.isArray(sendersData) ? sendersData.filter((s: any) => s.status === 'approved') : []);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [range]);

  // Silent auto-polling every 5 seconds for Live Dispatch
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/sms/messages');
        const messagesPayload = res.data;
        setMessages(messagesPayload?.data ?? messagesPayload ?? []);
      } catch (e) {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Quick Fire Submit
  const handleQuickFire = async () => {
    if (!quickPhone || !quickMsg) return;
    setQuickSending(true);
    try {
      await api.post('/sms/send', {
        to: quickPhone,
        body: quickMsg,
        ...(quickSenderId ? { from: quickSenderId } : {})
      });
      setQuickPhone('');
      setQuickMsg('');
      setQuickSenderId('');
      // Reload data to show new message in timeline
      loadDashboardData();
      
      // Optionally refresh user balance
      const meRes = await api.get('/auth/me');
      updateUser({ creditBalance: meRes.data.creditBalance });
      
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send quick message');
    } finally {
      setQuickSending(false);
    }
  };

    return (
    <Box sx={{ maxWidth: '100%', pb: 6, pt: 1 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={800} color="text.primary">Dashboard</Typography>
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

      {/* 1. The Hero Wallet Banner (Dark Gradient) */}
      <Card elevation={0} sx={{ 
        p: { xs: 3, sm: 4 }, mb: 4, borderRadius: 3, 
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
        color: '#fff',
        boxShadow: premiumShadow,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3
      }}>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', mb: 1, display: 'block' }}>
            Available Balance
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
            <Typography sx={{ fontSize: { xs: '2rem', sm: '2.5rem' }, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Rs. {parseFloat(user?.creditBalance || '0').toFixed(2)}</Typography>
            <Typography sx={{ fontSize: '0.9rem', color: '#10B981', fontWeight: 600 }}>~ {Math.floor(parseFloat(user?.creditBalance || '0'))} SMS</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.85rem', color: '#D1D5DB', mt: 1 }}>
            Welcome back, {user?.name || user?.email || 'User'}. Your gateway is online and healthy.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={() => router.push('/dashboard/topup')} variant="contained" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, borderRadius: 2, fontWeight: 600, px: 3 }}>
            Add Funds
          </Button>
          <Button onClick={() => router.push('/dashboard/send')} variant="contained" startIcon={<SendIcon sx={{ width: 16 }} />} sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, fontWeight: 600, px: 3 }}>
            New Campaign
          </Button>
        </Box>
      </Card>

      <Grid container spacing={3}>
        {/* LEFT COLUMN: Timeline & Health */}
        <Grid size={{ xs: 12, md: 8 }} >
          
          {/* Health Sparklines */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card elevation={0} sx={{ p: 2.5, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Delivery Rate</Typography>
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', mt: 0.5 }}>{deliveryRate}%</Typography>
                </Box>
                <Box sx={{ width: 100, height: 40 }}>
                  <ResponsiveContainer>
                    <AreaChart data={sparklineData}>
                      <Area type="monotone" dataKey="val" stroke="#10B981" strokeWidth={2} fill="#D1FAE5" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card elevation={0} sx={{ p: 2.5, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Dispatch Volume</Typography>
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', mt: 0.5 }}>{totalMessages}</Typography>
                </Box>
                <Box sx={{ width: 100, height: 40 }}>
                  <ResponsiveContainer>
                    <AreaChart data={sparklineData}>
                      <Area type="monotone" dataKey="val" stroke="#4f46e5" strokeWidth={2} fill="#E0E7FF" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Live Dispatch Timeline */}
          <Card elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <TimelineIcon sx={{ color: '#4f46e5' }} />
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Live Dispatch</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxHeight: 400, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '4px' } }}>
              {loadingData ? (
                <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', textAlign: 'center', py: 4 }}>Loading timeline...</Typography>
              ) : messages.length === 0 ? (
                <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', textAlign: 'center', py: 4 }}>No activity yet. Send a message to see it here.</Typography>
              ) : (
                messages.slice(0, 15).map((msg, idx) => (
                  <React.Fragment key={msg.id}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {msg.status === 'delivered' ? (
                        <Avatar sx={{ bgcolor: '#D1FAE5', color: '#10B981', width: 36, height: 36 }}><CheckCircleIcon sx={{ fontSize: 20 }} /></Avatar>
                      ) : msg.status === 'sent' ? (
                        <Avatar sx={{ bgcolor: '#DBEAFE', color: '#3B82F6', width: 36, height: 36 }}><CheckCircleIcon sx={{ fontSize: 20 }} /></Avatar>
                      ) : msg.status === 'failed' || msg.status === 'rejected' ? (
                        <Avatar sx={{ bgcolor: '#FEE2E2', color: '#EF4444', width: 36, height: 36 }}><ErrorOutlineIcon sx={{ fontSize: 20 }} /></Avatar>
                      ) : (
                        <Avatar sx={{ bgcolor: '#FEF3C7', color: '#F59E0B', width: 36, height: 36 }}><ScheduleIcon sx={{ fontSize: 20 }} /></Avatar>
                      )}
                      
                      <Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                          {msg.status === 'delivered' ? 'Message delivered successfully' : msg.status === 'sent' ? 'Dispatched to carrier' : msg.status === 'failed' || msg.status === 'rejected' ? 'Message failed to deliver' : 'Message queued'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', mt: 0.5 }}>
                          To: {msg.to} via {msg.from || 'Default Mask'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', fontStyle: 'italic', mt: 0.5 }}>
                          "{msg.body}"
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF', mt: 0.5, fontWeight: 500 }}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </Typography>
                      </Box>
                    </Box>
                    {idx < messages.slice(0, 15).length - 1 && <Divider sx={{ borderColor: '#F3F4F6' }} />}
                  </React.Fragment>
                ))
              )}
            </Box>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: Quick Fire Widget */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, bgcolor: '#F9FAFB' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <BoltIcon sx={{ color: '#F59E0B' }} />
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Quick Fire</Typography>
            </Box>
            
            <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', mb: 3 }}>
              Instantly dispatch a single message without leaving the dashboard.
            </Typography>

            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', mb: 1 }}>Recipient Number</Typography>
            <TextField 
              fullWidth size="small" placeholder="+94771234567" 
              value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)}
              sx={{ mb: 2, bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} 
            />
            
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', mb: 1 }}>Sender ID</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2, bgcolor: '#fff' }}>
              <Select value={quickSenderId} displayEmpty onChange={e => setQuickSenderId(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value=""><em>System Default</em></MenuItem>
                {senderIds.map(s => <MenuItem key={s.id} value={s.senderId}>{s.senderId ?? s.name}</MenuItem>)}
              </Select>
            </FormControl>
            
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', mb: 1 }}>Message</Typography>
            <TextField 
              fullWidth size="small" multiline rows={4} placeholder="Type your message..." 
              value={quickMsg} onChange={(e) => setQuickMsg(e.target.value)}
              sx={{ mb: 3, bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} 
            />

            <Button 
              fullWidth variant="contained" 
              onClick={handleQuickFire}
              disabled={quickSending || !quickPhone || !quickMsg}
              sx={{ bgcolor: '#111827', '&:hover': { bgcolor: '#374151' }, borderRadius: 2, py: 1.2, fontWeight: 600 }}
            >
              {quickSending ? <CircularProgress size={20} color="inherit" /> : 'Dispatch Now'}
            </Button>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}