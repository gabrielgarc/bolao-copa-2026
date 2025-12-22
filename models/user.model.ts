import { UserDTO } from '../dtos/user.dto';

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