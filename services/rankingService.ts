import apiClient from './apiClient';
import { RankingModel } from '../models/ranking.model';

export interface MyRankingData {
  pointsByMatch: Record<string, number>;
  pointsByStage: Record<string, number>;
  totalPoints: number;
  qualifiedTeamsCount: number;
  correctQualifiedTeamIds: string[];
}

export const RankingService = {
  async getLeaderboard(): Promise<RankingModel[]> {
    try {
      const response = await apiClient.get<any[]>('/ranking');
      return response.data.map(r => new RankingModel(r));
    } catch (error) {
      console.error("Error getting leaderboard", error);
      return [];
    }
  },

  async getMyRanking(): Promise<MyRankingData> {
    try {
      const response = await apiClient.get<MyRankingData>('/ranking/me');
      return response.data;
    } catch (error) {
      console.error("Error getting my ranking", error);
      return { 
        pointsByMatch: {}, 
        pointsByStage: {}, 
        totalPoints: 0, 
        qualifiedTeamsCount: 0,
        correctQualifiedTeamIds: []
      };
    }
  }
};