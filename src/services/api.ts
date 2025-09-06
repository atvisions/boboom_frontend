// API基础配置
import { API_CONFIG } from '@/config/api';

// 始终使用完整的后端URL
const API_BASE_URL = `${API_CONFIG.BASE_URL}/api`;

// 简单的内存缓存
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// 正在进行的请求缓存，用于防止重复请求
const pendingRequests = new Map<string, Promise<any>>();

// 缓存管理
function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCachedData(key: string, data: any, ttl: number = 60000): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

// 清除缓存
function clearCache(keyPattern?: string): void {
  if (keyPattern) {
    // 清除匹配模式的缓存
    for (const key of cache.keys()) {
      if (key.includes(keyPattern)) {
        cache.delete(key);
      }
    }
  } else {
    // 清除所有缓存
    cache.clear();
  }
}

// 清除过期缓存
function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, cached] of cache.entries()) {
    if (now - cached.timestamp > cached.ttl) {
      cache.delete(key);
    }
  }
}

// 生成缓存键
function generateCacheKey(prefix: string, ...params: any[]): string {
  return `${prefix}_${params.join('_')}`;
}

// 通用API请求函数（带缓存和重试）
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  cacheKey?: string,
  cacheTTL: number = 60000
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 尝试从缓存获取数据
  if (cacheKey) {
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // 检查是否有正在进行的相同请求
    const pendingRequest = pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }
  }
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // 创建请求 Promise 并添加到 pendingRequests
  const requestPromise = (async () => {
    // 重试机制
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 缓存成功的数据
        if (cacheKey) {
          setCachedData(cacheKey, data, cacheTTL);
        }
        
        return data;
      } catch (error) {
        lastError = error as Error;
        
        // 如果是超时错误且还有重试机会，则重试
        if (error instanceof Error && error.name === 'AbortError' && attempt < maxRetries) {
          console.warn(`API request timeout, retrying... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // 递增延迟
          continue;
        }
        
        // 网络错误（Failed to fetch）且还有重试机会，则重试
        if (((error instanceof TypeError && error.message.includes('fetch')) || 
            (error instanceof Error && error.message.includes('network')) ||
            (error instanceof Error && error.message.includes('Network')) ||
            (error instanceof Error && error.message.includes('timeout')) ||
            (error instanceof Error && error.message.includes('Timeout'))) && 
            attempt < maxRetries) {
          console.warn(`Network error: ${error.message}, retrying... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1))); // 递增延迟
          continue;
        }
        
        // 其他错误或重试次数用完
        break;
      }
    }
    
    console.error('API request failed:', {
      url,
      method: config.method || 'GET',
      error: lastError?.message || 'Unknown error',
      stack: lastError?.stack,
      timestamp: new Date().toISOString()
    });
    throw lastError;
  })();

  // 将请求添加到 pendingRequests
  if (cacheKey) {
    pendingRequests.set(cacheKey, requestPromise);
  }

  try {
    const result = await requestPromise;
    return result;
  } finally {
    // 请求完成后清理 pendingRequests
    if (cacheKey) {
      pendingRequests.delete(cacheKey);
    }
  }
}

// 用户认证相关接口
export const authAPI = {
  // 获取登录nonce
  getNonce: (address: string) => 
    apiRequest<{ nonce: string }>(`/users/get-nonce/${address}/`, {}, generateCacheKey('nonce', address), 300000),

  // 用户登录（签名验证）
  login: (data: {
    address: string;
    signature: string;
    nonce: string;
  }) => apiRequest<{
    refresh: string;
    access: string;
  }>('/users/login/', {
    method: 'POST',
    body: JSON.stringify(data),
  }, generateCacheKey('login', data.address), 300000),

  // 自动登录/注册（开发调试用）
  autoLogin: (address: string) => 
    apiRequest<{
      user: any;
      created: boolean;
      message: string;
    }>('/users/auto-login/', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }, generateCacheKey('auto_login', address), 300000),
};

