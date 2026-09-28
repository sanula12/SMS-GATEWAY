import api from '../api';

export interface WhitelabelConfig {
  domain: string | null;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  supportEmail: string | null;
}

export const WhitelabelService = {
  getMyConfig: async (): Promise<WhitelabelConfig> => {
    const { data } = await api.get('/whitelabel/me');
    return data;
  },

  updateConfig: async (payload: Partial<WhitelabelConfig>): Promise<WhitelabelConfig> => {
    const { data } = await api.post('/whitelabel/me', payload);
    return data;
  }
};
