import apiClient from './apiClient';
import { UserModel } from '../models/user.model';

export const UserService = {
  async getCurrentPlayer(): Promise<UserModel | null> {
    const data = localStorage.getItem('bolao_user');
    if (data) {
      return new UserModel(JSON.parse(data));
    }
    return null;
  },

  async login(userName: string, password: string):Promise<UserModel> {
    const response = await apiClient.post<any>('/user/login', { userName, password });
    const user = new UserModel(response.data);
    localStorage.setItem('bolao_user', JSON.stringify(response.data));
    return user;
  },

  async create(userName: string, password: string):Promise<UserModel> {
    const response = await apiClient.post<any>('/user/create', { userName, password });
    const user = new UserModel(response.data);
    localStorage.setItem('bolao_user', JSON.stringify(response.data));
    return user;
  },

  logout() {
    localStorage.removeItem('bolao_user');
  }
};