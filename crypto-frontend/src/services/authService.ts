import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export const authService = {
  // ログイン
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  // ユーザー登録
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  // ログアウト
  logout: async (): Promise<void> => {
    await api.post('/auth/logout/');
    localStorage.removeItem('authToken');
  },

  // 現在のユーザー情報取得
  getCurrentUser: async () => {
    const response = await api.get('/auth/user/');
    return response.data;
  },
};