"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useToast } from '@/contexts/ToastContext';
import {
  toggleFavorite,
  checkFavoriteStatus,
  getUserFavorites,
  getTokenFavorites,
} from '@/services/favoriteService';

/**
 * 收藏切换 Hook
 */
export function useToggleFavorite() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationKey: ['toggleFavorite'], // 添加 mutation key 防止重复
    mutationFn: async ({ tokenAddress, network = 'sepolia' }: {
      tokenAddress: string;
      network?: string;
    }) => {
      if (!address) {
        throw new Error('Please connect your wallet first');
      }
      return toggleFavorite(address, tokenAddress, network);
    },
    onSuccess: (data, variables) => {
      if (data.success && data.data) {
        const { is_favorited, token_address } = data.data;
        
        // 显示提示 - 收藏用绿色成功提示，取消收藏用蓝色信息提示
        if (is_favorited) {
          showToast('Token added to favorites', 'success');
        } else {
          showToast('Token removed from favorites', 'info');
        }

        // 更新相关查询缓存
        queryClient.invalidateQueries({
          queryKey: ['favoriteStatus', address, token_address, variables.network],
        });
        queryClient.invalidateQueries({
          queryKey: ['userFavorites', address, variables.network],
        });
        queryClient.invalidateQueries({
          queryKey: ['tokenFavorites', token_address, variables.network],
        });
      } else {
        throw new Error(data.error || 'Failed to toggle favorite');
      }
    },
    onError: (error: Error) => {
      console.error('Toggle favorite error:', error);
      // 使用与钱包连接一致的错误提示样式
      showToast(error.message || 'Unable to toggle favorite status, please try again', 'error');
    },
  });
}

/**
 * 检查收藏状态 Hook
 */
export function useFavoriteStatus(tokenAddress: string, network: string = 'sepolia') {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['favoriteStatus', address, tokenAddress, network],
    queryFn: async () => {
      if (!address) return null;
      const result = await checkFavoriteStatus(address, tokenAddress, network);
      if (!result.success) {
        throw new Error(result.error || 'Failed to check favorite status');
      }
      return result.data;
    },
    enabled: !!address && !!tokenAddress,
    staleTime: 30 * 1000, // 30秒内认为数据是新鲜的
    refetchOnWindowFocus: false,
  });
}

/**
 * 获取用户收藏列表 Hook
 */
export function useUserFavorites(network: string = 'sepolia', limit?: number) {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['userFavorites', address, network, limit],
    queryFn: async () => {
      if (!address) return null;
      const result = await getUserFavorites(address, network, limit);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user favorites');
      }
      return result.data;
    },
    enabled: !!address,
    staleTime: 60 * 1000, // 1分钟内认为数据是新鲜的
    refetchOnWindowFocus: false,
  });
}

/**
 * 获取代币收藏统计 Hook
 */
export function useTokenFavorites(tokenAddress: string, network: string = 'sepolia') {
  return useQuery({
    queryKey: ['tokenFavorites', tokenAddress, network],
    queryFn: async () => {
      const result = await getTokenFavorites(tokenAddress, network);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch token favorites');
      }
      return result.data;
    },
    enabled: !!tokenAddress,
    staleTime: 60 * 1000, // 1分钟内认为数据是新鲜的
    refetchOnWindowFocus: false,
  });
}

/**
 * 批量检查多个代币的收藏状态
 */
export function useBatchFavoriteStatus(tokenAddresses: string[], network: string = 'sepolia') {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['batchFavoriteStatus', address, tokenAddresses, network],
    queryFn: async () => {
      if (!address || !tokenAddresses.length) return {};
      
      // 并行检查所有代币的收藏状态
      const results = await Promise.allSettled(
        tokenAddresses.map(tokenAddress => 
          checkFavoriteStatus(address, tokenAddress, network)
        )
      );

      // 构建结果映射
      const statusMap: Record<string, boolean> = {};
      results.forEach((result, index) => {
        const tokenAddress = tokenAddresses[index];
        if (result.status === 'fulfilled' && result.value.success && result.value.data) {
          statusMap[tokenAddress] = result.value.data.is_favorited;
        } else {
          statusMap[tokenAddress] = false;
        }
      });

      return statusMap;
    },
    enabled: !!address && tokenAddresses.length > 0,
    staleTime: 30 * 1000, // 30秒内认为数据是新鲜的
    refetchOnWindowFocus: false,
  });
}
