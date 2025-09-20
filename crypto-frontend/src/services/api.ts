import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiError } from '../types/api';

// APIベースURL（環境変数から取得、デフォルトはlocalhost）
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Axiosインスタンスの作成
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（認証トークンの自動付与）
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリング）
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    const status = error.response?.status || 500;
    const details = error.response?.data;

    const apiError = new ApiError(message, status, details);

    // 401エラーの場合、認証トークンを削除してログインページにリダイレクト
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // ログインページにリダイレクトする前に、現在のページがログインページでないことを確認
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(apiError);
  }
);

export default api;