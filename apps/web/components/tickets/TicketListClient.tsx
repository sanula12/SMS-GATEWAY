'use client';

import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useRouter } from 'next/navigation';
import { TicketsService, Ticket } from '@/lib/services/tickets.service';
import DataTable, { ColumnDef } from '../shared/DataTable';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function TicketListClient({ baseUrl }: { baseUrl: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', priority: 'medium' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await TicketsService.getAll();
      setTickets(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.subject || !form.message) return;
    setUploading(true);
    try {
      let attachmentUrl = undefined;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post('/upload/image?folder=tickets', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        attachmentUrl = uploadRes.data?.url;
      }

      const res = await TicketsService.create({ ...form, attachmentUrl });
      setCreateOpen(false);
      setForm({ subject: '', message: '', priority: 'medium' });
      setFile(null);
      router.push(`${baseUrl}/${res.data?.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const columns: ColumnDef<Ticket>[] = [
    { id: 'ticketNumber', label: 'Ticket ID', render: (t) => <Typography fontWeight={800} color="primary">#{t.ticketNumber}</Typography> },
    { id: 'subject', label: 'Subject', render: (t) => <Typography fontWeight={600}>{t.subject}</Typography> },
    ...(user?.role === 'super_admin' ? [{ id: 'account', label: 'Account', render: (t: Ticket) => t.accountName || t.accountId }] : []),
    { id: 'status', label: 'Status', render: (t) => (
      <Chip 
        label={t.status.toUpperCase()} 
        size="small" 
        color={t.status === 'open' ? 'success' : t.status === 'pending' ? 'warning' : t.status === 'resolved' ? 'primary' : 'default'}
      />
    ) },
    { id: 'priority', label: 'Priority', render: (t) => (
      <Chip label={t.priority.toUpperCase()} size="small" variant="outlined" color={t.priority === 'high' ? 'error' : 'default'} />
    ) },
    { id: 'updated', label: 'Last Updated', render: (t) => formatDate(t.updatedAt) },
    { id: 'actions', label: '', align: 'right', render: (t) => (
      <Button variant="outlined" size="small" onClick={() => router.push(`${baseUrl}/${t.id}`)}>
        View
      </Button>
    ) }
  ];

  if (loading) return <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Support Tickets</Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role === 'super_admin' ? 'Manage customer and reseller tickets below.' : 'Need help? Open a ticket below.'}
          </Typography>
        </Box>
        {user?.role !== 'super_admin' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2, fontWeight: 600, flexShrink: 0, bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3b5bdb' } }}>
            Open Ticket
          </Button>
        )}
      </Box>

      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e8eaf0', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={tickets}
          emptyMessage="No support tickets found."
        />
      </Card>

      <Dialog open={createOpen} onClose={() => !uploading && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Open Support Ticket</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField label="Subject" fullWidth value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select value={form.priority} label="Priority" onChange={e => setForm({ ...form, priority: e.target.value })}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <TextField label="How can we help?" fullWidth multiline rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px dashed #ccc', p: 2, borderRadius: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="ticket-image-upload"
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="ticket-image-upload">
                <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />}>
                  Attach Image
                </Button>
              </label>
              {file && (
                <Typography variant="body2" color="text.secondary">
                  {file.name}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={uploading}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.subject || !form.message || uploading}>
            {uploading ? <CircularProgress size={24} color="inherit" /> : 'Submit Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
