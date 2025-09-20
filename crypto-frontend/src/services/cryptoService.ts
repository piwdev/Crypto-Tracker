import api from './api';
import { CoinListResponse, CoinDetailResponse } from '../types/crypto';

export const cryptoService = {
  // 暗号通貨リスト取得（上位10位）
  getCoinList: async (): Promise<CoinListResponse> => {
    const response = await api.get('/coins/');
    return response.data;
  },

  // 特定の暗号通貨詳細取得
  getCoinDetail: async (coinId: string): Promise<CoinDetailResponse> => {
    const response = await api.get(`/coins/${coinId}/`);
    return response.data;
  },
};