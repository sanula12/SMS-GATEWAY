'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Avatar,
  Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Tooltip,
  InputAdornment, Alert, Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { AccountsService } from '@/lib/services/accounts.service';
import StatusChip from '@/components/ui/Statuschip';
import EmptyState from '@/components/ui/Emptystate';

export default function AdminResellersPage() {
  const [resellers, setResellers] = useState<any[]>([]);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Create reseller dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Top up dialog
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAccount, setTopUpAccount] = useState<any>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await AccountsService.getAll();
      setAllAccounts(data);
      const r = data.filter((a: any) => a.role === 'reseller');
      setResellers(r);
      setFiltered(r);
    } catch {
      showSnackbar('Failed to load resellers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search) { setFiltered(resellers); return; }
    setFiltered(resellers.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, resellers]);

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const getCustomerCount = (resellerId: string) =>
    allAccounts.filter(a => a.parentId === resellerId).length;

  const handleCreate = async () => {
    setCreateLoading(true);
    setCreateError('');
    try {
      await AccountsService.create({ ...createForm, role: 'reseller' });
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '' });
      showSnackbar('Reseller created successfully', 'success');
      load();
    } catch (err: any) {
      setCreateError(err.response?.data?.message ?? 'Failed to create reseller');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAccount || !topUpAmount) return;
    setTopUpLoading(true);
    try {
      await AccountsService.topUp(topUpAccount.id, parseFloat(topUpAmount));
      setTopUpOpen(false);
      setTopUpAmount('');
      showSnackbar(`Credits added to ${topUpAccount.name}`, 'success');
      load();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message ?? 'Top up failed', 'error');
    } finally {
      setTopUpLoading(false);
    }
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search resellers..."
          size="small" value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220, bgcolor: '#fff', borderRadius: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
          sx={{ bgcolor: '#e53935', '&:hover': { bgcolor: '#c62828' }, borderRadius: 2 }}>
          New Reseller
        </Button>
      </Box>

      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Resellers', value: resellers.length, color: '#e53935', bgcolor: '#fde8e8' },
          { label: 'Active', value: resellers.filter(r => r.status === 'active').length, color: '#4caf50', bgcolor: '#e8f5e9' },
          { label: 'Total Customers Under Resellers', value: resellers.reduce((sum, r) => sum + getCustomerCount(r.id), 0), color: '#f26f2e', bgcolor: '#fee8db' },
          { label: 'Total Credits Held', value: `Rs. ${resellers.reduce((sum, r) => sum + parseFloat(r.creditBalance ?? '0'), 0).toFixed(2)}`, color: '#ff9800', bgcolor: '#fff3e0' },
        ].map(s => (
          <Card key={s.label} elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 2, p: 2, flex: 1, minWidth: 160 }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
          </Card>
        ))}
      </Box>

      {/* Table */}
      <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <EmptyState description="No resellers found" />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafbff' }}>
                  {['Reseller', 'Email', 'Status', 'Customers', 'Credit Balance', 'Joined', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((reseller, i) => (
                  <TableRow key={reseller.id} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { bgcolor: '#f0f4ff' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#e53935', fontSize: '0.8rem' }}>
                          {reseller.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{reseller.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{reseller.email}</Typography></TableCell>
                    <TableCell><StatusChip status={reseller.status} /></TableCell>
                    <TableCell>
                      <Chip label={getCustomerCount(reseller.id)} size="small"
                        sx={{ bgcolor: '#fee8db', color: '#f26f2e', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#4caf50' }}>
                        Rs. {parseFloat(reseller.creditBalance ?? '0').toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(reseller.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Top up credits">
                        <IconButton size="small" sx={{ color: '#4caf50' }}
                          onClick={() => { setTopUpAccount(reseller); setTopUpOpen(true); }}>
                          <AttachMoneyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Create reseller dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Reseller</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {createError && <Alert severity="error">{createError}</Alert>}
          <TextField label="Full Name" size="small" fullWidth value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
          <TextField label="Email" size="small" fullWidth type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
          <TextField label="Password" size="small" fullWidth type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createLoading}
            sx={{ bgcolor: '#e53935', '&:hover': { bgcolor: '#c62828' } }}>
            {createLoading ? <CircularProgress size={18} /> : 'Create Reseller'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Top up dialog */}
      <Dialog open={topUpOpen} onClose={() => setTopUpOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Top Up Reseller Credits</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">Reseller</Typography>
            <Typography variant="subtitle2" fontWeight={700}>{topUpAccount?.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              Current balance: Rs. {parseFloat(topUpAccount?.creditBalance ?? '0').toFixed(2)}
            </Typography>
          </Box>
          <TextField
            label="Amount" size="small" fullWidth type="number"
            value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTopUpOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTopUp} disabled={topUpLoading || !topUpAmount}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}>
            {topUpLoading ? <CircularProgress size={18} /> : 'Add Credits'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}