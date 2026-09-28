import api from '../api';

export const CampaignsService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const { data } = await api.get('/campaigns', { params });
    return data;
  },

  getOne: async (id: string) => {
    const { data } = await api.get(`/campaigns/${id}`);
    return data;
  },

  getMessages: async (id: string) => {
    const { data } = await api.get(`/campaigns/${id}/messages`);
    return data;
  },

  getStats: async (id: string) => {
    const { data } = await api.get(`/campaigns/${id}/stats`);
    return data;
  },

  create: async (payload: {
    name: string;
    message: string;
    senderId?: string;
    provider?: string;
    type: 'instant' | 'scheduled';
    scheduledAt?: string;
    groupIds?: string[];
    recipients?: string[];
  }) => {
    const { data } = await api.post('/campaigns', payload);
    return data;
  },

  cancel: async (id: string) => {
    const { data } = await api.delete(`/campaigns/${id}/cancel`);
    return data;
  },

  getPending: async () => {
    const { data } = await api.get('/campaigns/admin/pending');
    return data;
  },

  approve: async (id: string) => {
    const { data } = await api.post(`/campaigns/admin/${id}/approve`);
    return data;
  },

  reject: async (id: string) => {
    const { data } = await api.post(`/campaigns/admin/${id}/reject`);
    return data;
  },
};