// 用户资料相关接口
export const userAPI = {
  // 获取用户详情
  getUser: (address: string) => 
    apiRequest<any>(`/users/${address}/`, {}, generateCacheKey('user', address), 300000),

  // 更新用户资料
  updateUser: (address: string, data: {
    username?: string;
    bio?: string;
    avatar_url?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
  }) => apiRequest<any>(`/users/${address}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, generateCacheKey('update_user', address), 300000),

  // 获取用户统计信息
  getUserStats: (address: string) => 
    apiRequest<{
      address: string;
      username: string;
      tokens_created: number;
      total_volume_traded: string;
      reputation_score: number;
      is_verified: boolean;
      created_at: string;
    }>(`/users/${address}/stats/`, {}, generateCacheKey('user_stats', address), 300000),

  // 获取用户资产组合
  getUserPortfolio: (address: string) => 
    apiRequest<{
      address: string;
      eth: string;
      okb: string;
      network: string;
    }>(`/users/${address}/portfolio/`, {}, generateCacheKey('user_portfolio', address), 300000),

  // 获取用户代币
  getUserTokens: (address: string, network: string = 'sepolia') =>
    apiRequest<{
      created: Array<any>;
      holding: Array<any>;
      network: string;
    }>(`/users/${address}/tokens/?network=${network}`, {}, generateCacheKey('user_tokens', address, network), 30000), // 减少缓存时间到30秒

  // 获取创作者排行榜
  getCreatorsRanking: (params: {
    sort_by?: string;
    limit?: number;
    network?: string;
  } = {}) => {
    const { sort_by = 'tokens_created', limit = 50, network = 'sepolia' } = params;
    return apiRequest<{
      success: boolean;
      data: {
        users: Array<any>;
        count: number;
        sort_by: string;
        network: string;
      };
    }>(`/users/?sort_by=${sort_by}&limit=${limit}&network=${network}`, {}, generateCacheKey('creators_ranking', sort_by, limit, network), 300000);
  },
};

// 收藏功能相关接口
export const favoriteAPI = {
  // 切换收藏状态
  toggleFavorite: (userAddress: string, data: {
    token_address: string;
    network?: string;
  }) => {
    // 清除相关缓存
    clearCache(`check_favorite_status_${userAddress}_${data.token_address}`);
    clearCache(`user_favorites_${userAddress}`);
    
    return apiRequest<{
      success: boolean;
      data: {
        is_favorited: boolean;
        favorite_count: number;
        token_address: string;
        user_address: string;
      };
    }>(`/users/${userAddress}/favorites/toggle/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 获取用户收藏列表
  getUserFavorites: (userAddress: string, network: string = 'sepolia', limit?: number) => 
    apiRequest<{
      success: boolean;
      data: {
        favorites: Array<any>;
        count: number;
        user_address: string;
        network: string;
      };
    }>(`/users/${userAddress}/favorites/?network=${network}${limit ? `&limit=${limit}` : ''}`, {}, generateCacheKey('user_favorites', userAddress, network, limit || ''), 300000),

  // 检查收藏状态
  checkFavoriteStatus: (userAddress: string, tokenAddress: string, network: string = 'sepolia') => 
    apiRequest<{
      success: boolean;
      data: {
        is_favorited: boolean;
        favorite_count: number;
        token_address: string;
        user_address: string;
        network: string;
      };
    }>(`/users/${userAddress}/favorites/${tokenAddress}/?network=${network}`, {}, generateCacheKey('check_favorite_status', userAddress, tokenAddress, network), 30000),
};

// 关注功能相关接口
export const followAPI = {
  // 关注用户
  followUser: (followerAddress: string, data: {
    following_address: string;
    network?: string;
  }) => apiRequest<{
    success: boolean;
    data: {
      is_following: boolean;
      follower_count: number;
      following_address: string;
      follower_address: string;
    };
  }>(`/users/${followerAddress}/follow/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, generateCacheKey('follow_user', followerAddress, data.following_address), 300000),

  // 获取用户关注的用户列表
  getFollowing: (userAddress: string, network: string = 'sepolia', limit?: number) => 
    apiRequest<{
      success: boolean;
      data: {
        following: Array<any>;
        count: number;
        user_address: string;
        network: string;
      };
    }>(`/users/${userAddress}/following/?network=${network}${limit ? `&limit=${limit}` : ''}`, {}, generateCacheKey('user_following', userAddress, network, limit || ''), 300000),

  // 获取用户的粉丝列表
  getFollowers: (userAddress: string, network: string = 'sepolia', limit?: number) => 
    apiRequest<{
      success: boolean;
      data: {
        followers: Array<any>;
        count: number;
        user_address: string;
        network: string;
      };
    }>(`/users/${userAddress}/followers/?network=${network}${limit ? `&limit=${limit}` : ''}`, {}, generateCacheKey('user_followers', userAddress, network, limit || ''), 300000),

  // 检查关注状态
  checkFollowStatus: (followerAddress: string, followingAddress: string, network: string = 'sepolia') => 
    apiRequest<{
      success: boolean;
      data: {
        is_following: boolean;
        follower_count: number;
        following_address: string;
        follower_address: string;
        network: string;
      };
    }>(`/users/${followerAddress}/follow/${followingAddress}/check/?network=${network}`, {}, generateCacheKey('check_follow_status', followerAddress, followingAddress, network), 300000),

  // 获取推荐关注用户
  getSuggestedUsers: (userAddress: string, network: string = 'sepolia', limit: number = 10) => 
    apiRequest<{
      success: boolean;
      data: {
        suggested_users: Array<any>;
        count: number;
        network: string;
      };
    }>(`/users/${userAddress}/suggested/?network=${network}&limit=${limit}`, {}, generateCacheKey('suggested_users', userAddress, network, limit), 300000),
};

// 头像相关接口
export const avatarAPI = {
  // 获取默认头像列表
  getDefaultAvatars: () => 
    apiRequest<{
      success: boolean;
      data: {
        avatars: Array<{
          id: string;
          url: string;
          name: string;
        }>;
        count: number;
      };
    }>('/users/avatars/default/', {}, 'default_avatars', 300000),

  // 随机获取默认头像
  getRandomAvatar: () => 
    apiRequest<{
      success: boolean;
      data: {
        avatar: {
          id: string;
          url: string;
          name: string;
        };
      };
    }>('/users/avatars/random/', {}, 'random_avatar', 300000),
};

// 代币相关接口
export const tokenAPI = {
  // 获取代币列表
  getTokens: (params: {
    category?: 'newly_created' | 'last_traded' | 'top_gainers';
    phase?: 'CREATED' | 'CURVE' | 'GRADUATING' | 'GRADUATED';
    featured?: boolean;
    trending?: boolean;
    graduating_soon?: boolean;
    search?: string;
    show_inactive?: boolean;
    page?: number;
    limit?: number;
    network?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    return apiRequest<{
      success: boolean;
      data: {
        tokens: Array<any>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(`/tokens/?${searchParams.toString()}`, {}, generateCacheKey('tokens', encodeURIComponent(searchParams.toString())), 5000);
  },

  // 获取最新代币列表 - 专用于Newest TAB
  getNewestTokens: (params: {
    page?: number;
    limit?: number;
    network?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    return apiRequest<{
      success: boolean;
      data: {
        tokens: Array<any>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(`/tokens/newest/?${searchParams.toString()}`, {}, generateCacheKey('newest_tokens', encodeURIComponent(searchParams.toString())), 5000);
  },

  // 获取即将毕业代币列表 - 专用于Near Graduation TAB
  getNearGraduationTokens: (params: {
    page?: number;
    limit?: number;
    network?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    return apiRequest<{
      success: boolean;
      data: {
        tokens: Array<any>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(`/tokens/near-graduation/?${searchParams.toString()}`, {}, generateCacheKey('near_graduation_tokens', encodeURIComponent(searchParams.toString())), 5000);
  },

  // 获取按市值排序的代币列表 - 专用于Top MC TAB
  getTopMCTokens: (params: {
    page?: number;
    limit?: number;
    network?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    return apiRequest<{
      success: boolean;
      data: {
        tokens: Array<any>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(`/tokens/top-mc/?${searchParams.toString()}`, {}, generateCacheKey('top_mc_tokens', encodeURIComponent(searchParams.toString())), 5000);
  },

  // 获取代币详情
  getTokenDetail: (address: string, network: string = 'sepolia') => 
    apiRequest<{
      success: boolean;
      data: any;
    }>(`/tokens/${address}/?network=${network}`, {}, generateCacheKey('token_detail', address, network), 0),

  // 获取代币详情（新接口）
  getTokenDetails: (address: string, network: string = 'sepolia') =>
    apiRequest<{
      success: boolean;
      data: any;
    }>(`/tokens/${address}/?network=${network}&_t=${Date.now()}`, {}, `token_details_${address}_${network}_${Date.now()}`, 0),

  // 获取代币24小时统计数据
  getToken24hStats: (address: string, network: string = 'sepolia') => 
    apiRequest<{
      success: boolean;
      data: {
        currentPrice: string;
        high24h: string;
        low24h: string;
        priceChange24h: string;
        volume24h: string;
        updatedAt: string;
      };
    }>(`/tokens/${address}/24h-stats/?network=${network}`, {}, generateCacheKey('token_24h_stats', address, network), 60000), // 1分钟缓存

  // 获取代币交易记录
  getTokenTransactions: (address: string, network: string = 'sepolia', page: number = 1, pageSize: number = 10) =>
    apiRequest<{
      success: boolean;
      data: Array<any>;
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    }>(`/tokens/${address}/transactions?network=${network}&page=${page}&page_size=${pageSize}`, {}, generateCacheKey('token_transactions', address, network, page, pageSize), 30000), // 30秒缓存

  // 获取代币持有人
  getTokenHolders: (address: string, network: string = 'sepolia', page: number = 1, pageSize: number = 10) =>
    apiRequest<{
      success: boolean;
      data: Array<any>;
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    }>(`/tokens/${address}/holders?network=${network}&page=${page}&page_size=${pageSize}`, {}, generateCacheKey('token_holders', address, network, page, pageSize), 300000),

  // 获取代币图表数据
  getTokenChartData: (address: string, timeframe: string, network: string = 'sepolia') =>
    apiRequest<{
      success: boolean;
      data: {
        labels: string[];
        datasets: Array<{
          label: string;
          data: number[];
          borderColor: string;
          backgroundColor: string;
        }>;
      };
    }>(`/tokens/${address}/chart/?timeframe=${timeframe}&network=${network}`, {}, generateCacheKey('token_chart_data', address, timeframe, network), 300000),

  // 获取OKB价格
  getOKBPrice: () => 
    apiRequest<{
      success: boolean;
      data: {
        price: string;
        currency: string;
        timestamp: string;
        cached: boolean;
      };
    }>('/tokens/okb-price/', {}, 'okb_price', 300000),

  // 获取代币价格历史
  getTokenPriceHistory: (
    address: string,
    params: {
      interval?: '1m' | '5m' | '1h' | '1d';
      limit?: number;
      start_time?: string;
      end_time?: string;
      network?: string;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    return apiRequest<{
      success: boolean;
      data: {
        candles: Array<any>;
        token: {
          address: string;
          name: string;
          symbol: string;
        };
        interval: string;
        count: number;
      };
    }>(`/tokens/${address}/price-history?${searchParams.toString()}`, {}, generateCacheKey('token_price_history', address, encodeURIComponent(searchParams.toString())), 300000);
  },
};

// 导出所有API
// 导出缓存管理函数
export const cacheAPI = {
  clear: clearCache,
  clearExpired: clearExpiredCache,
  clearTokens: () => clearCache('tokens'),
};

export const api = {
  auth: authAPI,
  user: userAPI,
  favorite: favoriteAPI,
  follow: followAPI,
  avatar: avatarAPI,
  token: tokenAPI,
  cache: cacheAPI,
};

export default api;

// 导出清除缓存函数
export const clearApiCache = clearCache;
