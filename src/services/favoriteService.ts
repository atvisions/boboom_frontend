/**
 * 收藏服务 - 处理用户收藏相关的API调用
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface FavoriteToggleRequest {
  token_address: string;
  network?: string;
}

export interface FavoriteToggleResponse {
  success: boolean;
  data?: {
    is_favorited: boolean;
    favorite_count: number;
    token_address: string;
    user_address: string;
  };
  error?: string;
}

export interface FavoriteStatusResponse {
  success: boolean;
  data?: {
    is_favorited: boolean;
    favorite_count: number;
    token_address: string;
    user_address: string;
    network: string;
  };
  error?: string;
}

export interface UserFavoritesResponse {
  success: boolean;
  data?: {
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
  error?: string;
}

/**
 * 切换收藏状态
 */
export async function toggleFavorite(
  userAddress: string,
  tokenAddress: string,
  network: string = 'sepolia'
): Promise<FavoriteToggleResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/users/${userAddress}/favorites/toggle/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_address: tokenAddress,
          network: network,
        }),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return {
      success: false,
      error: 'Network error occurred while toggling favorite',
    };
  }
}

/**
 * 检查收藏状态
 */
export async function checkFavoriteStatus(
  userAddress: string,
  tokenAddress: string,
  network: string = 'sepolia'
): Promise<FavoriteStatusResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/users/${userAddress}/favorites/${tokenAddress}/?network=${network}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Check favorite status error:', error);
    return {
      success: false,
      error: 'Network error occurred while checking favorite status',
    };
  }
}

/**
 * 获取用户收藏列表
 */
export async function getUserFavorites(
  userAddress: string,
  network: string = 'sepolia',
  limit?: number
): Promise<UserFavoritesResponse> {
  try {
    const params = new URLSearchParams({ network });
    if (limit) {
      params.append('limit', limit.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/api/users/${userAddress}/favorites/?${params}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get user favorites error:', error);
    return {
      success: false,
      error: 'Network error occurred while fetching favorites',
    };
  }
}

/**
 * 获取代币收藏统计
 */
export async function getTokenFavorites(
  tokenAddress: string,
  network: string = 'sepolia'
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/users/tokens/${tokenAddress}/favorites/?network=${network}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get token favorites error:', error);
    return {
      success: false,
      error: 'Network error occurred while fetching token favorites',
    };
  }
}
