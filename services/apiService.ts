
import { Match, UserRanking, Team, MatchStage } from '../types';
import { MOCK_MATCHES, MOCK_LEADERBOARD, GROUP_DEFINITIONS } from '../constants';

const simulateNetwork = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, 500);
  });
};

export const ApiService = {
  async getMatches(): Promise<Match[]> {
    return simulateNetwork(MOCK_MATCHES);
  },

  async getMatchesByStage(stage: MatchStage): Promise<Match[]> {
    const matches = MOCK_MATCHES.filter(m => m.stage === stage);
    return simulateNetwork(matches);
  },

  async getLeaderboard(): Promise<UserRanking[]> {
    return simulateNetwork(MOCK_LEADERBOARD);
  },

  async getTeamsByGroup(groupLetter: string): Promise<Team[]> {
    const teams = GROUP_DEFINITIONS[groupLetter] || [];
    return simulateNetwork(teams);
  },

  async savePrediction(matchId: string, homeScore: string, awayScore: string): Promise<boolean> {
    const saved = localStorage.getItem('copaPixelPredictions') || '{}';
    const predictions = JSON.parse(saved);
    predictions[matchId] = { home: homeScore, away: awayScore };
    localStorage.setItem('copaPixelPredictions', JSON.stringify(predictions));
    return simulateNetwork(true);
  },

  async getSavedPredictions(): Promise<Record<string, { home: string, away: string }>> {
    const saved = localStorage.getItem('copaPixelPredictions');
    let data = saved ? JSON.parse(saved) : {};
    
    // Se estiver vazio, vamos injetar alguns palpites para os jogos que já passaram (10/06 e 11/06)
    // Isso permite que o usuário veja os pontos logo de cara.
    if (Object.keys(data).length === 0) {
      MOCK_MATCHES.forEach(m => {
        if (m.date.startsWith('10/06') || m.date.startsWith('11/06')) {
          // Palpites simulados: alguns acertos em cheio, outros parciais
          data[m.id] = { 
            home: m.id.endsWith('1') ? "2" : "1", 
            away: m.id.endsWith('1') ? "0" : "2" 
          };
        }
      });
      localStorage.setItem('copaPixelPredictions', JSON.stringify(data));
    }

    return simulateNetwork(data);
  }
};