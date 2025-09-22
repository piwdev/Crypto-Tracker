import api from './api';
import { CoinListResponse, CoinDetailResponse } from '../types/crypto';
import { ApiError } from '../types/api';

export const cryptoService = {
  // 仮想通貨リスト取得（上位10位）
  // 要件 1.1: market_cap_rank 1-10の仮想通貨を表示
  getCoinList: async (): Promise<CoinListResponse> => {
    try {
      const response = await api.getWithRetry('/coins/', undefined, {
        retries: 3,
        retryCondition: (error) => !error.response || error.response.status >= 500
      });
      
      // レスポンスデータの検証
      if (!response.data || !response.data.data) {
        throw new ApiError('Invalid response format from server', 500);
      }

      // データが配列であることを確認
      if (!Array.isArray(response.data.data)) {
        throw new ApiError('Expected array of coins but received different format', 500);
      }

      return response.data;
    } catch (error: unknown) {
      // ApiErrorの場合はそのまま再スロー
      if (error instanceof ApiError) {
        throw error;
      }

      // ネットワークエラーやその他のエラーの場合
      if (error && typeof error === 'object' && 'code' in error && error.code === 'NETWORK_ERROR') {
        throw new ApiError('ネットワークエラーが発生しました。インターネット接続を確認してください。', 0);
      }

      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('Network Error')) {
        throw new ApiError('ネットワークエラーが発生しました。インターネット接続を確認してください。', 0);
      }

      // タイムアウトエラー
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNABORTED') {
        throw new ApiError('リクエストがタイムアウトしました。しばらく時間をおいて再試行してください。', 408);
      }

      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('timeout')) {
        throw new ApiError('リクエストがタイムアウトしました。しばらく時間をおいて再試行してください。', 408);
      }

      // その他の予期しないエラー
      throw new ApiError('仮想通貨データの取得中にエラーが発生しました。', 500, error);
    }
  },

  // 特定の仮想通貨詳細取得
  // 要件 5.1: 指定されたcoin_idのcoinsテーブルのすべての列を表示
  getCoinDetail: async (coinId: string): Promise<CoinDetailResponse> => {
    try {
      // coinIdの検証
      if (!coinId || typeof coinId !== 'string' || coinId.trim() === '') {
        throw new ApiError('有効なコインIDを指定してください。', 400);
      }

      const response = await api.getWithRetry(`/coins/${encodeURIComponent(coinId.trim())}/`, undefined, {
        retries: 3,
        retryCondition: (error) => !error.response || error.response.status >= 500
      });
      
      // レスポンスデータの検証
      if (!response.data || !response.data.data) {
        throw new ApiError('Invalid response format from server', 500);
      }

      // コインデータの基本的な検証
      const coinData = response.data.data;
      if (!coinData.id || !coinData.name || !coinData.symbol) {
        throw new ApiError('Incomplete coin data received from server', 500);
      }

      return response.data;
    } catch (error: unknown) {
      // ApiErrorの場合はそのまま再スロー
      if (error instanceof ApiError) {
        throw error;
      }

      // 404エラー（コインが見つからない）の特別処理
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 404) {
        throw new ApiError('指定された仮想通貨が見つかりません。', 404);
      }

      // ネットワークエラー
      if (error && typeof error === 'object' && 'code' in error && error.code === 'NETWORK_ERROR') {
        throw new ApiError('ネットワークエラーが発生しました。インターネット接続を確認してください。', 0);
      }

      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('Network Error')) {
        throw new ApiError('ネットワークエラーが発生しました。インターネット接続を確認してください。', 0);
      }

      // タイムアウトエラー
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNABORTED') {
        throw new ApiError('リクエストがタイムアウトしました。しばらく時間をおいて再試行してください。', 408);
      }

      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('timeout')) {
        throw new ApiError('リクエストがタイムアウトしました。しばらく時間をおいて再試行してください。', 408);
      }

      // その他の予期しないエラー
      throw new ApiError('仮想通貨の詳細データ取得中にエラーが発生しました。', 500, error);
    }
  },

  // 接続テスト用のヘルスチェック機能
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await api.get('/health/', { timeout: 5000 });
      return response.status === 200;
    } catch (error: unknown) {
      return false;
    }
  },
};