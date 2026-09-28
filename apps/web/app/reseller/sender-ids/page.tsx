'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Tooltip, Alert, Snackbar, Chip,
  Tabs, Tab, Link
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { SenderIdsService } from '@/lib/services/sender-ids.service';
import StatusChip from '@/components/ui/Statuschip';
import EmptyState from '@/components/ui/Emptystate';
import SenderIdsClient from '@/components/dashboard/Senderidsclient'; // Reuse customer UI for reseller's own IDs

export default function ResellerSenderIdsPage() {
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await SenderIdsService.getCustomerRequests();
      setRequests(data);
    } catch {
      showSnackbar('Failed to load customer requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 1) loadRequests();
  }, [tab]);

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const handleReview = async (id: string, resellerStatus: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${resellerStatus} this request?`)) return;
    try {
      await SenderIdsService.resellerReview(id, resellerStatus);
      showSnackbar(`Request ${resellerStatus}`, 'success');
      loadRequests();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message ?? 'Failed to review request', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Sender IDs</Typography>
      
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #eee' }}>
        <Tab label="My Sender IDs" sx={{ fontWeight: 600 }} />
        <Tab label="Customer Requests" sx={{ fontWeight: 600 }} />
      </Tabs>

      {tab === 0 ? (
        <SenderIdsClient />
      ) : (
        <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : requests.length === 0 ? (
            <EmptyState description="No pending sender ID requests from your customers" />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fafbff' }}>
                    {['Customer', 'Sender ID', 'Docs', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((item, i) => (
                    <TableRow key={item.sender.id} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { bgcolor: '#f5f0ff' } }}>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>{item.accountName}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.accountEmail}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                          {item.sender.senderId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {item.sender.nicUrl && (
                            <Tooltip title="View NIC">
                              <IconButton size="small" component={Link} href={item.sender.nicUrl} target="_blank" sx={{ color: '#f26f2e' }}>
                                <FileOpenIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {item.sender.brUrl && (
                            <Tooltip title="View BR">
                              <IconButton size="small" component={Link} href={item.sender.brUrl} target="_blank" sx={{ color: '#f26f2e' }}>
                                <FileOpenIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {item.sender.requestLetterUrl && (
                            <Tooltip title="View Request Letter">
                              <IconButton size="small" component={Link} href={item.sender.requestLetterUrl} target="_blank" sx={{ color: '#f26f2e' }}>
                                <FileOpenIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.sender.resellerStatus === 'pending' ? 'Needs Review' : item.sender.resellerStatus.toUpperCase()}
                          size="small"
                          color={item.sender.resellerStatus === 'pending' ? 'warning' : (item.sender.resellerStatus === 'approved' ? 'success' : 'error')}
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        {item.sender.resellerStatus === 'pending' && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Approve & Forward to Admin">
                              <IconButton size="small" sx={{ color: '#4caf50' }} onClick={() => handleReview(item.sender.id, 'approved')}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Request">
                              <IconButton size="small" sx={{ color: '#f44336' }} onClick={() => handleReview(item.sender.id, 'rejected')}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                        {item.sender.resellerStatus === 'approved' && item.sender.status !== 'approved' && (
                          <Typography variant="caption" color="text.secondary">Forwarded to Admin</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}