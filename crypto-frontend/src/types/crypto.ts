// 暗号通貨関連の型定義
export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: any | null;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: number;
  user_id: number;
  coin_id: string;
  created_at: string;
}

export interface CoinListResponse {
  data: Coin[];
  message?: string;
}

export interface CoinDetailResponse {
  data: Coin;
  message?: string;
}

export interface BookmarkResponse {
  data: Bookmark;
  message?: string;
}