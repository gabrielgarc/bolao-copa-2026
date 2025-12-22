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
    this.group = dto.group;
    this.stadium = dto.stadium;
    this.stage = dto.stage as MatchStage;
    this.realHomeScore = dto.realHomeScore;
    this.realAwayScore = dto.realAwayScore;
    this.isLocked = dto.isLocked;
    this.placeholderLabel = dto.placeholderLabel;
  }
}