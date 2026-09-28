'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Button, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Tooltip, Grid, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { RecurringService } from '@/lib/services/recurring.service';
import { SenderIdsService } from '@/lib/services/sender-ids.service';
import * as XLSX from 'xlsx';
import DataTable, { ColumnDef } from '../shared/DataTable';

export default function Automatedclient() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', messageTemplate: '', sendTime: '08:00', senderId: '', frequency: 'yearly' });
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [senderIds, setSenderIds] = useState<any[]>([]);

  const showSnackbar = (msg: string, severity: 'success' | 'error') => {

    setSnack({ msg, severity });
    setTimeout(() => setSnack(null), 4000);
  };

  useEffect(() => {
    load();
    SenderIdsService.getAll()
      .then(res => {
        const data = res?.data ?? res ?? [];
        setSenderIds(Array.isArray(data) ? data.filter((s: any) => s.status === 'approved') : []);
      })
      .catch(() => setSenderIds([]));
  }, []);


  const load = async () => {
    try {
      setLoading(true);
      setCampaigns(await RecurringService.getAll());
    } catch {
      showSnackbar('Failed to load campaigns', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { phone: '+94771234567', name: 'John Doe', event_date: '2024-10-15' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'recurring_campaign_template.xlsx');
  };

  const handleSubmit = async () => {
    if (!file) return showSnackbar('Please upload an Excel file', 'error');
    if (!form.name || !form.messageTemplate || !form.sendTime)
      return showSnackbar('Please fill all fields', 'error');
    try {
      setSubmitting(true);
      const res = await RecurringService.createFromExcel({ ...form, file });
      showSnackbar(`Created! Imported ${res.imported} contacts.`, 'success');
      setOpen(false);
      setForm({ name: '', messageTemplate: '', sendTime: '08:00', senderId: '', frequency: 'yearly' });
      setFile(null);
      load();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || 'Failed to create campaign', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, current: string) => {
    try {
      await RecurringService.updateStatus(id, current === 'active' ? 'paused' : 'active');
      showSnackbar(current === 'active' ? 'Campaign paused' : 'Campaign resumed', 'success');
      load();
    } catch {
      showSnackbar('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this automation and its contact list?')) return;
    try {
      await RecurringService.remove(id);
      showSnackbar('Deleted', 'success');
      load();
    } catch {
      showSnackbar('Failed to delete', 'error');
    }
  };

  const borderColor = (dOver: boolean, f: File | null) =>
    dOver ? '#4f6ef7' : f ? '#4caf50' : '#c8d0e8';

  
    const columns: ColumnDef<any>[] = [
        { id: 'name', label: 'Campaign', render: (c) => (
            <>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1a1f36' }}>{c.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 260, display: 'block' }}>{c.messageTemplate}</Typography>
            </>
        ) },
        { id: 'frequency', label: 'Frequency', render: (c) => <Chip label={(c.frequency || 'yearly').toUpperCase()} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} /> },
        { id: 'sendTime', label: 'Send Time', render: (c) => <Typography variant="body2" fontWeight={600}>{c.sendTime}</Typography> },
        { id: 'status', label: 'Status', render: (c) => (
            <Chip
                label={c.status}
                size="small"
                color={c.status === 'active' ? 'success' : 'default'}
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
            />
        ) },
        { id: 'lastRun', label: 'Last Run', render: (c) => <Typography variant="body2" color="text.secondary">{c.lastRunAt ? new Date(c.lastRunAt).toLocaleString() : 'Never'}</Typography> },
        { id: 'actions', label: 'Actions', align: 'right', render: (c) => (
            <Box>
                {c.status === 'active' ? (
                    <Tooltip title="Pause"><IconButton size="small" onClick={() => handleToggle(c.id, c.status)} sx={{ color: '#f59e0b' }}><PauseCircleOutlineIcon fontSize="small" /></IconButton></Tooltip>
                ) : (
                    <Tooltip title="Activate"><IconButton size="small" onClick={() => handleToggle(c.id, c.status)} sx={{ color: '#10b981' }}><PlayCircleOutlineIcon fontSize="small" /></IconButton></Tooltip>
                )}
                <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(c.id)} sx={{ color: '#ef4444' }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
            </Box>
        ) }
    ];

    return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#1a1f36', letterSpacing: '-0.02em' }}>
            Automated Recurring Campaigns
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Set-and-forget automations. Messages send automatically every year on a contact&apos;s special date.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setOpen(true)}
          sx={{ bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3b5bdb' }, borderRadius: 2, textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
        >
          New Automation
        </Button>
      </Box>

      {/* Inline snackbar */}
      {snack && (
        <Alert severity={snack.severity} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSnack(null)}>
          {snack.msg}
        </Alert>
      )}

      {/* Table */}
      <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
        <Box sx={{ p: -2 }}><DataTable columns={columns} data={campaigns} loading={loading} emptyMessage="No automated campaigns yet. Click 'New Automation' to get started." /></Box>
      </Card>

      {/* Create Dialog */}
      <Dialog open={open} onClose={() => !submitting && setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#1a1f36', pb: 1 }}>Create Recurring Campaign</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Campaign Name" size="small"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. VIP Customer Birthdays" />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField fullWidth label="Send Time" size="small" type="time"
                value={form.sendTime} onChange={e => setForm({ ...form, sendTime: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Frequency</InputLabel>
                <Select
                  label="Frequency"
                  value={form.frequency}
                  onChange={e => setForm({ ...form, frequency: e.target.value })}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Sender ID (Optional)</InputLabel>
                <Select
                  label="Sender ID (Optional)"
                  value={form.senderId}
                  onChange={e => setForm({ ...form, senderId: e.target.value })}
                >
                  <MenuItem value=""><em>Use Default</em></MenuItem>
                  {senderIds.map((s: any) => (
                    <MenuItem key={s.id} value={s.senderId}>{s.senderId}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={3} label="Message Template" size="small"
                value={form.messageTemplate} onChange={e => setForm({ ...form, messageTemplate: e.target.value })}
                placeholder="Happy Birthday {name}! Here is a 20% discount just for you."
                helperText="Use {name} to personalise the message." />
            </Grid>

            {/* Excel Upload */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>Contact List</Typography>
                <Button size="small" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
                  Download Template
                </Button>
              </Box>
              <label htmlFor="auto-file-upload">
                <Box
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
                  }}
                  sx={{
                    border: `2px dashed ${borderColor(dragOver, file)}`,
                    borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer',
                    bgcolor: dragOver ? '#f0f4ff' : '#fafafa',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#4f6ef7', bgcolor: '#f0f4ff' },
                  }}
                >
                  <input
                    id="auto-file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
                  />
                  <UploadFileIcon sx={{ fontSize: 40, color: file ? '#4caf50' : '#a0abce', mb: 1 }} />
                  <Typography variant="body2" fontWeight={600}>
                    {file ? file.name : 'Click to browse or drag Excel file here'}
                  </Typography>
                  {!file && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Required columns: <strong>phone</strong>, <strong>name</strong>, <strong>event_date</strong> (YYYY-MM-DD)
                    </Typography>
                  )}
                </Box>
              </label>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fc' }}>
          <Button onClick={() => setOpen(false)} disabled={submitting} sx={{ color: '#64748b', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}
            sx={{ bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3b5bdb' }, borderRadius: 2, fontWeight: 600, px: 3 }}>
            {submitting ? 'Creating…' : 'Create & Activate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

