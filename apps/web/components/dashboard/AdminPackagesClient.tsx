'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Grid, Button, Divider, Chip,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select,
  MenuItem, Switch, FormControlLabel, IconButton, Tooltip, Table,
  TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { PackagesService } from '@/lib/services/packages.service';
import { useAuth } from '@/context/AuthContext';
import DataTable, { ColumnDef } from '../shared/DataTable';

const premiumShadow = '0px 2px 4px rgba(0,0,0,0.04), 0px 4px 6px rgba(0,0,0,0.02)';

type Package = { id: string; name: string; type: string; price: string; creditAmount: number; isActive: boolean; ownerId: string | null };
type Transaction = { id: string; accountId: string; accountName?: string; packageId: string; packageName?: string; amount: string; status: string; slipUrl?: string; createdAt: string; notes?: string };

const emptyForm = { name: '', type: 'retail' as 'retail' | 'wholesale', price: '', creditAmount: '', isActive: true };

export default function AdminPackagesClient() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<Package | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<'packages' | 'transactions'>('packages');

  const reload = async () => {
    setLoading(true);
    try {
      const [pkgRes, txRes] = await Promise.all([PackagesService.getAll(), PackagesService.getTransactions()]);
      setPackages(Array.isArray(pkgRes?.data ?? pkgRes) ? (pkgRes?.data ?? pkgRes) : []);
      setTransactions(Array.isArray(txRes?.data ?? txRes) ? (txRes?.data ?? txRes) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const openCreate = () => { setEditPkg(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (pkg: Package) => {
    setEditPkg(pkg);
    setForm({ name: pkg.name, type: pkg.type as any, price: pkg.price, creditAmount: String(pkg.creditAmount), isActive: pkg.isActive });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.creditAmount) return;
    setSaving(true); setError(null);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        price: parseFloat(form.price),
        creditAmount: parseInt(form.creditAmount),
        isActive: form.isActive,
      };
      if (editPkg) {
        await PackagesService.update(editPkg.id, payload);
        setSuccess('Package updated');
      } else {
        await PackagesService.create(payload);
        setSuccess('Package created');
      }
      setDialogOpen(false);
      reload();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await PackagesService.remove(id);
      setSuccess('Package deactivated');
      reload();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to deactivate');
    }
  };

  const handleApprove = async (txId: string) => {
    try {
      await PackagesService.approve(txId);
      setSuccess('Payment approved — credits added!');
      reload();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to approve');
    }
  };

  const handleReject = async (txId: string) => {
    try {
      await PackagesService.reject(txId, 'Rejected by admin');
      setSuccess('Payment rejected');
      reload();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to reject');
    }
  };

  const statusChip: Record<string, any> = {
    pending: { bgcolor: '#FEF3C7', color: '#D97706', label: 'PENDING' },
    completed: { bgcolor: '#D1FAE5', color: '#059669', label: 'COMPLETED' },
    rejected: { bgcolor: '#FEE2E2', color: '#DC2626', label: 'REJECTED' },
    failed: { bgcolor: '#FEE2E2', color: '#DC2626', label: 'FAILED' },
  };

  
    const packageColumns: ColumnDef<Package>[] = [
        { id: 'name', label: 'Name', render: (pkg) => <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>{pkg.name}</span> },
        { id: 'type', label: 'Type', render: (pkg) => <Chip label={pkg.type === 'retail' ? 'Retail' : 'Wholesale'} size="small" sx={{ fontSize: '0.7rem', fontWeight: 700, height: 20, bgcolor: pkg.type === 'retail' ? '#E0E7FF' : '#F3E8FF', color: pkg.type === 'retail' ? '#4338CA' : '#7E22CE' }} /> },
        { id: 'credits', label: 'Credits', render: (pkg) => <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{pkg.creditAmount.toLocaleString()}</span> },
        { id: 'price', label: 'Price (Rs.)', render: (pkg) => <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5' }}>Rs. {parseFloat(pkg.price).toLocaleString()}</span> },
        { id: 'rsPerSms', label: 'Rs./SMS', render: (pkg) => <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Rs. {(parseFloat(pkg.price) / pkg.creditAmount).toFixed(2)}</span> },
        { id: 'status', label: 'Status', render: (pkg) => (
            <Box sx={{ display: 'inline-block', px: 1.5, py: 0.3, borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, bgcolor: pkg.isActive ? '#D1FAE5' : '#FEE2E2', color: pkg.isActive ? '#059669' : '#DC2626' }}>
                {pkg.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Box>
        ) },
        { id: 'actions', label: 'Actions', render: (pkg) => (
            <>
                {pkg.ownerId === user?.id || pkg.ownerId === null ? (
                    <>
                        <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(pkg)} sx={{ color: '#4f46e5' }}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDeactivate(pkg.id)} sx={{ color: '#EF4444' }}><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                    </>
                ) : (
                    <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>System</Typography>
                )}
            </>
        ) }
    ];


    const txColumns: ColumnDef<Transaction>[] = [
        { id: 'customer', label: 'Customer', render: (tx) => <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{tx.accountName || tx.accountId.slice(0, 8)}</Typography> },
        { id: 'package', label: 'Package', render: (tx) => <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{tx.packageName || '-'}</span> },
        { id: 'amount', label: 'Amount', render: (tx) => <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#4f46e5' }}>Rs. {parseFloat(tx.amount).toLocaleString()}</span> },
        { id: 'slip', label: 'Slip', render: (tx) => (
            tx.slipUrl ? (
                <a href={tx.slipUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>View Slip</a>
            ) : (
                <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Not uploaded</Typography>
            )
        ) },
        { id: 'status', label: 'Status', render: (tx) => {
            const s = statusChip[tx.status] ?? statusChip.pending;
            return <Box sx={{ display: 'inline-block', px: 1.5, py: 0.3, borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, bgcolor: s.bg, color: s.color }}>{tx.status.toUpperCase()}</Box>;
        } },
        { id: 'date', label: 'Date', render: (tx) => <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{new Date(tx.createdAt).toLocaleDateString()}</span> },
        { id: 'actions', label: 'Actions', render: (tx) => (
            tx.status === 'pending' && (
                <>
                    <Tooltip title="Approve">
                        <IconButton size="small" onClick={() => handleApprove(tx.id)}  sx={{ color: '#059669', bgcolor: '#D1FAE5', mr: 1, '&:hover': { bgcolor: '#A7F3D0' } }}>
                            <CheckCircleIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                        <IconButton size="small" onClick={() => { handleReject(tx.id) }}  sx={{ color: '#DC2626', bgcolor: '#FEE2E2', '&:hover': { bgcolor: '#FECACA' } }}>
                            <CancelIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </>
            )
        ) }
    ];

    return (
    <Box sx={{ maxWidth: '100%', pb: 6, pt: 1 }}>
      {/* Hero */}
      <Card elevation={0} sx={{
        p: { xs: 3, sm: 4 }, mb: 4, borderRadius: 3,
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
        color: '#fff', boxShadow: premiumShadow,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3,
      }}>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', mb: 1, display: 'block' }}>
            {user?.role === 'reseller' ? 'Reseller Control' : 'Admin Control'}
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2rem' }, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, mb: 0.5 }}>
            Package Management
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#D1D5DB' }}>
            {user?.role === 'reseller'
              ? 'Create your own custom packages for your customers. Admin packages are visible below.'
              : 'Create retail & wholesale SMS bundles. Approve customer payments.'}
          </Typography>
        </Box>
        {user?.role !== 'reseller' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ bgcolor: '#fff', color: '#111827', '&:hover': { bgcolor: '#F3F4F6' }, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            New Package
          </Button>
        )}
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {(['packages', 'transactions'] as const).map(t => (
          <Button
            key={t}
            variant={tab === t ? 'contained' : 'outlined'}
            onClick={() => setTab(t)}
            sx={{
              textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', borderRadius: 2,
              ...(tab === t
                ? { bgcolor: '#111827', color: '#fff', '&:hover': { bgcolor: '#374151' } }
                : { borderColor: '#E5E7EB', color: '#374151', '&:hover': { bgcolor: '#F9FAFB' } }),
            }}
          >
            {t === 'packages' ? 'Packages' : 'Payment Requests'}
          </Button>
        ))}
      </Box>

      {tab === 'packages' ? (
        <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, overflow: 'hidden' }}>
          <Box sx={{ p: -2 }}><DataTable columns={packageColumns} data={packages} loading={loading} emptyMessage="No packages found. Create one above." /></Box>
        </Card>
      ) : (
        <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, overflow: 'hidden' }}>
          <Box sx={{ p: -2 }}><DataTable columns={txColumns} data={transactions} loading={loading} emptyMessage="No payment requests yet" /></Box>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ elevation: 0, sx: { border: '1px solid #E5E7EB', borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editPkg ? 'Edit Package' : 'Create Package'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            fullWidth size="small" label="Package Name" placeholder="e.g. Starter Bundle"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          {user?.role === 'super_admin' && (
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} sx={{ borderRadius: 2 }}>
                <MenuItem value="retail">Retail (for customers)</MenuItem>
                <MenuItem value="wholesale">Wholesale (for resellers)</MenuItem>
              </Select>
            </FormControl>
          )}
          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField
                fullWidth size="small" label="Price (Rs.)" type="number"
                value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth size="small" label="SMS Credits" type="number"
                value={form.creditAmount} onChange={e => setForm(f => ({ ...f, creditAmount: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
          {form.price && form.creditAmount && (
            <Box sx={{ bgcolor: '#F3F4F6', borderRadius: 2, p: 2 }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>
                Cost per SMS: <strong>Rs. {(parseFloat(form.price) / parseInt(form.creditAmount || '1')).toFixed(2)}</strong>
              </Typography>
            </Box>
          )}
          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} size="small" color="primary" />}
            label={<Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Active (visible to customers)</Typography>}
          />
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', color: '#6B7280' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name || !form.price || !form.creditAmount}
            sx={{ bgcolor: '#111827', '&:hover': { bgcolor: '#374151' }, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : (editPkg ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


