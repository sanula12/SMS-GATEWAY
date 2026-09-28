import api from '../api';

export const SmsService = {
  sendSingle: async (payload: {
    to: string;
    body: string;
    from?: string;
    provider?: string;
    scheduledAt?: string;
  }) => {
    const { data } = await api.post('/sms/send', payload);
    return data;
  },

  sendBulk: async (payload: {
    to: string[];
    body: string;
    from?: string;
    provider?: string;
    campaignName?: string;
    scheduledAt?: string;
  }) => {
    const { data } = await api.post('/sms/bulk', payload);
    return data;
  },

  getMessageTrace: async (id: string) => {
    const { data } = await api.get(`/sms/messages/${id}`);
    return data;
  },

  getMessages: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const { data } = await api.get('/sms/messages', { params });
    return data;
  },

  getGlobalLogs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const { data } = await api.get('/sms/admin/logs', { params });
    return data;
  },

  // Admin only: global message logs
  getGlobal: async () => {
    const { data } = await api.get('/sms/admin/logs');
    return data;
  },

  // Reseller only: logs for all their customers
  getResellerLogs: async () => {
    const { data } = await api.get('/sms/reseller/logs');
    return data;
  },

  getProviders: async () => {
    const { data } = await api.get('/sms/providers');
    return data;
  },
};