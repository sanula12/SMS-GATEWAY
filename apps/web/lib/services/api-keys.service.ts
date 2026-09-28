import api from '../api';

export const ApiKeysService = {
  getAll: async () => {
    const { data } = await api.get('/api-keys');
    return data;
  },

  create: async (payload: {
    name: string;
    permissions?: string[];
    expiresAt?: string;
  }) => {
    const { data } = await api.post('/api-keys', payload);
    return data;
  },

  revoke: async (id: string) => {
    const { data } = await api.delete(`/api-keys/${id}`);
    return data;
  },
};