import { RankingDTO } from '../dtos/ranking.dto';
import { UserRanking } from '../types';

export class RankingModel implements UserRanking {
  id: string;
  name: string;
  points: number;
  avatar: string;

  constructor(dto: RankingDTO) {
    this.id = dto.id;
    this.name = dto.name;
    this.points = dto.points;
    this.avatar = dto.avatar;
  }
}