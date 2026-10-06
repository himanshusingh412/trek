import { apiClient } from './client';
import { NotificationItem } from '../types/api';

export const NotificationsApi = {
  async getNotifications(): Promise<NotificationItem[]> {
    return apiClient<NotificationItem[]>('/api/v1/account/notifications');
  },

  async markAsRead(notification_id: string): Promise<void> {
    await apiClient(`/api/v1/account/notifications/${notification_id}/read`, {
      method: 'POST',
    });
  },
};
