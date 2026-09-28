'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress,
  Chip, TextField, InputAdornment, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { AccountsService } from '@/lib/services/accounts.service';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/ui/Emptystate';

export default function ResellerCreditsPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Quick transfer
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const accs = await AccountsService.getAll();
      setCustomers(accs);

      // Load my own credit history
      if (user?.id) {
        const history = await AccountsService.getCreditHistory(user.id);
        setTransactions(history);
        setFiltered(history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (!search) { setFiltered(transactions); return; }
    setFiltered(transactions.filter((t: any) =>
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.type?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, transactions]);

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const handleTransfer = async () => {
    if (!selectedCustomer || !transferAmount) return;
    setTransferLoading(true);
    try {
      await AccountsService.transferCredits(selectedCustomer, parseFloat(transferAmount));
      setTransferOpen(false);
      setSelectedCustomer('');
      setTransferAmount('');
      showSnackbar('Credits transferred successfully', 'success');
      load();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message ?? 'Transfer failed', 'error');
    } finally {
      setTransferLoading(false);
    }
  };

  const typeColor: Record<string, { bg: string; color: string }> = {
    topup:    { bg: '#e8f5e9', color: '#2e7d32' },
    deduction:{ bg: '#fde8e8', color: '#c62828' },
    transfer: { bg: '#f3e8ff', color: '#6d28d9' },
    refund:   { bg: '#fff3e0', color: '#e65100' },
  };

  return (
    <Box>
      {/* Balance + quick transfer */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, p: 2.5, flex: 1, minWidth: 200 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.7rem' }}>
            My Credit Balance
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#7c3aed', mt: 0.5 }}>
            Rs. {parseFloat(user?.creditBalance ?? '0').toFixed(2)}
          </Typography>
          <Typography variant="caption" color="text.secondary">Available to transfer to customers</Typography>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<SwapHorizIcon />}
            onClick={() => setTransferOpen(true)}
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, borderRadius: 2, py: 1.5, px: 3 }}
          >
            Transfer Credits
          </Button>
        </Card>
      </Box>

      {/* Transaction history */}
      <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f0f2f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>Credit History</Typography>
          <TextField
            placeholder="Search transactions..."
            size="small" value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ bgcolor: '#f8f9ff', borderRadius: 2, width: 220 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <EmptyState description="No transactions yet" />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafbff' }}>
                  {['Type', 'Amount', 'Balance Before', 'Balance After', 'Description', 'Date'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((tx: any, i: number) => {
                  const cfg = typeColor[tx.type] ?? { bg: '#f5f5f5', color: '#333' };
                  const amount = parseFloat(tx.amount ?? '0');
                  return (
                    <TableRow key={tx.id} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { bgcolor: '#f5f0ff' } }}>
                      <TableCell>
                        <Chip label={tx.type} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {amount >= 0
                            ? <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                            : <TrendingDownIcon sx={{ fontSize: 16, color: '#f44336' }} />}
                          <Typography variant="body2" fontWeight={700} sx={{ color: amount >= 0 ? '#4caf50' : '#f44336' }}>
                            {amount >= 0 ? '+' : ''}Rs. {amount.toFixed(4)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">Rs. {parseFloat(tx.balanceBefore ?? '0').toFixed(4)}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>Rs. {parseFloat(tx.balanceAfter ?? '0').toFixed(4)}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{tx.description ?? '—'}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Transfer dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Transfer Credits to Customer</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Box sx={{ p: 2, bgcolor: '#f3e8ff', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">Your available balance</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#7c3aed' }}>
              Rs. {parseFloat(user?.creditBalance ?? '0').toFixed(2)}
            </Typography>
          </Box>
          <TextField
            select label="Select Customer" size="small" fullWidth
            value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="">-- Select a customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} (Rs. {parseFloat(c.creditBalance ?? '0').toFixed(2)})</option>
            ))}
          </TextField>
          <TextField
            label="Amount" size="small" fullWidth type="number"
            value={transferAmount} onChange={e => setTransferAmount(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTransfer} disabled={transferLoading || !selectedCustomer || !transferAmount}
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