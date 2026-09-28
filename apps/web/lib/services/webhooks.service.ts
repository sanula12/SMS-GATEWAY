import api from '../api';

export const WebhooksService = {
  findAll: async () => {
    const { data } = await api.get('/webhooks');
    return data;
  },

  create: async (payload: { url: string; events?: string[]; secret?: string }) => {
    const { data } = await api.post('/webhooks', payload);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete(`/webhooks/${id}`);
    return data;
  }
};
