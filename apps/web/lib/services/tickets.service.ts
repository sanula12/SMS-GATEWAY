import api from '../api';

export interface Ticket {
  id: string;
  ticketNumber: string;
  accountId: string;
  accountName?: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  accountId: string;
  accountName?: string;
  role?: string;
  message: string;
  attachmentUrl?: string;
  isInternal: boolean;
  createdAt: string;
}

export const TicketsService = {
  create: async (payload: { subject: string; message: string; priority?: string; attachmentUrl?: string }) => {
    return api.post('/tickets', payload);
  },

  getAll: async () => {
    return api.get('/tickets').then(res => res.data);
  },

  getById: async (id: string) => {
    return api.get(`/tickets/${id}`).then(res => res.data);
  },

  reply: async (id: string, payload: { message: string; attachmentUrl?: string }) => {
    return api.post(`/tickets/${id}/messages`, payload);
  },

  updateStatus: async (id: string, status: string) => {
    return api.patch(`/tickets/${id}/status`, { status });
  }
};
