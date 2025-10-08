// Trade related type definitions

export interface WalletItem {
  coin_id: string;
  coin_name: string;
  coin_symbol: string;
  coin_image: string;
  quantity: string;
  current_price: string;
  current_value: string;
  last_updated_at: string;
}

export interface Portfolio {
  bank_balance: string;
  wallets: WalletItem[];
  total_portfolio_value: string;
  total_assets: string;
}

export interface TradeHistoryItem {
  id: number;
  coin_id: string;
  coin_name: string;
  coin_symbol: string;
  trade_type: 'BUY' | 'SELL';
  trade_quantity: string;
  trade_price_per_coin: string;
  balance_before_trade: string;
  balance_after_trade: string;
  created_at: string;
}

export interface TradeHistoryResponse {
  data: TradeHistoryItem[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TradeRequest {
  coin_id: string;
  quantity: string;
}

export interface TradeResponse {
  message: string;
  trade: {
    coin_id: string;
    coin_name: string;
    quantity: string;
    price_per_coin: string;
    total_cost?: string;
    total_proceeds?: string;
    new_balance: string;
  };
}
