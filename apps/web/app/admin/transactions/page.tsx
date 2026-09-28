'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress,
  Chip, TextField, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { AccountsService } from '@/lib/services/accounts.service';
import EmptyState from '@/components/ui/Emptystate';

export default function AdminTransactionsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const accs = await AccountsService.getAll();
        setAccounts(accs);

        

        const allTx: any[] = [];
        for (const acc of accs.slice(0, 20)) {
          try {
            const history = await AccountsService.getCreditHistory(acc.id);
            allTx.push(...history.map((tx: any) => ({ ...tx, accountName: acc.name, accountEmail: acc.email })));
          } catch {}
        }
        

        const sorted = allTx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(sorted);
        setFiltered(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(transactions); return; }
    setFiltered(transactions.filter(t =>
      t.accountName?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, transactions]);

  const typeColor: Record<string, { bg: string; color: string }> = {
    topup:    { bg: '#e8f5e9', color: '#2e7d32' },
    deduction:{ bg: '#fde8e8', color: '#c62828' },
    transfer: { bg: '#fee8db', color: '#3949ab' },
    refund:   { bg: '#fff3e0', color: '#e65100' },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search by account or description..."
          size="small" value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, bgcolor: '#fff', borderRadius: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
      </Box>

      <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <EmptyState description="No transactions found" />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafbff' }}>
                  {['Account', 'Type', 'Amount', 'Balance Before', 'Balance After', 'Description', 'Date'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((tx, i) => {
                  const cfg = typeColor[tx.type] ?? { bg: '#f5f5f5', color: '#333' };
                  const amount = parseFloat(tx.amount ?? '0');
                  return (
                    <TableRow key={tx.id} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { bgcolor: '#f0f4ff' } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{tx.accountName}</Typography>
                        <Typography variant="caption" color="text.secondary">{tx.accountEmail}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={tx.type} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {amount >= 0
                            ? <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                            : <TrendingDownIcon sx={{ fontSize: 16, color: '#f44336' }} />}
                          <Typography variant="body2" fontWeight={700} sx={{ color: amount >= 0 ? '#4caf50' : '#f44336' }}>
                            {amount >= 0 ? '+' : ''}{amount.toFixed(4)}
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
    </Box>
  );
}