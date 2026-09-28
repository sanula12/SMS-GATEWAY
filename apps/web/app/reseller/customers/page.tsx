'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Avatar,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Tooltip,
  InputAdornment, Alert, Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { AccountsService } from '@/lib/services/accounts.service';
import StatusChip from '@/components/ui/Statuschip';
import EmptyState from '@/components/ui/Emptystate';

export default function ResellerCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Create customer dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Transfer credits dialog
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await AccountsService.getAll();
      setCustomers(data);
      setFiltered(data);
    } catch {
      showSnackbar('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search) { setFiltered(customers); return; }
    setFiltered(customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, customers]);

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const handleCreate = async () => {
    setCreateLoading(true);
    setCreateError('');
    try {
      await AccountsService.create({ ...createForm, role: 'customer' });
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '' });
      showSnackbar('Customer created successfully', 'success');
      load();
    } catch (err: any) {
      setCreateError(err.response?.data?.message ?? 'Failed to create customer');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget || !transferAmount) return;
    setTransferLoading(true);
    try {
      await AccountsService.transferCredits(transferTarget.id, parseFloat(transferAmount));
      setTransferOpen(false);
      setTransferAmount('');
      showSnackbar(`Credits transferred to ${transferTarget.name}`, 'success');
      load();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message ?? 'Transfer failed', 'error');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleToggleStatus = async (customer: any) => {
    try {
      await AccountsService.update(customer.id, {
        status: customer.status === 'active' ? 'suspended' : 'active',
      });
      showSnackbar('Status updated', 'success');
      load();
    } catch {
      showSnackbar('Failed to update status', 'error');
    }
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search customers..."
          size="small" value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220, bgcolor: '#fff', borderRadius: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
          sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, borderRadius: 2 }}>
          New Customer
        </Button>
      </Box>

      {/* Table */}
      <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <EmptyState description="No customers found" />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafbff' }}>
                  {['Customer', 'Email', 'Status', 'Credits', 'Joined', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((c, i) => (
                  <TableRow key={c.id} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { bgcolor: '#f5f0ff' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#7c3aed', fontSize: '0.8rem' }}>
                          {c.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{c.email}</Typography></TableCell>
                    <TableCell><StatusChip status={c.status} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#4caf50' }}>
                        Rs. {parseFloat(c.creditBalance ?? '0').toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Transfer credits">
                          <IconButton size="small" sx={{ color: '#7c3aed' }}
                            onClick={() => { setTransferTarget(c); setTransferOpen(true); }}>
                            <AttachMoneyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={c.status === 'active' ? 'Suspend' : 'Activate'}>
                          <IconButton size="small" sx={{ color: c.status === 'active' ? '#f44336' : '#4caf50' }}
                            onClick={() => handleToggleStatus(c)}>
                            {c.status === 'active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Create customer dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Customer</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {createError && <Alert severity="error">{createError}</Alert>}
          <TextField label="Full Name" size="small" fullWidth value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
          <TextField label="Email" size="small" fullWidth type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
          <TextField label="Password" size="small" fullWidth type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createLoading}
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}>
            {createLoading ? <CircularProgress size={18} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer credits dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Transfer Credits</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Box sx={{ p: 2, bgcolor: '#f3e8ff', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">Transfer to</Typography>
            <Typography variant="subtitle2" fontWeight={700}>{transferTarget?.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              Their balance: Rs. {parseFloat(transferTarget?.creditBalance ?? '0').toFixed(2)}
            </Typography>
          </Box>
          <TextField
            fullWidth size="small" type="number" label="Amount to transfer"
            value={transferAmount} onChange={e => setTransferAmount(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTransfer} disabled={transferLoading || !transferAmount}
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}>
            {transferLoading ? <CircularProgress size={18} /> : 'Transfer'}
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