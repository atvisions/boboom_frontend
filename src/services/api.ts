// API基础配置
import { API_CONFIG } from '@/config/api';

const API_BASE_URL = `${API_CONFIG.BASE_URL}/api`;

// 通用API请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// 用户认证相关接口
export const authAPI = {
  // 获取登录nonce
  getNonce: (address: string) => 
    apiRequest<{ nonce: string }>(`/users/get-nonce/${address}/`),

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
  }),

  // 自动登录/注册（开发调试用）
  autoLogin: (address: string) => 
    apiRequest<{
      user: any;
      created: boolean;
      message: string;
    }>('/users/auto-login/', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),

  // 创建新用户（需要签名验证）
  createUser: (data: {
    address: string;
    signature: string;
    message: string;
    timestamp: number;
  }) => apiRequest<any>('/users/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// 用户资料相关接口
export const userAPI = {
  // 获取用户详情
  getUser: (address: string) => 
    apiRequest<any>(`/users/${address}/`),

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
  }),

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
    }>(`/users/${address}/stats/`),

  // 获取用户资产组合
  getUserPortfolio: (address: string) => 
    apiRequest<{
      address: string;
      eth: string;
      okb: string;
      network: string;
    }>(`/users/${address}/portfolio/`),

  // 获取用户代币
  getUserTokens: (address: string, network: string = 'sepolia') => 
    apiRequest<{
      created: Array<{
        address: string;
        symbol: string;
        name: string;
        createdAt: string;
        phase: string;
      }>;
      holding: string[];
      network: string;
    }>(`/users/${address}/tokens/?network=${network}`),
};

// 收藏功能相关接口
export const favoriteAPI = {
  // 切换收藏状态
  toggleFavorite: (userAddress: string, data: {
    token_address: string;
    network?: string;
  }) => apiRequest<{
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
  }),

  // 获取用户收藏列表
  getUserFavorites: (userAddress: string, network: string = 'sepolia', limit?: number) => 
    apiRequest<{
      success: boolean;
      data: {
        favorites: Array<{
          favorite_id: number;
          token_address: string;
          favorited_at: string;
          token: {
            address: string;
            name: string;
            symbol: string;
            description: string;
            imageUrl: string;
            currentPrice: string;
            marketCap: string;
            phase: string;
            graduationProgress: number;
            holderCount: number;
            transactionCount: number;
            isVerified: boolean;
            isFeatured: boolean;
            createdAt: string;
          };
        }>;
        count: number;
        user_address: string;
        network: string;
      };
    }>(`/users/${userAddress}/favorites/?network=${network}${limit ? `&limit=${limit}` : ''}`),

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
    }>(`/users/${userAddress}/favorites/${tokenAddress}/?network=${network}`),

  // 获取代币收藏统计
  getTokenFavorites: (tokenAddress: string, network: string = 'sepolia') => 
    apiRequest<{
      success: boolean;
      data: {
        token_address: string;
        favorite_count: number;
        recent_favorites: string[];
        network: string;
      };
    }>(`/users/tokens/${tokenAddress}/favorites/?network=${network}`),
};

// 关注功能相关接口（需要新增）
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
  }),

  // 取消关注用户
  unfollowUser: (followerAddress: string, followingAddress: string, network: string = 'sepolia') => 
    apiRequest<{
      success: boolean;
      data: {
        is_following: boolean;
        follower_count: number;
        following_address: string;
        follower_address: string;
      };
    }>(`/users/${followerAddress}/follow/${followingAddress}/?network=${network}`, {
      method: 'DELETE',
    }),

  // 获取用户关注列表
  getFollowing: (userAddress: string, network: string = 'sepolia', limit?: number) => 
    apiRequest<{
      success: boolean;
      data: {
        following: Array<{
          following_id: number;
          following_address: string;
          followed_at: string;
          user: {
            address: string;
            username: string;
            bio: string;
            avatar_url: string;
            is_verified: boolean;
            tokens_created: number;
          };
        }>;
        count: number;
        user_address: string;
        network: string;
      };
    }>(`/users/${userAddress}/following/?network=${network}${limit ? `&limit=${limit}` : ''}`),

  // 获取用户粉丝列表
  getFollowers: (userAddress: string, network: string = 'sepolia', limit?: number) => 
    apiRequest<{
      success: boolean;
      data: {
        followers: Array<{
          follower_id: number;
          follower_address: string;
          followed_at: string;
          user: {
            address: string;
            username: string;
            bio: string;
            avatar_url: string;
            is_verified: boolean;
            tokens_created: number;
          };
        }>;
        count: number;
        user_address: string;
        network: string;
      };
    }>(`/users/${userAddress}/followers/?network=${network}${limit ? `&limit=${limit}` : ''}`),

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
    }>(`/users/${followerAddress}/follow/${followingAddress}/?network=${network}`),

  // 获取推荐关注用户
  getSuggestedUsers: (userAddress: string, network: string = 'sepolia', limit: number = 10) => 
    apiRequest<{
      success: boolean;
      data: {
        suggested_users: Array<{
          address: string;
          username: string;
          bio: string;
          avatar_url: string;
          is_verified: boolean;
          tokens_created: number;
          follower_count: number;
          is_following: boolean;
        }>;
        count: number;
        network: string;
      };
    }>(`/users/${userAddress}/suggested/?network=${network}&limit=${limit}`),
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
    }>('/users/avatars/default/'),

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
    }>('/users/avatars/random/'),
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
        tokens: Array<{
          address: string;
          name: string;
          symbol: string;
          description: string;
          imageUrl: string;
          phase: string;
          okbCollected: string;
          tokensTraded: string;
          graduationProgress: number;
          currentPrice: string;
          marketCap: string;
          volume24h: string;
          priceChange24h: number;
          curveTradingActive: boolean;
          graduatedAt: string | null;
          izumiPoolAddress: string | null;
          holderCount: number;
          transactionCount: number;
          isVerified: boolean;
          isFeatured: boolean;
          createdAt: string;
          updatedAt: string;
          network: string;
          isActive: boolean;
        }>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(`/tokens/?${searchParams.toString()}`);
  },

  // 获取代币详情
  getTokenDetail: (address: string, network: string = 'sepolia') => 
    apiRequest<{
      success: boolean;
      data: any;
    }>(`/tokens/${address}/?network=${network}`),

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
        candles: Array<{
          timestamp: string;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
          trade_count: number;
          total_okb_volume: number;
          total_token_volume: number;
        }>;
        token: {
          address: string;
          name: string;
          symbol: string;
        };
        interval: string;
        count: number;
      };
    }>(`/tokens/${address}/price-history?${searchParams.toString()}`);
  },
};

// 导出所有API
export const api = {
  auth: authAPI,
  user: userAPI,
  favorite: favoriteAPI,
  follow: followAPI,
  avatar: avatarAPI,
  token: tokenAPI,
};

export default api;
