
export interface Team {
  id: string;
  name: string;
  namePt?: string;
  code: string;
  flagType: 'v-tri' | 'h-tri' | 'v-bi' | 'h-bi' | 'solid' | 'cross' | 'circle' | 'usa' | 'bra';
  colors: string[]; // Hex codes or standard CSS colors
  textColor: string;
  crestUrl?: string;
}

export type MatchStage = 'GROUPS' | 'R32' | 'R16' | 'QF' | 'SF' | 'THIRD_PLACE' | 'FINAL';

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  group: string; 
  stadium: string;
  stage: MatchStage;
  realHomeScore?: number; // The "Official" result to compare against
  realAwayScore?: number;
  isLocked: boolean;
  placeholderLabel?: string; 
}

export interface Prediction {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export interface UserRanking {
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
}

export interface TeamStats {
  teamId: string;
  team: Team;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalDiff: number;
  goalsFor: number;
  goalsAgainst: number;
  isQualified?: boolean;
}

export interface StandingsResponse {
  groups: Record<string, TeamStats[]>;
  overallThirds: TeamStats[];
}

export enum AppView {
  MATCHES = 'MATCHES',
  LEADERBOARD = 'LEADERBOARD',
  MY_SCORE = 'MY_SCORE',
  OFFICIAL_RESULTS = 'OFFICIAL_RESULTS',
  SPREADSHEET = 'SPREADSHEET',
  RULES = 'RULES',
  EDIT_AVATAR = 'EDIT_AVATAR'
}