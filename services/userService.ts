import apiClient from './apiClient';
import { UserModel } from '../models/user.model';

export const UserService = {
  async getCurrentPlayer(): Promise<UserModel> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(new UserModel({
          id: 'u-current',
          name: 'Ronaldinho8Bit',
          rank: 0,
          totalPoints: 0
        }));
      }, 300);
    });
  }
};