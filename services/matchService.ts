import apiClient from './apiClient';
import { MatchModel } from '../models/match.model';
import { MOCK_MATCHES } from '../constants';

export const MatchService = {
  async getAll(): Promise<MatchModel[]> {
    // Simulação com os novos Models
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_MATCHES.map(m => new MatchModel(m as any)));
      }, 400);
    });
  }
};