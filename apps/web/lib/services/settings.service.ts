import api from '../api';

export class SettingsService {
  static async getGlobal() {
    const res = await api.get('/settings/global');
    return res.data;
  }

  static async getMySettings() {
    const res = await api.get('/settings/my');
    return res.data;
  }

  static async updateSettings(settings: { category: string; key: string; value: any }[]) {
    const res = await api.patch('/settings', settings);
    return res.data;
  }
}
