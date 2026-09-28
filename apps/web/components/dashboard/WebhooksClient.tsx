'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { WebhooksService } from '@/lib/services/webhooks.service';
import { formatDate } from '@/lib/utils';
import EmptyState from '@/components/ui/Emptystate';
import toast from 'react-hot-toast';

export default function WebhooksClient() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await WebhooksService.findAll();
      setWebhooks(data);
    } catch (e) {
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await WebhooksService.create({ url });
      toast.success('Webhook created successfully');
      setOpen(false);
      setUrl('');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create webhook');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await WebhooksService.remove(id);
      toast.success('Webhook deleted');
      load();
    } catch (e) {
      toast.error('Failed to delete webhook');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Developer Webhooks</Typography>
          <Typography variant="body2" color="text.secondary">
            Receive real-time HTTP callbacks when message statuses change.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
          sx={{ bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3b5bdb' }, borderRadius: 2, fontWeight: 600, flexShrink: 0 }}>
          Add Endpoint
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fc' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>URL</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Events</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>HMAC Secret</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Added</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
              ) : webhooks.length === 0 ? (
                <TableRow><TableCell colSpan={5}><EmptyState title="No webhooks found" description="Create an endpoint to start receiving real-time events." /></TableCell></TableRow>
              ) : (
                webhooks.map((wh) => (
                  <TableRow key={wh.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{wh.url}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {(wh.events || []).map((ev: string) => (
                          <Chip key={ev} label={ev} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', p: 0.5, borderRadius: 1 }}>
                          {wh.secret.substring(0, 8)}...
                        </Typography>
                        <IconButton size="small" onClick={() => {
                          navigator.clipboard.writeText(wh.secret);
                          toast.success('Secret copied');
                        }}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{formatDate(wh.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => handleDelete(wh.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle>Add Webhook Endpoint</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Webhooks will receive POST requests containing JSON payloads for `dlr.delivered`, `dlr.failed`, and `dlr.sent` events. 
              Each request includes an `X-SMSGate-Signature` HMAC-SHA256 signature for verification.
            </Alert>
            <TextField
              fullWidth
              label="Endpoint URL"
              placeholder="https://your-api.com/webhooks/sms"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={saving}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Add Endpoint'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
