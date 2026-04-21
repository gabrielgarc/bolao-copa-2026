import { Match, UserRanking, Team, MatchStage } from '../types';

const BASE_URL = 'http://localhost:5000';

export const ApiService = {
  async getMatches(): Promise<Match[]> {
    const response = await fetch(`${BASE_URL}/api/matches`);
    if (!response.ok) {
      throw new Error('Falha ao buscar partidas.');
    }
    return response.json();
  },

  async getMatchesByStage(stage: MatchStage): Promise<Match[]> {
    const response = await fetch(`${BASE_URL}/api/matches?stage=${stage}`);
    if (!response.ok) {
      throw new Error(`Falha ao buscar partidas para a fase ${stage}.`);
    }
    return response.json();
  },

  async getLeaderboard(): Promise<UserRanking[]> {
    const response = await fetch(`${BASE_URL}/api/leaderboard`);
    if (!response.ok) {
      throw new Error('Falha ao buscar o ranking.');
    }
    return response.json();
  },

  async getTeamsByGroup(groupLetter: string): Promise<Team[]> {
    const response = await fetch(`${BASE_URL}/api/teams?group=${groupLetter}`);
    if (!response.ok) {
      throw new Error(`Falha ao buscar times para o grupo ${groupLetter}.`);
    }
    return response.json();
  },

  async savePrediction(matchId: string, homeScore: string, awayScore: string): Promise<boolean> {
    const saved = localStorage.getItem('copaPixelPredictions') || '{}';
    const predictions = JSON.parse(saved);
    predictions[matchId] = { home: homeScore, away: awayScore };
    localStorage.setItem('copaPixelPredictions', JSON.stringify(predictions));
    // Não há necessidade de simular rede para operações de localStorage
    return true;
  },

  async getSavedPredictions(): Promise<Record<string, { home: string, away: string }>> {
    const saved = localStorage.getItem('copaPixelPredictions');
    let data = saved ? JSON.parse(saved) : {};
    
    // Se estiver vazio, vamos injetar alguns palpites para os jogos que já passaram (10/06 e 11/06)
    // Isso permite que o usuário veja os pontos logo de cara.
    // A lógica de injeção de dados simulados é removida, pois as partidas virão do backend.
    // Se não houver previsões salvas, retorna um objeto vazio.
    return data;
  },

  async getGroupDefinitions(): Promise<any[]> {
    const letters = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    return letters.map(letter => ({
      groupLetter: letter,
      teams: []
    }));
  },

  async getSimulatedDate(): Promise<string> {
    return "2026-06-11"; // Mock
  }
};