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
    const apiError: ApiError = {
      message: error.response?.data?.error || error.message || 'An error occurred',
      status: error.response?.status || 500,
      details: error.response?.data,
    };

    // 401エラーの場合、認証トークンを削除してログインページにリダイレクト
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    return Promise.reject(apiError);
  }
);

export default api;