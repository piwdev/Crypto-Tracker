import api from './api';
import { Portfolio, TradeHistoryResponse, TradeRequest, TradeResponse } from '../types/trade';

export const tradeService = {
  /**
   * Get user's portfolio (bank balance and wallet holdings)
   */
  getPortfolio: async (): Promise<Portfolio> => {
    const response = await api.get('/user/portfolio/');
    return response.data;
  },

  /**
   * Get user's trade history with pagination
   */
  getTradeHistory: async (page: number = 1, pageSize: number = 20): Promise<TradeHistoryResponse> => {
    const response = await api.get('/user/trade-history/', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  /**
   * Execute a buy trade
   */
  buyTrade: async (request: TradeRequest): Promise<TradeResponse> => {
    const response = await api.post('/trades/buy/', request);
    return response.data;
  },

  /**
   * Execute a sell trade
   */
  sellTrade: async (request: TradeRequest): Promise<TradeResponse> => {
    const response = await api.post('/trades/sell/', request);
    return response.data;
  },
};
