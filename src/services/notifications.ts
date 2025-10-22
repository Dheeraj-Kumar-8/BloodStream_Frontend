import apiClient from './api';
import { Notification, PaginatedResponse } from '../types';

export const listNotifications = async (params?: { page?: number; limit?: number }) => {
  const { data } = await apiClient.get('/notifications', { params });
  return data as PaginatedResponse<Notification>;
};

export const markNotificationRead = async (notificationId: string) => {
  const { data } = await apiClient.post(`/notifications/${notificationId}/read`);
  return data as Notification;
};

export const markAllNotifications = async () => {
  const { data } = await apiClient.post('/notifications/mark-all');
  return data;
};
