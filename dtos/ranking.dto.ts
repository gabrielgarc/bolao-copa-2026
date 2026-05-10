
export interface RankingDTO {
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