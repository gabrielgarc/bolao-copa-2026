import apiClient from './apiClient';
import { Announcement } from '../models/announcement.model';

export const AnnouncementService = {
  async getAll(userId: string): Promise<Announcement[]> {
    const response = await apiClient.get<Announcement[]>(`/Announcements?userId=${userId}`);
    return response.data;
  },

  async getUnread(userId: string): Promise<Announcement | null> {
    const response = await apiClient.get<Announcement | null>(`/Announcements/unread/${userId}`);
    return response.data;
  },

  async markAsRead(announcementId: string, userId: string): Promise<void> {
    await apiClient.post(`/Announcements/${announcementId}/read`, JSON.stringify(userId));
  },

  async create(title: string, description: string): Promise<Announcement> {
    const response = await apiClient.post<Announcement>('/Announcements', { title, description }, {
      headers: { 'X-Admin-Token': 'admin-secret-token' }
    });
    return response.data;
  },

  async deleteAnnouncement(announcementId: string): Promise<void> {
    await apiClient.delete(`/Announcements/${announcementId}`, {
      headers: { 'X-Admin-Token': 'admin-secret-token' }
    });
  }
};
