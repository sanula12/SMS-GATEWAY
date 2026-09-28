'use client';

import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, TextField, Button, Avatar, Chip, CircularProgress, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/navigation';
import { TicketsService, Ticket, TicketMessage } from '@/lib/services/tickets.service';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function TicketDetailClient({ id, baseUrl }: { id: string, baseUrl: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const data = await TicketsService.getById(id);
      setTicket(data.ticket);
      setMessages(data.messages);
    } catch (e) {
      console.error(e);
      router.push(baseUrl);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleReply = async () => {
    if (!reply.trim() && !file) return;
    setSending(true);
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

      await TicketsService.reply(id, { message: reply || 'Sent an attachment.', attachmentUrl });
      setReply('');
      setFile(null);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    try {
      await TicketsService.updateStatus(id, 'resolved');
      load();
    } catch(e) {}
  };

  if (loading) return <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!ticket) return null;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', pb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            <Typography component="span" color="primary" fontWeight={800} variant="h5">#{ticket.ticketNumber}</Typography> - {ticket.subject}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
            <Chip 
              label={ticket.status.toUpperCase()} 
              size="small" 
              color={ticket.status === 'open' ? 'success' : ticket.status === 'pending' ? 'warning' : ticket.status === 'resolved' ? 'primary' : 'default'}
            />
            <Typography variant="caption" color="text.secondary">
              Opened {formatDate(ticket.createdAt)}
            </Typography>
          </Box>
        </Box>
        {(user?.role === 'super_admin' || user?.role === 'reseller') && ticket.status !== 'resolved' && (
          <Button variant="outlined" color="primary" onClick={handleResolve} startIcon={<CheckCircleIcon />}>Mark Resolved</Button>
        )}
      </Box>

      <Card elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e8eaf0', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {messages.map((msg) => (
          <Box key={msg.id} sx={{ display: 'flex', gap: 2, flexDirection: msg.role === 'super_admin' ? 'row-reverse' : 'row' }}>
            <Avatar sx={{ bgcolor: msg.role === 'super_admin' ? '#4caf50' : '#4f6ef7', width: 36, height: 36, fontSize: '0.9rem' }}>
              {(msg.accountName || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ 
              maxWidth: '80%', 
              bgcolor: msg.role === 'super_admin' ? '#f0fdf4' : '#f8fafc',
              border: '1px solid',
              borderColor: msg.role === 'super_admin' ? '#bbf7d0' : '#e2e8f0',
              p: 2, borderRadius: 3,
              borderTopRightRadius: msg.role === 'super_admin' ? 4 : 24,
              borderTopLeftRadius: msg.role === 'super_admin' ? 24 : 4,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 2 }}>
                <Typography variant="caption" fontWeight={700} color="text.primary">
                  {msg.role === 'super_admin' ? 'Support Agent' : msg.accountName || 'Customer'}
                </Typography>
                <Typography variant="caption" color="text.secondary">{new Date(msg.createdAt).toLocaleString()}</Typography>
              </Box>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.message}</Typography>
              {msg.attachmentUrl && (
                <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={msg.attachmentUrl} alt="Attachment" style={{ maxWidth: '100%', display: 'block' }} />
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Card>

      {ticket.status !== 'closed' && (
        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e8eaf0', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {file && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f1f5f9', p: 1, borderRadius: 2, alignSelf: 'flex-start' }}>
              <PhotoCameraIcon fontSize="small" color="action" />
              <Typography variant="caption" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </Typography>
              <IconButton size="small" onClick={() => setFile(null)}><CloseIcon fontSize="small" /></IconButton>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
              <TextField 
                fullWidth 
                multiline 
                minRows={1} 
                maxRows={4}
                placeholder="Type your reply here..." 
                variant="outlined" 
                size="small"
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              <Box sx={{ position: 'absolute', bottom: 4, right: 4 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="reply-image-upload"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
                <label htmlFor="reply-image-upload">
                  <IconButton component="span" color="primary" disabled={sending}>
                    <PhotoCameraIcon />
                  </IconButton>
                </label>
              </Box>
            </Box>
            <Button 
              variant="contained" 
              onClick={handleReply} 
              disabled={(!reply.trim() && !file) || sending}
              sx={{ px: 4, borderRadius: 2, height: 40 }}
              endIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            >
              Reply
            </Button>
          </Box>
        </Card>
      )}
    </Box>
  );
}
