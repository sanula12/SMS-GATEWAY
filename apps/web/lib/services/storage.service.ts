import api from '../api';

export const StorageService = {
  uploadImage: async (file: File, folder: string = 'slips') => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/upload/image?folder=${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadDocument: async (file: File, folder: string = 'documents') => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/upload/document?folder=${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
