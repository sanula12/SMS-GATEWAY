'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Button, Divider, CircularProgress, Alert } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef } from 'react';
import { PackagesService } from '@/lib/services/packages.service';

export default function InvoiceClient({ txId }: { txId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    PackagesService.getInvoice(txId)
      .then((res) => setData(res))
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [txId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="error">{error || 'Invoice not found'}</Alert>
      </Box>
    );
  }

  const { transaction: tx, company } = data;
  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${tx.id.split('-')[0]}.pdf`);
    } catch (e) {
      console.error('Failed to generate PDF', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto', bgcolor: '#fff', minHeight: '100vh', color: '#111827' }}>
      {/* Non-printable action bar */}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 4, '@media print': { display: 'none' } }}>
        <Button 
          variant="outlined" 
          startIcon={downloading ? <CircularProgress size={18} /> : <DownloadIcon />} 
          onClick={handleDownloadPdf}
          disabled={downloading}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {downloading ? 'Generating PDF...' : 'Download PDF'}
        </Button>
        <Button 
          variant="contained" 
          startIcon={<PrintIcon />} 
          onClick={() => window.print()}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2 }}
        >
          Print Invoice
        </Button>
      </Box>


      <div ref={invoiceRef}>
      {/* Invoice Document */}
      <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 2, p: { xs: 4, md: 8 } }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
          <Box>
            <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', mb: 1 }}>INVOICE</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>Invoice #: INV-{tx.id.split('-')[0].toUpperCase()}</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>Date: {new Date(tx.createdAt).toLocaleDateString()}</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>Status: <span style={{ color: tx.status === 'completed' ? '#059669' : '#D97706', textTransform: 'uppercase' }}>{tx.status}</span></Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{company.name}</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', mt: 1, whiteSpace: 'pre-line' }}>{company.address}</Typography>
            {company.taxId && <Typography sx={{ fontSize: '0.85rem', color: '#6B7280' }}>Tax ID: {company.taxId}</Typography>}
            <Typography sx={{ fontSize: '0.85rem', color: '#6B7280' }}>{company.email}</Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 6 }} />

        {/* Billed To */}
        <Box sx={{ mb: 6 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>
            Billed To
          </Typography>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{tx.accountName}</Typography>
          {tx.accountEmail && <Typography sx={{ fontSize: '0.9rem', color: '#4B5563' }}>{tx.accountEmail}</Typography>}
          {tx.accountPhone && <Typography sx={{ fontSize: '0.9rem', color: '#4B5563' }}>{tx.accountPhone}</Typography>}
        </Box>

        {/* Line Items */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', bgcolor: '#F9FAFB', p: 2, borderRadius: 2, mb: 2 }}>
            <Typography sx={{ flex: 1, fontSize: '0.75rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Description</Typography>
            <Typography sx={{ width: 150, textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Amount</Typography>
          </Box>
          <Box sx={{ display: 'flex', p: 2, borderBottom: '1px solid #E5E7EB' }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, color: '#111827' }}>{tx.packageName} Package</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#6B7280' }}>{parseFloat(tx.packageCredits).toLocaleString()} SMS Credits</Typography>
            </Box>
            <Box sx={{ width: 150, textAlign: 'right' }}>
              <Typography sx={{ fontWeight: 700, color: '#111827' }}>Rs. {parseFloat(tx.amount).toLocaleString()}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Totals */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 8 }}>
          <Box sx={{ width: 300 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>Subtotal</Typography>
              <Typography sx={{ color: '#111827', fontWeight: 700 }}>Rs. {parseFloat(tx.amount).toLocaleString()}</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '1.25rem', color: '#111827', fontWeight: 800 }}>Total</Typography>
              <Typography sx={{ fontSize: '1.25rem', color: '#4f46e5', fontWeight: 800 }}>Rs. {parseFloat(tx.amount).toLocaleString()}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography sx={{ fontSize: '0.85rem', color: '#9CA3AF', fontWeight: 600 }}>
            Thank you for your business!
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#D1D5DB', mt: 1 }}>
            This is a computer-generated invoice and does not require a signature.
          </Typography>
        </Box>
            </Box>
      </div>
    </Box>
  );
}



