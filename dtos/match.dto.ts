
import { TeamDTO } from './team.dto';

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