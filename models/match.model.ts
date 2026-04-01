
import { MatchDTO } from '../dtos/match.dto';
import { Match, MatchStage, Team } from '../types';
import { TeamModel } from './team.model';

export class MatchModel implements Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  group: string;
  stadium: string;
  stage: MatchStage;
  realHomeScore?: number;
  realAwayScore?: number;
  isLocked: boolean;
  placeholderLabel?: string;

  constructor(dto: MatchDTO) {
    this.id = dto.id;
    this.homeTeam = new TeamModel(dto.homeTeam);
    this.awayTeam = new TeamModel(dto.awayTeam);
    this.date = dto.date;
    this.time = dto.time;
    this.group = dto.group ? dto.group.replace('GROUP_', 'Grupo ') : '';
    this.stadium = dto.stadium;
    
    // Mapeamento das fases da API para as abas do Frontend
    switch (dto.stage) {
      case 'LAST_32': this.stage = 'R32'; break;
      case 'LAST_16': this.stage = 'R16'; break;
      case 'QUARTER_FINALS': this.stage = 'QF'; break;
      case 'SEMI_FINALS': this.stage = 'SF'; break;
      case 'THIRD_PLACE': 
      case 'FINAL': this.stage = 'FINAL'; break;
      case 'GROUP_STAGE':
      default: this.stage = 'GROUPS'; break;
    }

    this.realHomeScore = dto.realHomeScore;
    this.realAwayScore = dto.realAwayScore;
    this.isLocked = dto.isLocked;
    this.placeholderLabel = dto.placeholderLabel;
  }
}