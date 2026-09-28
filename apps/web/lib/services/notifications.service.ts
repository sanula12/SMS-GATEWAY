import api from '../api';

export interface AppNotification {
  id: string;
  accountId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationsService = {
  getUnread: async (): Promise<AppNotification[]> => {
    const res = await api.get('/notifications');
    return res.data;
  },
  
  markAsRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  }
};
