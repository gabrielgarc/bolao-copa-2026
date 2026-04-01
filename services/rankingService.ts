import apiClient from './apiClient';
import { RankingModel } from '../models/ranking.model';

export const RankingService = {
  async getLeaderboard(): Promise<RankingModel[]> {
    try {
      const response = await apiClient.get<any[]>('/ranking');
      return response.data.map(r => new RankingModel(r));
    } catch (error) {
      console.error("Error getting leaderboard", error);
      return [];
    }
  }
};