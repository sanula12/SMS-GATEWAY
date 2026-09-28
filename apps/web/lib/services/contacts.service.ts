import api from '../api';

export const ContactsService = {
  getAll: async (groupId?: string) => {
    const { data } = await api.get('/contacts', {
      params: groupId ? { groupId } : {},
    });
    return data;
  },

  getOne: async (id: string) => {
    const { data } = await api.get(`/contacts/${id}`);
    return data;
  },

  create: async (payload: {
    phone: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    groupId?: string;
  }) => {
    const { data } = await api.post('/contacts', payload);
    return data;
  },

  bulkImport: async (payload: { rows: any[], groupId?: string }) => {
    const { data } = await api.post('/contacts/bulk-import', payload);
    return data;
  },

  update: async (id: string, payload: any) => {
    const { data } = await api.patch(`/contacts/${id}`, payload);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete(`/contacts/${id}`);
    return data;
  },

  getGroups: async () => {
    const { data } = await api.get('/contacts/groups/all');
    return data;
  },

  createGroup: async (payload: { name: string; description?: string }) => {
    const { data } = await api.post('/contacts/groups', payload);
    return data;
  },

  deleteGroup: async (id: string) => {
    const { data } = await api.delete(`/contacts/groups/${id}`);
    return data;
  },
};