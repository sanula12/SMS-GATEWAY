import { Box, Typography, IconButton, Tooltip, Chip, Card } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import DataTable, { ColumnDef } from '../shared/DataTable';

const statusColor: Record<string, any> = {
  pending: { bgcolor: '#FEF3C7', color: '#D97706' },
  completed: { bgcolor: '#D1FAE5', color: '#059669' },
  failed: { bgcolor: '#FEE2E2', color: '#DC2626' },
  rejected: { bgcolor: '#FEE2E2', color: '#DC2626' },
  canceled: { bgcolor: '#F3F4F6', color: '#6B7280' },
};

type Transaction = {
  id: string;
  packageId: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed' | 'rejected' | 'canceled';
  slipUrl?: string;
  createdAt: string;
};

export default function PaymentHistoryTable({ transactions, loading, basePath, onCancel }: { transactions: Transaction[], loading: boolean, basePath: string, onCancel?: (id: string) => void }) {

  const handleDownloadInvoice = (txId: string) => {
    window.open(`${basePath}/invoice/${txId}`, '_blank');
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      id: 'date',
      label: 'Date',
      render: (tx) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      id: 'id',
      label: 'Transaction ID',
      render: (tx) => <span style={{ fontFamily: 'monospace', color: '#6B7280' }}>{tx.id.split('-')[0]}...</span>
    },
    {
      id: 'amount',
      label: 'Amount',
      render: (tx) => <strong style={{ color: '#111827' }}>Rs. {parseFloat(tx.amount).toLocaleString()}</strong>
    },
    {
      id: 'status',
      label: 'Status',
      render: (tx) => (
        <Chip 
          label={tx.status.toUpperCase()} 
          size="small"
          sx={{ 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            ...statusColor[tx.status],
            height: 24,
            borderRadius: 1
          }} 
        />
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (tx) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {tx.status === 'completed' && (
            <Tooltip title="Download Invoice">
              <IconButton size="small" onClick={() => handleDownloadInvoice(tx.id)} sx={{ color: '#4f46e5', bgcolor: '#EEF2FF', '&:hover': { bgcolor: '#E0E7FF' } }}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {tx.status === 'pending' && onCancel && (
            <Tooltip title="Cancel Transaction">
              <IconButton size="small" onClick={() => onCancel(tx.id)} sx={{ color: '#DC2626', bgcolor: '#FEE2E2', '&:hover': { bgcolor: '#FCA5A5' } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ mt: 4 }}>
      <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
        <DataTable
          title="Purchase History"
          columns={columns}
          data={transactions}
          loading={loading}
          emptyIcon={<ReceiptLongIcon sx={{ fontSize: 48, color: '#E5E7EB', mb: 2 }} />}
          emptyMessage="No purchases found"
        />
      </Card>
    </Box>
  );
}
