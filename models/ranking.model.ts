
import { RankingDTO } from '../dtos/ranking.dto';
import { UserRanking } from '../types';

export class RankingModel implements UserRanking {
  id: string;
  name: string;
  points: number;
  avatar: string;
  fullMatches: number;
  qualifiedTeamsCount: number;
  halfMatches: number;
  outcomeMatches: number;
  partialMatches: number;
  zeroMatches: number;

  constructor(dto: RankingDTO) {
    this.id = dto.id;
    this.name = dto.name;
    this.points = dto.points;
    this.avatar = dto.avatar;
    this.fullMatches = dto.fullMatches || 0;
    this.qualifiedTeamsCount = dto.qualifiedTeamsCount || 0;
    this.halfMatches = dto.halfMatches || 0;
    this.outcomeMatches = dto.outcomeMatches || 0;
    this.partialMatches = dto.partialMatches || 0;
    this.zeroMatches = dto.zeroMatches || 0;
  }
}