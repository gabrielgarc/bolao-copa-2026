
import { TeamDTO } from '../dtos/team.dto';
import { Team } from '../types';

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