export interface TeamDTO {
  id: string;
  name: string;
  code: string;
  flagType: string;
  colors: string[];
  textColor: string;
}

export interface MatchDTO {
  id: string;
  homeTeam: TeamDTO;
  awayTeam: TeamDTO;
  date: string;
  time: string;
  group: string;
  stadium: string;
  stage: string;
  realHomeScore?: number;
  realAwayScore?: number;
  isLocked: boolean;
  placeholderLabel?: string;
}

export interface PredictionDTO {
  matchId: string;
  homeScore: string;
  awayScore: string;
}

export interface RankingDTO {
  id: string;
  name: string;
  points: number;
  avatar: string;
}

export interface UserDTO {
  id: string;
  name: string;
  rank: number;
  totalPoints: number;
}