import apiClient from './apiClient';
import { MatchModel } from '../models/match.model';

export const MatchService = {
  async getAll(): Promise<MatchModel[]> {
    try {
      const response = await apiClient.get<any[]>('/matches');
      return response.data.map(m => new MatchModel(m));
    } catch (error) {
      console.error("Error getting all matches", error);
      return [];
    }
  }
};