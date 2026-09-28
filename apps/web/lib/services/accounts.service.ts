import api from '../api';

export const AccountsService = {
  getAll: async () => {
    const { data } = await api.get('/accounts');
    return data;
  },

  getOne: async (id: string) => {
    const { data } = await api.get(`/accounts/${id}`);
    return data;
  },

  create: async (payload: {
    name: string;
    email: string;
    password: string;
    role?: 'reseller' | 'customer';
  }) => {
    const { data } = await api.post('/accounts', payload);
    return data;
  },

  update: async (id: string, payload: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
    status?: 'active' | 'suspended' | 'pending';
    timezone?: string;
    lowBalanceThreshold?: string | number;
  }) => {
    const { data } = await api.patch(`/accounts/${id}`, payload);
    return data;
  },

  topUp: async (id: string, amount: number, description?: string) => {
    const { data } = await api.post(`/accounts/${id}/credits/topup`, {
      amount,
      description,
    });
    return data;
  },

  transferCredits: async (toAccountId: string, amount: number, description?: string) => {
    const { data } = await api.post('/accounts/credits/transfer', {
      toAccountId,
      amount,
      description,
    });
    return data;
  },

  getCreditHistory: async (id: string) => {
    const { data } = await api.get(`/accounts/${id}/credits/history`);
    return data;
  },
};