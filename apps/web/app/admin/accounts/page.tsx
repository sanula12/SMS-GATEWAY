'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Avatar,
  Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Tooltip, InputAdornment,
  Alert, Snackbar, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { AccountsService } from '@/lib/services/accounts.service';
import StatusChip from '@/components/ui/Statuschip';
import EmptyState from '@/components/ui/Emptystate';

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Create account dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Top up dialog
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAccount, setTopUpAccount] = useState<any>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDesc, setTopUpDesc] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);

  // Edit account dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'customer', lowBalanceThreshold: '', password: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await AccountsService.getAll();
      setAccounts(data);
      setFiltered(data);
    } catch {
      showSnackbar('Failed to load accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = accounts;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => 
        a.name?.toLowerCase().includes(q) || 
        a.email?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q) ||
        a.id?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') result = result.filter(a => a.role === roleFilter);
    setFiltered(result);
  }, [search, roleFilter, accounts]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    setCreateError('');
    try {
      await AccountsService.create(createForm as any);
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'customer' });
      showSnackbar('Account created successfully', 'success');
      load();
    } catch (err: any) {
      setCreateError(err.response?.data?.message ?? 'Failed to create account');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAccount || !topUpAmount) return;
    setTopUpLoading(true);
    try {
      await AccountsService.topUp(topUpAccount.id, parseFloat(topUpAmount), topUpDesc);
      setTopUpOpen(false);
      setTopUpAmount('');
      setTopUpDesc('');
      showSnackbar(`Credits added to ${topUpAccount.name}`, 'success');
      load();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message ?? 'Top up failed', 'error');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleToggleStatus = async (account: any) => {
    const newStatus = account.status === 'active' ? 'suspended' : 'active';
    try {
      await AccountsService.update(account.id, { status: newStatus });
      showSnackbar(`Account ${newStatus}`, 'success');
      load();
    } catch {
      showSnackbar('Failed to update status', 'error');
    }
  };

  const handleEditOpen = (account: any) => {
    setEditAccount(account);
    setEditForm({
      name: account.name || '',
      email: account.email || '',
      phone: account.phone || '',
      role: account.role || 'customer',
      lowBalanceThreshold: account.lowBalanceThreshold || '',
      password: '', // Blank unless they want to change it
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editAccount) return;
    setEditLoading(true);
    setEditError('');
    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        lowBalanceThreshold: editForm.lowBalanceThreshold ? parseFloat(editForm.lowBalanceThreshold) : null,
      };
      if (editForm.password) payload.password = editForm.password;

      await AccountsService.update(editAccount.id, payload);
      setEditOpen(false);
      showSnackbar('Account updated successfully', 'success');
      load();
    } catch (err: any) {
      setEditError(err.response?.data?.message ?? 'Failed to update account');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by name or email..."
          size="small"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220, bgcolor: '#fff', borderRadius: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 140, bgcolor: '#fff' }}>
          <InputLabel>Role</InputLabel>
          <Select value={roleFilter} label="Role" onChange={e => setRoleFilter(e.target.value)}>
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="customer">Customer</MenuItem>
            <MenuItem value="reseller">Reseller</MenuItem>
            <MenuItem value="super_admin">Admin</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
          sx={{ bgcolor: '#e53935', '&:hover': { bgcolor: '#c62828' }, borderRadius: 2 }}>
          New Account
        </Button>
      </Box>

      {/* Table */}
      <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <EmptyState description="No accounts found" />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafbff' }}>
                  {['Account', 'Email', 'Role', 'Status', 'Credits', 'Source', 'Joined', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((account, i) => (
                  <TableRow key={account.id} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { bgcolor: '#f0f4ff' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: account.role === 'reseller' ? '#e53935' : '#f26f2e', fontSize: '0.8rem' }}>
                          {account.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{account.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{account.email}</Typography></TableCell>
                    <TableCell>
                      <Chip label={account.role} size="small" sx={{
                        bgcolor: account.role === 'super_admin' ? '#fde8e8' : account.role === 'reseller' ? '#fff3e0' : '#fee8db',
                        color: account.role === 'super_admin' ? '#e53935' : account.role === 'reseller' ? '#e65100' : '#f26f2e',
                        fontWeight: 700, fontSize: '0.7rem',
                      }} />
                    </TableCell>
                    <TableCell><StatusChip status={account.status} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#4caf50' }}>
                        Rs. {parseFloat(account.creditBalance ?? '0').toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {account.registrationSource?.replace('_', ' ') ?? 'direct'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(account.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit Account">
                          <IconButton size="small" sx={{ color: '#f26f2e' }}
                            onClick={() => handleEditOpen(account)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Top up credits">
                          <IconButton size="small" sx={{ color: '#4caf50' }}
                            onClick={() => { setTopUpAccount(account); setTopUpOpen(true); }}>
                            <AttachMoneyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={account.status === 'active' ? 'Suspend' : 'Activate'}>
                          <IconButton size="small" sx={{ color: account.status === 'active' ? '#f44336' : '#4caf50' }}
                            onClick={() => handleToggleStatus(account)}>
                            {account.status === 'active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
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

      {/* Create account dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Account</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {createError && <Alert severity="error">{createError}</Alert>}
          <TextField label="Full Name" size="small" fullWidth value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
          <TextField label="Email" size="small" fullWidth type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
          <TextField label="Password" size="small" fullWidth type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
          <FormControl size="small" fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={createForm.role} label="Role" onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}>
              <MenuItem value="customer">Customer</MenuItem>
              <MenuItem value="reseller">Reseller</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createLoading}
            sx={{ bgcolor: '#e53935', '&:hover': { bgcolor: '#c62828' } }}>
            {createLoading ? <CircularProgress size={18} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Top up dialog */}
      <Dialog open={topUpOpen} onClose={() => setTopUpOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Top Up Credits</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Box sx={{ p: 2, bgcolor: '#f0f4ff', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">Account</Typography>
            <Typography variant="subtitle2" fontWeight={700}>{topUpAccount?.name}</Typography>
            <Typography variant="caption" color="text.secondary">Current balance: Rs. {parseFloat(topUpAccount?.creditBalance ?? '0').toFixed(2)}</Typography>
          </Box>
          <TextField
            label="Amount" size="small" fullWidth type="number"
            value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
          <TextField label="Description (optional)" size="small" fullWidth value={topUpDesc} onChange={e => setTopUpDesc(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTopUpOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTopUp} disabled={topUpLoading || !topUpAmount}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}>
            {topUpLoading ? <CircularProgress size={18} /> : 'Add Credits'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit account dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Account</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {editError && <Alert severity="error">{editError}</Alert>}
          <TextField label="Full Name" size="small" fullWidth value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
          <TextField label="Email" size="small" fullWidth type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
          <TextField label="Phone" size="small" fullWidth value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
          
          <FormControl size="small" fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={editForm.role} label="Role" onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}>
              <MenuItem value="customer">Customer</MenuItem>
              <MenuItem value="reseller">Reseller</MenuItem>
              <MenuItem value="super_admin">Admin</MenuItem>
            </Select>
          </FormControl>
          
          <TextField label="Low Balance Threshold (Rs.)" size="small" fullWidth type="number" 
            value={editForm.lowBalanceThreshold} onChange={e => setEditForm(p => ({ ...p, lowBalanceThreshold: e.target.value }))} 
            helperText="Leave blank to use system default" />

          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary">Leave password blank unless resetting</Typography>
          <TextField label="New Password" size="small" fullWidth type="password" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editLoading}
            sx={{ bgcolor: '#f26f2e', '&:hover': { bgcolor: '#3b58c7' } }}>
            {editLoading ? <CircularProgress size={18} /> : 'Save Changes'}
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