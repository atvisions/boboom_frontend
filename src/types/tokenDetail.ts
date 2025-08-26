export interface TokenDetail {
  success: boolean;
  address: string;
  name: string;
  symbol: string;
  description: string;
  image_url: string;
  creator: {
    address: string;
    username: string;
    display_name: string;
    is_verified: boolean;
  };
  website: string;
  twitter: string;
  telegram: string;
  total_supply: string;
  phase: 'CREATED' | 'CURVE' | 'GRADUATING' | 'GRADUATED';
  okb_collected: string;
  tokens_traded: string;
  graduation_progress: number;
  current_price: string;
  market_cap: string;
  volume_24h: string;
  price_change_24h: string;
  curve_trading_enabled: boolean;
  graduated_at: string | null;
  izumi_pool_address: string;
  holder_count: number;
  transaction_count: number;
  is_verified: boolean;
  is_featured: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
  network: string;
  is_active: boolean;
}

export interface PriceHistoryPoint {
  timestamp: string;
  price: string;
  marketCap: string;
}

export interface TokenHolder {
  address: string;
  balance: string;
  percentage?: number;
}

export interface Transaction {
  hash: string;
  type: 'BUY' | 'SELL' | 'CREATE' | 'GRADUATE';
  token: string;
  user: string;
  okb: string;
  tokens: string;
  fee: string;
  price: string;
  blockNumber: number;
  timestamp: string;
  network: string;
}

export interface TokenDetailResponse {
  success: boolean;
  data?: TokenDetail;
  error?: string;
}

export interface PriceHistoryResponse {
  success: boolean;
  data?: PriceHistoryPoint[];
  error?: string;
}

export interface HoldersResponse {
  success: boolean;
  data?: TokenHolder[];
  error?: string;
}

export interface TransactionsResponse {
  success: boolean;
  data?: Transaction[];
  error?: string;
}
