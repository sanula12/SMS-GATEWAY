'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, Typography, Chip, Select, MenuItem, FormControl,
  CircularProgress, Alert, Stack, Divider, TextField, InputAdornment,
  IconButton, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import api from '@/lib/api';

type InquiryStatus = 'pending' | 'reviewed' | 'contacted' | 'rejected';

interface Inquiry {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

const STATUS_COLORS: Record<InquiryStatus, 'warning' | 'info' | 'success' | 'error'> = {
  pending: 'warning',
  reviewed: 'info',
  contacted: 'success',
  rejected: 'error',
};

export default function InquiriesClient() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Detail Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    api.get('/inquiries')
      .then(res => setInquiries(res.data))
      .catch(() => setError('Failed to load inquiries.'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: InquiryStatus) => {
    setUpdating(id);
    try {
      await api.patch(`/inquiries/${id}`, { status });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(prev => prev ? { ...prev, status } : null);
      }
    } catch {
      setError('Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: inquiries.length,
      pending: inquiries.filter(i => i.status === 'pending').length,
      reviewed: inquiries.filter(i => i.status === 'reviewed').length,
      contacted: inquiries.filter(i => i.status === 'contacted').length,
      rejected: inquiries.filter(i => i.status === 'rejected').length,
    };
  }, [inquiries]);

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(item => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCompany = item.company.toLowerCase().includes(q);
        const matchEmail = item.email.toLowerCase().includes(q);
        const matchPhone = (item.phone || '').toLowerCase().includes(q);
        const matchMessage = item.message.toLowerCase().includes(q);
        return matchName || matchCompany || matchEmail || matchPhone || matchMessage;
      }
      return true;
    });
  }, [inquiries, statusFilter, search]);

  // Paginated items
  const paginatedInquiries = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredInquiries.slice(start, start + rowsPerPage);
  }, [filteredInquiries, page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
          Reseller Inquiries
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Review and follow up on leads submitted through the landing page reseller form.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar Card */}
      <Card elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          {/* Status Tabs / Chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            {(
              [
                { key: 'all', label: 'All', count: counts.all, color: 'default' },
                { key: 'pending', label: 'Pending', count: counts.pending, color: 'warning' },
                { key: 'reviewed', label: 'Reviewed', count: counts.reviewed, color: 'info' },
                { key: 'contacted', label: 'Contacted', count: counts.contacted, color: 'success' },
                { key: 'rejected', label: 'Rejected', count: counts.rejected, color: 'error' },
              ] as const
            ).map(tab => {
              const active = statusFilter === tab.key;
              return (
                <Chip
                  key={tab.key}
                  label={`${tab.label} (${tab.count})`}
                  color={active ? (tab.color === 'default' ? 'primary' : tab.color) : 'default'}
                  variant={active ? 'filled' : 'outlined'}
                  onClick={() => { setStatusFilter(tab.key); setPage(0); }}
                  clickable
                  sx={{
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.8rem',
                    borderRadius: 2,
                    cursor: 'pointer',
                  }}
                />
              );
            })}
          </Box>

          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search name, company, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            sx={{ width: { xs: '100%', md: 320 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setSearch(''); setPage(0); }}>
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Stack>
      </Card>

      {/* Table Card */}
      <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Date
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Lead & Company
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Contact Info
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Message
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Status
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <FilterListIcon sx={{ fontSize: 40, color: '#cbd5e1' }} />
                      <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                        No inquiries found matching your filters.
                      </Typography>
                      {(search || statusFilter !== 'all') && (
                        <Button size="small" variant="text" onClick={handleClearFilters} sx={{ textTransform: 'none' }}>
                          Clear search & filters
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInquiries.map(inquiry => (
                  <TableRow
                    key={inquiry.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:last-child td, &:last-child th': { border: 0 },
                    }}
                    onClick={() => setSelectedInquiry(inquiry)}
                  >
                    {/* Date */}
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem' }}>
                        {new Date(inquiry.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </TableCell>

                    {/* Name & Company */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                        {inquiry.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                        <BusinessIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {inquiry.company}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Contact Info */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                        <Typography
                          component="a"
                          href={`mailto:${inquiry.email}`}
                          onClick={e => e.stopPropagation()}
                          sx={{
                            fontSize: '0.8rem',
                            color: '#4f6ef7',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {inquiry.email}
                        </Typography>
                      </Box>
                      {inquiry.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <PhoneIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                          <Typography
                            component="a"
                            href={`tel:${inquiry.phone}`}
                            onClick={e => e.stopPropagation()}
                            sx={{
                              fontSize: '0.75rem',
                              color: '#64748b',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {inquiry.phone}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>

                    {/* Message Preview */}
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography
                        sx={{
                          fontSize: '0.8rem',
                          color: '#334155',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {inquiry.message}
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Chip
                        label={inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                        color={STATUS_COLORS[inquiry.status]}
                        size="small"
                        sx={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '0.75rem' }}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right" onClick={e => e.stopPropagation()}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 115 }}>
                          <Select
                            value={inquiry.status}
                            disabled={updating === inquiry.id}
                            onChange={e => handleStatusChange(inquiry.id, e.target.value as InquiryStatus)}
                            sx={{ fontSize: '0.75rem', height: 32 }}
                          >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="reviewed">Reviewed</MenuItem>
                            <MenuItem value="contacted">Contacted</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                          </Select>
                        </FormControl>

                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedInquiry(inquiry)}
                            sx={{ color: '#64748b', '&:hover': { color: '#0f172a' } }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredInquiries.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid #f1f5f9' }}
        />
      </Card>

      {/* Inquiry Detail Dialog */}
      <Dialog
        open={Boolean(selectedInquiry)}
        onClose={() => setSelectedInquiry(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        {selectedInquiry && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {selectedInquiry.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {selectedInquiry.company}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setSelectedInquiry(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 2 }}>
              {/* Contact Meta */}
              <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 16, color: '#64748b' }} />
                  <Typography component="a" href={`mailto:${selectedInquiry.email}`} sx={{ fontSize: '0.875rem', color: '#4f6ef7', textDecoration: 'none' }}>
                    {selectedInquiry.email}
                  </Typography>
                </Box>
                {selectedInquiry.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: '#64748b' }} />
                    <Typography component="a" href={`tel:${selectedInquiry.phone}`} sx={{ fontSize: '0.875rem', color: '#334155', textDecoration: 'none' }}>
                      {selectedInquiry.phone}
                    </Typography>
                  </Box>
                )}
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Submitted on: {new Date(selectedInquiry.createdAt).toLocaleString()}
                </Typography>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Status Selector */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569' }}>
                  Status:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={selectedInquiry.status}
                    onChange={e => handleStatusChange(selectedInquiry.id, e.target.value as InquiryStatus)}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="reviewed">Reviewed</MenuItem>
                    <MenuItem value="contacted">Contacted</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
                {updating === selectedInquiry.id && <CircularProgress size={16} />}
              </Box>

              {/* Message Box */}
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569', mb: 1 }}>
                Inquiry Message:
              </Typography>
              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {selectedInquiry.message}
                </Typography>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button
                component="a"
                href={`mailto:${selectedInquiry.email}?subject=RE: Reseller Inquiry - ${encodeURIComponent(selectedInquiry.company)}`}
                variant="contained"
                size="small"
                startIcon={<EmailIcon />}
                sx={{ bgcolor: '#be185d', '&:hover': { bgcolor: '#9d174d' }, textTransform: 'none', borderRadius: 2 }}
              >
                Reply via Email
              </Button>
              <Button onClick={() => setSelectedInquiry(null)} sx={{ textTransform: 'none' }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
