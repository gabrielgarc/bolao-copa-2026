
import { PredictionDTO } from '../dtos/prediction.dto';

export class PredictionModel {
  matchId: string;
  homeScore: string;
  awayScore: string;

  constructor(dto: PredictionDTO) {
    this.matchId = dto.matchId;
    this.homeScore = dto.homeScore;
    this.awayScore = dto.awayScore;
  }
}