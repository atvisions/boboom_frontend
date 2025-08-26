import { 
  TokenDetail, 
  PriceHistoryPoint, 
  TokenHolder, 
  Transaction,
  TokenDetailResponse,
  PriceHistoryResponse,
  HoldersResponse,
  TransactionsResponse
} from '@/types/tokenDetail';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

export class TokenDetailService {
  static async getTokenDetail(address: string, network: string = 'sepolia'): Promise<TokenDetail> {
    try {
      const url = `${API_BASE}/api/tokens/${address}/?network=${network}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token detail: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get token detail');
      }

      // Backend returns data directly, not wrapped in data field
      return data;
    } catch (error) {
      console.error('Error fetching token detail:', error);
      throw error;
    }
  }

  static async getPriceHistory(address: string, network: string = 'sepolia', interval: string = '1h'): Promise<PriceHistoryPoint[]> {
    try {
      const response = await fetch(`${API_BASE}/api/tokens/${address}/price-history?network=${network}&interval=${interval}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch price history: ${response.status}`);
      }

      const data: PriceHistoryResponse = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get price history');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching price history:', error);
      throw error;
    }
  }

  static async getTokenHolders(address: string, network: string = 'sepolia', limit: number = 50): Promise<TokenHolder[]> {
    try {
      const response = await fetch(`${API_BASE}/api/tokens/${address}/holders?network=${network}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token holders: ${response.status}`);
      }

      const data: HoldersResponse = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get token holders');
      }

      // 计算持仓百分比
      const totalBalance = data.data.reduce((sum, holder) => sum + parseFloat(holder.balance), 0);
      
      return data.data.map(holder => ({
        ...holder,
        percentage: totalBalance > 0 ? (parseFloat(holder.balance) / totalBalance) * 100 : 0
      }));
    } catch (error) {
      console.error('Error fetching token holders:', error);
      throw error;
    }
  }

  static async getTokenTransactions(address: string, network: string = 'sepolia', limit: number = 100): Promise<Transaction[]> {
    try {
      const response = await fetch(`${API_BASE}/api/transactions/?token=${address}&network=${network}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const data: TransactionsResponse = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get transactions');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // 格式化数字显示
  static formatNumber(value: string | number, decimals: number = 2): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    
    if (num >= 1e9) {
      return (num / 1e9).toFixed(decimals) + 'B';
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(decimals) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(decimals) + 'K';
    } else {
      return num.toFixed(decimals);
    }
  }

  // 格式化价格显示
  static formatPrice(price: string | number): string {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '$0.00';
    
    if (num < 0.01) {
      return `$${num.toFixed(6)}`;
    } else if (num < 1) {
      return `$${num.toFixed(4)}`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  }

  // 格式化地址显示
  static formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Format time display
  static formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US');
  }

  // Get phase display text
  static getPhaseText(phase: string): { text: string; color: string } {
    switch (phase) {
      case 'CREATED':
        return { text: 'Created', color: 'text-blue-400' };
      case 'CURVE':
        return { text: 'Trading', color: 'text-green-400' };
      case 'GRADUATING':
        return { text: 'Graduating', color: 'text-yellow-400' };
      case 'GRADUATED':
        return { text: 'Graduated', color: 'text-purple-400' };
      default:
        return { text: 'Unknown', color: 'text-gray-400' };
    }
  }

  // Get transaction type display text
  static getTransactionTypeText(type: string): { text: string; color: string } {
    switch (type) {
      case 'BUY':
        return { text: 'Buy', color: 'text-green-400' };
      case 'SELL':
        return { text: 'Sell', color: 'text-red-400' };
      case 'CREATE':
        return { text: 'Create', color: 'text-blue-400' };
      case 'GRADUATE':
        return { text: 'Graduate', color: 'text-purple-400' };
      default:
        return { text: type, color: 'text-gray-400' };
    }
  }
}
