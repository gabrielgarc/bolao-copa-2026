
import apiClient from './apiClient';
import { MOCK_MATCHES } from '../constants';

export const PredictionService = {
  async save(matchId: string, home: string, away: string): Promise<boolean> {
    const saved = localStorage.getItem('copaPixelPredictions') || '{}';
    const predictions = JSON.parse(saved);
    predictions[matchId] = { home, away };
    localStorage.setItem('copaPixelPredictions', JSON.stringify(predictions));
    return true;
  },

  async getSaved(): Promise<Record<string, { home: string, away: string }>> {
    const saved = localStorage.getItem('copaPixelPredictions');
    let data = saved ? JSON.parse(saved) : {};
    
    if (Object.keys(data).length === 0) {
      MOCK_MATCHES.forEach(m => {
        if (m.date.startsWith('10/06') || m.date.startsWith('11/06')) {
          data[m.id] = { 
            home: m.id.endsWith('1') ? "2" : "1", 
            away: m.id.endsWith('1') ? "0" : "2" 
          };
        }
      });
      localStorage.setItem('copaPixelPredictions', JSON.stringify(data));
    }

    return data;
  }
};