import api from '../api';

export const SchedulerService = {
  schedule: async (payload: {
    to: string;
    body: string;
    from?: string;
    scheduledAt: string;
  }) => {
    const { data } = await api.post('/scheduler/schedule', payload);
    return data;
  },

  cancel: async (messageId: string) => {
    const { data } = await api.delete(`/scheduler/cancel/${messageId}`);
    return data;
  },

  getScheduled: async () => {
    const { data } = await api.get('/scheduler/scheduled');
    return data;
  },

  importExcel: async (file: File, senderId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (senderId) formData.append('senderId', senderId);
    const { data } = await api.post('/scheduler/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/scheduler/stats');
    return data;
  },
};