import apiClient from './apiClient';
import { RankingModel } from '../models/ranking.model';
import { MOCK_LEADERBOARD } from '../constants';

export const RankingService = {
  async getLeaderboard(): Promise<RankingModel[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_LEADERBOARD.map(r => new RankingModel(r)));
      }, 400);
    });
  }
};