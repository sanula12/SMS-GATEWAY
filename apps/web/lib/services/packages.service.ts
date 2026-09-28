import api from '../api';

export const PackagesService = {
  // Get packages visible to current user
  getAll: async () => {
    const { data } = await api.get('/packages');
    return data;
  },

  // Get wholesale packages (resellers only)
  getWholesale: async () => {
    const { data } = await api.get('/packages/wholesale');
    return data;
  },

  // Get all payment transactions
  getTransactions: async (type?: string) => {
    const { data } = await api.get('/packages/transactions', { params: { type } });
    return data;
  },

  // Get invoice details
  getInvoice: async (txId: string) => {
    const { data } = await api.get(`/packages/transactions/${txId}/invoice`);
    return data;
  },

  // Admin/Reseller: create a package
  create: async (payload: {
    name: string;
    type?: 'retail' | 'wholesale';
    price: number;
    creditAmount: number;
    features?: any;
    isActive?: boolean;
  }) => {
    const { data } = await api.post('/packages', payload);
    return data;
  },

  // Admin/Reseller: update a package
  update: async (id: string, payload: Partial<{
    name: string;
    type: 'retail' | 'wholesale';
    price: number;
    creditAmount: number;
    features: any;
    isActive: boolean;
  }>) => {
    const { data } = await api.patch(`/packages/${id}`, payload);
    return data;
  },

  // Admin/Reseller: deactivate a package
  remove: async (id: string) => {
    const { data } = await api.delete(`/packages/${id}`);
    return data;
  },

  // Customer: initiate bank transfer purchase
  initiateBankTransfer: async (packageId: string) => {
    const { data } = await api.post(`/packages/${packageId}/purchase/bank-transfer`);
    return data;
  },

  // Customer: initiate OnePay purchase
  initiateOnePay: async (packageId: string) => {
    const { data } = await api.post(`/packages/${packageId}/purchase/onepay`);
    return data;
  },

  // Customer: attach slip URL after upload
  attachSlip: async (txId: string, slipUrl: string) => {
    const { data } = await api.patch(`/packages/transactions/${txId}/slip`, { slipUrl });
    return data;
  },

  // Admin/Reseller: approve payment
  approve: async (txId: string) => {
    const { data } = await api.patch(`/packages/transactions/${txId}/approve`);
    return data;
  },

  // Admin/Reseller: reject payment
  reject: async (txId: string, notes: string) => {
    const { data } = await api.patch(`/packages/transactions/${txId}/reject`, { notes });
    return data;
  },
};

