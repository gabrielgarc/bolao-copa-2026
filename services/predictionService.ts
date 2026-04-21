import { StandingsResponse } from '../types';
import apiClient from './apiClient';

export const PredictionService = {
  async save(matchId: string, home: string, away: string): Promise<StandingsResponse | null> {
    try {
      const resp = await apiClient.post<StandingsResponse>('/predictions', { matchId, homeScore: home, awayScore: away });
      return resp.data;
    } catch (error) {
      console.error("Error saving prediction", error);
      throw error;
    }
  },

  async getStandings(official: boolean = false): Promise<StandingsResponse> {
    try {
      const response = await apiClient.get<StandingsResponse>(`/predictions/standings?official=${official}`);
      return response.data;
    } catch (error) {
      console.error("Error getting standings", error);
      return { groups: {}, overallThirds: [] };
    }
  },

  async getSaved(): Promise<Record<string, { home: string, away: string }>> {
    try {
      const response = await apiClient.get<Record<string, { matchId: string, homeScore: string, awayScore: string }>>('/predictions');
      const predictions = response.data;
      const formattedPredictions: Record<string, { home: string, away: string }> = {};
      for (const matchId in predictions) {
        // Fallback robusto para lidar com o default de serializacao PascalCase x camelCase
        const p = predictions[matchId] as any;
        const key = matchId.toLowerCase();
        formattedPredictions[key] = {
          home: p.homeScore?.toString() ?? p.HomeScore?.toString() ?? '',
          away: p.awayScore?.toString() ?? p.AwayScore?.toString() ?? ''
        };
      }
      return formattedPredictions;
    } catch (error) {
      console.error("Error getting saved predictions", error);
      return {};
    }
  }
};