
import { TeamDTO, MatchDTO, RankingDTO, PredictionDTO, UserDTO } from '../dtos/api.dtos';
import { Team, Match, UserRanking, MatchStage, Prediction } from '../types';

export class TeamModel implements Team {
  id: string;
  name: string;
  code: string;
  flagType: Team['flagType'];
  colors: string[];
  textColor: string;

  constructor(dto: TeamDTO) {
    this.id = dto.id;
    this.name = dto.name;
    this.code = dto.code;
    this.flagType = dto.flagType as Team['flagType'];
    this.colors = dto.colors;
    this.textColor = dto.textColor;
  }
}

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

export class UserModel {
  id: string;
  name: string;
  rank: number;
  totalPoints: number;

  constructor(dto: UserDTO) {
    this.id = dto.id;
    this.name = dto.name;
    this.rank = dto.rank;
    this.totalPoints = dto.totalPoints;
  }
}