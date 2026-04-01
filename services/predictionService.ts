import apiClient from './apiClient';

export const PredictionService = {
  async save(matchId: string, home: string, away: string): Promise<boolean> {
    try {
      await apiClient.post('/predictions', { matchId, homeScore: home, awayScore: away });
      return true;
    } catch (error) {
      console.error("Error saving prediction", error);
      throw error;
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