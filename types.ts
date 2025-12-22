
export interface Team {
  id: string;
  name: string;
  code: string;
  flagType: 'v-tri' | 'h-tri' | 'v-bi' | 'h-bi' | 'solid' | 'cross' | 'circle' | 'usa' | 'bra';
  colors: string[]; // Hex codes or standard CSS colors
  textColor: string;
}

export type MatchStage = 'GROUPS' | 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL';

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
}

export enum AppView {
  MATCHES = 'MATCHES',
  LEADERBOARD = 'LEADERBOARD',
  USER_SCORE = 'USER_SCORE',
  OFFICIAL_RESULTS = 'OFFICIAL_RESULTS',
  SPREADSHEET = 'SPREADSHEET'
}
