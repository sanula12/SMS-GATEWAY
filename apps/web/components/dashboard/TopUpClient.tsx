'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, Typography, Grid, Button, Chip, Divider,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Skeleton, Avatar,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SmsIcon from '@mui/icons-material/Sms';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { PackagesService } from '@/lib/services/packages.service';
import api from '@/lib/api';
import { SettingsService } from '@/lib/services/settings.service';
import { StorageService } from '@/lib/services/storage.service';
import { useAuth } from '@/context/AuthContext';

import PaymentHistoryTable from './PaymentHistoryTable';

const premiumShadow = '0px 2px 4px rgba(0,0,0,0.04), 0px 4px 6px rgba(0,0,0,0.02)';

type Package = {
  id: string;
  name: string;
  price: string;
  creditAmount: number;
  features?: any;
  ownerId?: string | null;
};

type Transaction = {
  id: string;
  packageId: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed' | 'rejected' | 'canceled';
  slipUrl?: string;
  createdAt: string;
};

export default function TopUpClient() {
  const { user } = useAuth();
  
  const [packages, setPackages] = useState<Package[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const scrollLeft = () => { if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' }); };
  const scrollRight = () => { if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' }); };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [slipLoading, setSlipLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);

  const currentBalance = parseFloat(user?.creditBalance || '0');

  useEffect(() => {
    Promise.all([PackagesService.getAll(), PackagesService.getTransactions(), SettingsService.getMySettings()])
      .then(([pkgRes, txRes, settingsRes]) => {
          setBankDetails(settingsRes);
        const pkgData = pkgRes?.data ?? pkgRes ?? [];
        const txData = txRes?.data ?? txRes ?? [];
        setPackages(Array.isArray(pkgData) ? pkgData : []);
        setTransactions(Array.isArray(txData) ? txData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setError(null);
    setSuccess(null);
    setConfirmOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setPurchaseLoading(true);
    setError(null);
    try {
      const res = await PackagesService.initiateBankTransfer(selectedPackage.id);
      const id = res?.transactionId ?? res?.data?.transactionId;
      setTxId(id);
      setConfirmOpen(false);
      setSlipOpen(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to initiate purchase');
    } finally {
      setPurchaseLoading(false);
    }
  };

    const handleCancelTransaction = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to cancel this pending transaction?')) return;
      await api.patch('/packages/transactions/' + id + '/cancel');
      setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, status: 'canceled' } : tx));
      setSuccess('Transaction canceled successfully');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to cancel transaction');
    }
  };
  const handleOnePayPurchase = async () => {
    if (!selectedPackage) return;
    setPurchaseLoading(true);
    setError(null);
    try {
      const res = await PackagesService.initiateOnePay(selectedPackage.id);
      const url = res?.redirectUrl ?? res?.data?.redirectUrl;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No redirect URL received from payment gateway');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message ?? 'Failed to initiate OnePay purchase');
      setPurchaseLoading(false);
    }
  };

  const handleSlipUpload = async () => {
    if (!txId || !selectedFile) return;
    setSlipLoading(true);
    setError(null);
    try {
      // 1. Upload to Bunny CDN
      const uploadRes = await StorageService.uploadImage(selectedFile, 'slips');
      const uploadedUrl = uploadRes.url;

      // 2. Attach slip URL to the transaction
      await PackagesService.attachSlip(txId, uploadedUrl);
      
      setSlipOpen(false);
      setSuccess('Payment slip submitted! Awaiting admin approval.');
      setSelectedFile(null);
      
      const txRes = await PackagesService.getTransactions();
      const txData = txRes?.data ?? txRes ?? [];
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to upload slip. Please ensure it is an image file under 5MB.');
    } finally {
      setSlipLoading(false);
    }
  };

  const statusColor: Record<string, any> = {
    pending: { bgcolor: '#FEF3C7', color: '#D97706' },
    completed: { bgcolor: '#D1FAE5', color: '#059669' },
    failed: { bgcolor: '#FEE2E2', color: '#DC2626' },
    rejected: { bgcolor: '#FEE2E2', color: '#DC2626' },
  };

  return (
    <Box sx={{ maxWidth: '100%', pb: 6, pt: 1 }}>
      {/* Hero Banner */}
      <Card elevation={0} sx={{
        p: { xs: 3, sm: 4 }, mb: 4, borderRadius: 3,
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
        color: '#fff', boxShadow: premiumShadow,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3,
      }}>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', mb: 1, display: 'block' }}>
            Billing & Credits
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2rem' }, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, mb: 0.5 }}>
            Top Up SMS Credits
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#D1D5DB' }}>
            Choose a bundle and pay via bank transfer. Credits are added after approval.
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>
            Current Balance
          </Typography>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', lineHeight: 1.2 }}>
            {currentBalance.toFixed(0)} <Typography component="span" sx={{ fontSize: '1rem', color: '#6EE7B7' }}>credits</Typography>
          </Typography>
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* LEFT: Package Cards */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
            Available Packages
          </Typography>

          {loading ? (
            <Box ref={scrollRef} sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 4 } }}>
              {[1, 2, 3].map(i => (
                <Box key={i} sx={{ minWidth: { xs: 260, sm: 280 }, flexShrink: 0 }}>
                  <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
                </Box>
              ))}
            </Box>
          ) : packages.length === 0 ? (
            <Card elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px dashed #E5E7EB', borderRadius: 3 }}>
              <SmsIcon sx={{ fontSize: 48, color: '#E5E7EB', mb: 2 }} />
              <Typography sx={{ color: '#9CA3AF', fontWeight: 600 }}>No packages available yet</Typography>
              <Typography variant="caption" sx={{ color: '#D1D5DB' }}>Contact support to purchase credits.</Typography>
            </Card>
          ) : (
            <Box ref={scrollRef} sx={{ 
                display: 'flex', 
                gap: 2, 
                overflowX: 'auto', 
                pb: 2, 
                scrollSnapType: 'x mandatory',
                '&::-webkit-scrollbar': { height: 8 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 4 }
            }}>
              {packages.map(pkg => {
                const pricePerSms = (parseFloat(pkg.price) / pkg.creditAmount).toFixed(2);
                return (
                  <Box key={pkg.id} sx={{ minWidth: { xs: 260, sm: 280 }, flexShrink: 0, scrollSnapAlign: 'start' }}>
                    <Card elevation={0} sx={{
                      p: 3, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow,
                      cursor: 'pointer', transition: 'all 0.15s',
                      '&:hover': { borderColor: '#4f46e5', boxShadow: '0 0 0 2px #4f46e520' },
                    }} onClick={() => handleSelectPackage(pkg)}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{pkg.name}</Typography>
                        <Box sx={{ bgcolor: '#F3F4F6', borderRadius: 2, px: 1.5, py: 0.5, fontSize: '0.7rem', fontWeight: 700, color: '#6B7280' }}>
                          Rs.{pricePerSms}/SMS
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
                        <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                          {pkg.creditAmount.toLocaleString()}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>SMS Credits</Typography>
                      </Box>

                      <Divider sx={{ mb: 2, borderColor: '#F3F4F6' }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5' }}>
                          Rs. {parseFloat(pkg.price).toLocaleString()}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ bgcolor: '#111827', '&:hover': { bgcolor: '#374151' }, borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
                          onClick={(e) => { e.stopPropagation(); handleSelectPackage(pkg); }}
                        >
                          Buy Now
                        </Button>
                      </Box>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          )}
        </Grid>

        {/* RIGHT: Transaction History */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Bank Details Card */}
          <Card elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: premiumShadow, bgcolor: '#F9FAFB' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <AccountBalanceIcon sx={{ color: '#4f46e5', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>Bank Transfer Details</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {[
                  { label: 'Bank', value: bankDetails?.bank_name || 'Not Configured' },
                  { label: 'Account Name', value: bankDetails?.account_name || 'Not Configured' },
                  { label: 'Account No.', value: bankDetails?.account_number || 'Not Configured' },
                  { label: 'Branch', value: bankDetails?.branch || 'Not Configured' },
                ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{label}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
              After payment, upload your bank slip below. Credits are added within 24 hours.
            </Alert>
          </Card>
        </Grid>
      </Grid>

      {/* Transaction History Table */}
      <PaymentHistoryTable transactions={transactions as any} loading={loading} basePath="/dashboard" onCancel={handleCancelTransaction} />

      {/* Confirm Purchase Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ elevation: 0, sx: { border: '1px solid #E5E7EB', borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem' }}>Confirm Purchase</DialogTitle>
        <DialogContent>
          {selectedPackage && (
            <Box>
              <Box sx={{ bgcolor: '#F9FAFB', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>{selectedPackage.name}</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#6B7280' }}>{selectedPackage.creditAmount.toLocaleString()} SMS Credits</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.9rem', color: '#6B7280' }}>Total Amount</Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#4f46e5' }}>
                  Rs. {parseFloat(selectedPackage.price).toLocaleString()}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF', mt: 2 }}>
                You&apos;ll be asked to upload your bank transfer slip on the next screen.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ textTransform: 'none', color: '#6B7280' }}>Cancel</Button>
          {selectedPackage?.ownerId === null && (
            <Button
              variant="contained"
              onClick={handleOnePayPurchase}
              disabled={purchaseLoading}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              {purchaseLoading ? <CircularProgress size={18} color="inherit" /> : 'Pay via OnePay'}
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handlePurchase}
            disabled={purchaseLoading}
            sx={{ bgcolor: '#111827', '&:hover': { bgcolor: '#374151' }, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {purchaseLoading ? <CircularProgress size={18} color="inherit" /> : 'Bank Transfer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Slip Upload Dialog */}
      <Dialog open={slipOpen} onClose={() => setSlipOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ elevation: 0, sx: { border: '1px solid #E5E7EB', borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem' }}>Upload Payment Slip</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', mb: 2 }}>
            Please select the screenshot or image of your bank transfer receipt. Maximum size is 5MB.
          </Typography>
          
          <Box sx={{ border: '1px dashed #E5E7EB', borderRadius: 2, p: 3, textAlign: 'center', bgcolor: '#F9FAFB' }}>
            <Button
              variant="outlined"
              component="label"
              size="small"
              sx={{ textTransform: 'none', fontWeight: 600, mb: selectedFile ? 1 : 0 }}
            >
              Choose File
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
            </Button>
            {selectedFile && (
              <Typography sx={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600, mt: 1 }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setSlipOpen(false)} sx={{ textTransform: 'none', color: '#6B7280' }}>Skip for Now</Button>
          <Button
            variant="contained"
            onClick={handleSlipUpload}
            disabled={!selectedFile || slipLoading}
            startIcon={slipLoading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
            sx={{ bgcolor: '#111827', '&:hover': { bgcolor: '#374151' }, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Submit Slip
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


