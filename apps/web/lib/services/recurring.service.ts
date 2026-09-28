import api from '../api';

export const RecurringService = {
  createFromExcel: async (payload: {
    name: string;
    messageTemplate: string;
    sendTime: string;
    senderId?: string;
    frequency?: string;
    file: File;
  }) => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('messageTemplate', payload.messageTemplate);
    formData.append('sendTime', payload.sendTime);
    if (payload.frequency) formData.append('frequency', payload.frequency);
    if (payload.senderId) formData.append('senderId', payload.senderId);
    formData.append('file', payload.file);

    const { data } = await api.post('/recurring-campaigns/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getAll: async () => {
    const { data } = await api.get('/recurring-campaigns');
    return data;
  },

  updateStatus: async (id: string, status: 'active' | 'paused') => {
    const { data } = await api.patch(`/recurring-campaigns/${id}`, { status });
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete(`/recurring-campaigns/${id}`);
    return data;
  },
};
