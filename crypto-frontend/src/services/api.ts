import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { ApiError } from '../types/api';

// APIベースURL（環境変数から取得、デフォルトはlocalhost）
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// リトライ設定
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: any) => boolean;
}

// デフォルトのリトライ設定
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    // ネットワークエラーまたは5xxエラーの場合にリトライ
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  },
};

// ネットワーク状態の監視
class NetworkMonitor {
  private isOnline: boolean = navigator.onLine;
  private listeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  public addListener(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: (isOnline: boolean) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public getStatus(): boolean {
    return this.isOnline;
  }
}

const networkMonitor = new NetworkMonitor();

// リトライ機能付きのリクエスト実行
const executeWithRetry = async (
  requestFn: () => Promise<AxiosResponse>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<AxiosResponse> => {
  let lastError: any;

  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      // ネットワークがオフラインの場合は待機
      if (!networkMonitor.getStatus()) {
        throw new ApiError('Network is offline', 0, { offline: true });
      }

      const response = await requestFn();
      return response;
    } catch (error) {
      lastError = error;

      // 最後の試行の場合はエラーを投げる
      if (attempt === config.retries) {
        break;
      }

      // リトライ条件をチェック
      if (config.retryCondition && !config.retryCondition(error)) {
        break;
      }

      // 指数バックオフでリトライ間隔を計算
      const delay = config.retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Axiosインスタンスの作成
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // タイムアウトを15秒に延長
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（認証トークンの自動付与）
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    // リクエスト開始時刻を記録（タイムアウト監視用）
    (config as any).metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリング）
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // レスポンス時間を記録
    const config = response.config as any;
    if (config.metadata?.startTime) {
      const duration = new Date().getTime() - config.metadata.startTime.getTime();
      console.debug(`API Request completed in ${duration}ms: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return response;
  },
  (error) => {
    let message: string;
    let status: number;
    const details = error.response?.data;

    // エラーの種類に応じてメッセージを設定
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // タイムアウトエラー
      message = 'Request timeout. Please try again.';
      status = 408;
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      // ネットワークエラー
      message = 'Network error. Please check your connection.';
      status = 0;
    } else {
      // サーバーエラー
      message = error.response.data?.error || error.message || 'An error occurred';
      status = error.response.status || 500;
    }

    const apiError = new ApiError(message, status, {
      ...details,
      originalError: error,
      isNetworkError: !error.response,
      isTimeoutError: error.code === 'ECONNABORTED',
    });

    // 401エラーの場合、認証トークンを削除してログインページにリダイレクト
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // ログインページにリダイレクトする前に、現在のページがログインページでないことを確認
      if (window.location.pathname !== '/login' && window.location.pathname !== '/createaccount') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(apiError);
  }
);

// 拡張されたAPIクライアント
const enhancedApi = {
  // 標準のAPIメソッド
  get: (url: string, config?: AxiosRequestConfig) => api.get(url, config),
  post: (url: string, data?: any, config?: AxiosRequestConfig) => api.post(url, data, config),
  put: (url: string, data?: any, config?: AxiosRequestConfig) => api.put(url, data, config),
  patch: (url: string, data?: any, config?: AxiosRequestConfig) => api.patch(url, data, config),
  delete: (url: string, config?: AxiosRequestConfig) => api.delete(url, config),

  // リトライ機能付きのメソッド
  getWithRetry: (url: string, config?: AxiosRequestConfig, retryConfig?: Partial<RetryConfig>) => {
    return executeWithRetry(
      () => api.get(url, config),
      { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    );
  },

  postWithRetry: (url: string, data?: any, config?: AxiosRequestConfig, retryConfig?: Partial<RetryConfig>) => {
    return executeWithRetry(
      () => api.post(url, data, config),
      { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    );
  },

  putWithRetry: (url: string, data?: any, config?: AxiosRequestConfig, retryConfig?: Partial<RetryConfig>) => {
    return executeWithRetry(
      () => api.put(url, data, config),
      { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    );
  },

  patchWithRetry: (url: string, data?: any, config?: AxiosRequestConfig, retryConfig?: Partial<RetryConfig>) => {
    return executeWithRetry(
      () => api.patch(url, data, config),
      { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    );
  },

  deleteWithRetry: (url: string, config?: AxiosRequestConfig, retryConfig?: Partial<RetryConfig>) => {
    return executeWithRetry(
      () => api.delete(url, config),
      { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    );
  },

  // ネットワーク状態の監視
  onNetworkChange: (callback: (isOnline: boolean) => void) => {
    networkMonitor.addListener(callback);
    return () => networkMonitor.removeListener(callback);
  },

  // ネットワーク状態の取得
  isOnline: () => networkMonitor.getStatus(),

  // ヘルスチェック
  healthCheck: async (): Promise<boolean> => {
    try {
      await api.get('/health/', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  },
};

export default enhancedApi;
export { networkMonitor };