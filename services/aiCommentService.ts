import apiClient from './apiClient';
import { AiComment } from '../types';

export const AiCommentService = {
  async getComments(): Promise<AiComment[]> {
    try {
      const response = await apiClient.get<AiComment[]>('/AiComment');
      return response.data;
    } catch (e) {
      console.error('Failed to fetch AI comments', e);
      return [];
    }
  }
};
