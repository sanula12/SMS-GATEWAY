'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography,
  Box, Grid, Chip, Divider, CircularProgress, Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import TimelineIcon from '@mui/icons-material/Timeline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { SmsService } from '@/lib/services/sms.service';
import { formatDate } from '@/lib/utils';
import StatusChip from '@/components/ui/Statuschip';

interface Props {
  open: boolean;
  onClose: () => void;
  messageId: string | null;
}

export default function MessageTraceModal({ open, onClose, messageId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && messageId) {
      loadTrace();
    } else {
      setData(null);
    }
  }, [open, messageId]);

  const loadTrace = async () => {
    setLoading(true);
    try {
      const trace = await SmsService.getMessageTrace(messageId!);
      setData(trace);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calcLatency = (start?: string, end?: string) => {
    if (!start || !end) return '-';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diff = e - s;
    if (diff < 1000) return `${diff}ms`;
    return `${(diff / 1000).toFixed(2)}s`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TimelineIcon color="primary" />
        Message Trace Forensics
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ bgcolor: '#f8fafc', p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={5}>
            <CircularProgress />
          </Box>
        ) : !data ? (
          <Typography align="center" color="text.secondary">Could not load trace data.</Typography>
        ) : (
          <Grid container spacing={3}>
            {/* Core Info */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }} elevation={0}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <InfoOutlinedIcon fontSize="small" /> Routing & Identity
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Message ID (UUID)</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{data.id}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Provider Reference ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{data.providerMessageId || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Sender ID &rarr; Recipient</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {data.from || 'Default'} &rarr; {data.to}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Current Status</Typography>
                    <Box mt={0.5}><StatusChip status={data.status} /></Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Billing & Segments</Typography>
                    <Typography variant="body2">
                      Cost: Rs {parseFloat(data.creditCost).toFixed(2)} | Segments: {data.segmentCount}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Timeline */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }} elevation={0}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TimelineIcon fontSize="small" /> Delivery Timeline
                </Typography>
                
                <Box sx={{ mt: 2, position: 'relative', pl: 2, borderLeft: '2px solid #e2e8f0' }}>
                  {/* Step 1 */}
                  <Box sx={{ position: 'relative', mb: 3 }}>
                    <Box sx={{ position: 'absolute', left: -22, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main', border: '2px solid #fff' }} />
                    <Typography variant="body2" fontWeight={600}>Submitted to Gateway</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDate(data.createdAt)}</Typography>
                  </Box>

                  {/* Step 2 */}
                  <Box sx={{ position: 'relative', mb: 3 }}>
                    <Box sx={{ position: 'absolute', left: -22, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: data.sentAt ? 'info.main' : 'grey.300', border: '2px solid #fff' }} />
                    <Typography variant="body2" fontWeight={600} color={data.sentAt ? 'text.primary' : 'text.disabled'}>Dispatched to Carrier (SMSC)</Typography>
                    {data.sentAt ? (
                      <>
                        <Typography variant="caption" color="text.secondary" display="block">{formatDate(data.sentAt)}</Typography>
                        <Chip size="small" label={`+${calcLatency(data.createdAt, data.sentAt)}`} sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} />
                      </>
                    ) : <Typography variant="caption" color="text.disabled">Pending Dispatch...</Typography>}
                  </Box>

                  {/* Step 3 */}
                  <Box sx={{ position: 'relative' }}>
                    <Box sx={{ position: 'absolute', left: -22, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: data.deliveredAt ? 'success.main' : (data.status === 'failed' || data.status === 'rejected' ? 'error.main' : 'grey.300'), border: '2px solid #fff' }} />
                    <Typography variant="body2" fontWeight={600} color={data.deliveredAt || data.status === 'failed' ? 'text.primary' : 'text.disabled'}>
                      {data.status === 'failed' || data.status === 'rejected' ? 'Delivery Failed' : 'Delivered to Handset'}
                    </Typography>
                    {data.deliveredAt ? (
                      <>
                        <Typography variant="caption" color="text.secondary" display="block">{formatDate(data.deliveredAt)}</Typography>
                        <Chip size="small" label={`+${calcLatency(data.sentAt, data.deliveredAt)}`} sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} />
                      </>
                    ) : <Typography variant="caption" color="text.disabled">Awaiting Network DLR...</Typography>}
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Message Body & Payload */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, borderRadius: 2 }} elevation={0}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Message Body</Typography>
                <Typography variant="body2" sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 1, whiteSpace: 'pre-wrap' }}>
                  {data.body}
                </Typography>
                
                <Box mt={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CodeIcon fontSize="small" /> Raw Carrier DLR Payload
                  </Typography>
                  <Box sx={{ p: 1.5, bgcolor: '#1e293b', borderRadius: 1, overflowX: 'auto' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                      {data.providerResponse ? JSON.stringify(data.providerResponse, null, 2) : 'No diagnostic payload available.'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
}
