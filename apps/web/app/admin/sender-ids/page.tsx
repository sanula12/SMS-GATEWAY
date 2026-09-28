'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton,
  CircularProgress, Tooltip, Alert, Snackbar, Chip,
  FormControl, InputLabel, Select, MenuItem, Link
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { SenderIdsService } from '@/lib/services/sender-ids.service';
import StatusChip from '@/components/ui/Statuschip';
import EmptyState from '@/components/ui/Emptystate';

export default function AdminSenderIdsPage() {
  const [senderIds, setSenderIds] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await SenderIdsService.getAll();
      setSenderIds(data);
    } catch {
      showSnackbar('Failed to load sender IDs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (statusFilter === 'all') { setFiltered(senderIds); return; }
    setFiltered(senderIds.filter(s => s.status === statusFilter));
  }, [statusFilter, senderIds]);

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected', name: string) => {
    if (!confirm(`Are you sure you want to ${status} this Sender ID?`)) return;
    try {
      await SenderIdsService.updateStatus(id, status);
      showSnackbar(`Sender ID "${name}" ${status}`, 'success');
      load();
    } catch {
      showSnackbar('Failed to update status', 'error');
    }
  };

  const pending   = senderIds.filter(s => s.status === 'pending').length;
  const approved  = senderIds.filter(s => s.status === 'approved').length;
  const rejected  = senderIds.filter(s => s.status === 'rejected').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Pending Approval', value: pending, color: '#ff9800', bgcolor: '#fff3e0' },
          { label: 'Approved', value: approved, color: '#4caf50', bgcolor: '#e8f5e9' },
          { label: 'Rejected', value: rejected, color: '#f44336', bgcolor: '#fde8e8' },
        ].map(s => (
          <Card key={s.label} elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 2, p: 2, flex: 1, minWidth: 140, cursor: 'pointer' }}
            onClick={() => setStatusFilter(s.label === 'Pending Approval' ? 'pending' : s.label.toLowerCase())}>
            <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 160, bgcolor: '#fff' }}>
          <InputLabel>Filter by status</InputLabel>
          <Select value={statusFilter} label="Filter by status" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        {pending > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, bgcolor: '#fff3e0', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: '#e65100', fontWeight: 600 }}>
              ⚠️ {pending} sender ID{pending > 1 ? 's' : ''} awaiting approval
            </Typography>
          </Box>
        )}
      </Box>

      <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <EmptyState description="No sender IDs found" />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafbff' }}>
                  {['Sender ID', 'Account ID', 'Documents', 'Routing', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item, i) => (
                  <TableRow key={item.id} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { bgcolor: '#f0f4ff' } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {item.senderId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {item.accountId?.slice(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {item.nicUrl && (
                          <Tooltip title="NIC">
                            <IconButton size="small" component={Link} href={item.nicUrl} target="_blank" sx={{ color: '#f26f2e' }}><FileOpenIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {item.brUrl && (
                          <Tooltip title="BR">
                            <IconButton size="small" component={Link} href={item.brUrl} target="_blank" sx={{ color: '#f26f2e' }}><FileOpenIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {item.requestLetterUrl && (
                          <Tooltip title="Request Letter">
                            <IconButton size="small" component={Link} href={item.requestLetterUrl} target="_blank" sx={{ color: '#f26f2e' }}><FileOpenIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {!item.nicUrl && !item.brUrl && !item.requestLetterUrl && (
                          <Typography variant="caption" color="text.secondary">No docs</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {item.resellerStatus === 'approved' && item.reviewedBy ? (
                         <Chip label="Forwarded by Reseller" size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      ) : (
                         <Chip label="Direct Request" size="small" color="default" sx={{ fontSize: '0.7rem' }} />
                      )}
                    </TableCell>
                    <TableCell><StatusChip status={item.status} /></TableCell>
                    <TableCell>
                      {item.status === 'pending' && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Approve">
                            <IconButton size="small" sx={{ color: '#4caf50' }}
                              onClick={() => handleUpdateStatus(item.id, 'approved', item.senderId)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" sx={{ color: '#f44336' }}
                              onClick={() => handleUpdateStatus(item.id, 'rejected', item.senderId)}>
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                      {item.status !== 'pending' && <Typography variant="caption" color="text.secondary">—</Typography>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}