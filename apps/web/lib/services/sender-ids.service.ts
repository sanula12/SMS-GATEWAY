import api from '../api';

export const SenderIdsService = {
  getAll: async () => {
    const { data } = await api.get('/sender-ids');
    return data;
  },

  getCustomerRequests: async () => {
    const { data } = await api.get('/sender-ids/customer-requests');
    return data;
  },

  create: async (payload: { 
    senderId: string; 
    country?: string;
    nicUrl?: string;
    brUrl?: string;
    requestLetterUrl?: string;
  }) => {
    const { data } = await api.post('/sender-ids', payload);
    return data;
  },

  resellerReview: async (id: string, resellerStatus: 'approved' | 'rejected') => {
    const { data } = await api.patch(`/sender-ids/${id}/reseller-review`, { resellerStatus });
    return data;
  },

  updateStatus: async (id: string, status: 'approved' | 'rejected') => {
    const { data } = await api.patch(`/sender-ids/${id}/status`, { status });
    return data;
  },

  setDefault: async (id: string) => {
    const { data } = await api.patch(`/sender-ids/${id}/set-default`);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete(`/sender-ids/${id}`);
    return data;
  },
};