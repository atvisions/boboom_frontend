"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronDown, TrendingUp, Clock, Zap, Star, Shield, BadgeCheck, Grid3X3, List, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { tokenAPI, favoriteAPI, userAPI } from "@/services/api";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import websocketService from "@/services/websocket";
import { MiniChart } from "@/components/ui/MiniChart";

// 时间格式化函数
const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

const sortOptions = [
  { name: "Newest", value: "newest", icon: Clock },
  { name: "Near Graduation", value: "curved", icon: Zap },
  { name: "Top MC", value: "top-mc", icon: TrendingUp },
  { name: "Graduated", value: "graduated", icon: Shield }
];

export function TokenGrid() {
  const router = useRouter();
  const { address, isConnected, isClient } = useWalletAuth();
  
  // 状态初始化
  const [selectedSort, setSelectedSort] = useState("top-mc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilter, setShowFilter] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 筛选状态
  const [filters, setFilters] = useState({
    mcapMin: "",
    mcapMax: "",
    volumeMin: "",
    volumeMax: ""
  });
  
  // 在客户端渲染后从localStorage读取持久化设置
  useEffect(() => {
    if (isClient) {
      const savedSort = localStorage.getItem('tokenGridSort');
      if (savedSort) {
        setSelectedSort(savedSort);
      }
      
      const savedViewMode = localStorage.getItem('tokenGridViewMode');
      if (savedViewMode) {
        setViewMode(savedViewMode as "grid" | "list");
      }
      
      setIsInitialized(true);
    }
  }, [isClient]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // 用于标签切换时的刷新状态
  const [error, setError] = useState<string | null>(null);
  const [okbPrice, setOkbPrice] = useState<number>(177.6); // 默认OKB价格
  const [creators, setCreators] = useState<{[key: string]: any}>({}); // 存储创作者信息

  // 加载OKB价格
  useEffect(() => {
    if (!isClient) return;
    
    const loadOKBPrice = async () => {
      try {
        const response = await tokenAPI.getOKBPrice();
        if (response.success) {
          setOkbPrice(parseFloat(response.data.price));
        }
      } catch (error) {
        console.error('Failed to load OKB price:', error);
      }
    };
    
    loadOKBPrice();
  }, [isClient]);

  // 防抖的数据加载函数
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // 处理WebSocket代币列表数据
  const handleTokenListData = useCallback((data: any) => {
    console.log('🔍 TokenGrid received WebSocket data:', data?.type, 'with', data?.data?.length, 'items');


    // 处理不同类型的WebSocket消息
    const isValidTokenData = (
      data.type === 'token_list' ||
      data.type === 'newest_tokens' ||
      data.type === 'near_graduation_tokens' ||
      data.type === 'top_mc_tokens' ||
      data.type === 'newest_tokens_update' ||
      data.type === 'near_graduation_tokens_update' ||
      data.type === 'top_mc_tokens_update'
    );

    if (isValidTokenData) {
      const tokenList = data.data;
      if (Array.isArray(tokenList)) {
        const processedTokens = tokenList.map((token: any) => ({
          ...token,
          // WebSocket数据可能使用下划线命名，需要转换
          graduationProgress: parseFloat(token.graduationProgress || token.graduation_progress || '0'),
          volume24h: token.volume24h || token.volume_24h || '0',
          change24h: token.change24h || token.change_24h || '0',
          createdAt: token.createdAt || token.created_at || new Date().toISOString(),
          isVerified: token.isVerified || token.is_verified || false,
          imageUrl: token.imageUrl || token.image_url || '',
          marketCap: token.marketCap || token.market_cap || '0',
          currentPrice: token.currentPrice || token.current_price || '0',
          // 重要：确保ATH和交易数量字段被正确映射
          ath: token.ath || '0',
          transactionCount: token.transactionCount || token.transaction_count || 0,
          holderCount: token.holderCount || token.holder_count || 0
        }));

        // ATH Debug - 检查原始数据和处理后数据
        console.log('🔍 ATH Debug - First token:', {
          symbol: processedTokens[0]?.symbol,
          originalATH: tokenList[0]?.ath,
          processedATH: processedTokens[0]?.ath,
          originalTXNS: tokenList[0]?.transactionCount,
          processedTXNS: processedTokens[0]?.transactionCount,
          firstTokenKeys: tokenList[0] ? Object.keys(tokenList[0]) : 'no keys'
        });
        
        // WebSocket端点已经按照排序返回数据，无需再次排序
        // 但为了保险起见，仍然保留一些基本的过滤逻辑
        let filteredTokens = processedTokens;
        
        if (selectedSort === 'curved') {
          // Near graduation端点应该已经过滤了，但再次确认
          filteredTokens = processedTokens.filter((token: any) => 
            token.graduationProgress >= 80
          );
          console.log(`Filtered to ${filteredTokens.length} tokens with progress >= 80%`);
        }
        
        setTokens(filteredTokens);
        
        // 加载创作者信息
        const creatorAddresses = filteredTokens
          .map((token: any) => token.creator)
          .filter((creator: any) => creator && typeof creator === 'string');
        
        const loadCreators = async () => {
          const newCreators: {[key: string]: any} = {};
          
          for (const creatorAddress of creatorAddresses) {
            try {
              const creatorData = await userAPI.getUser(creatorAddress.toLowerCase());
              newCreators[creatorAddress] = creatorData;
            } catch (error) {
              console.error('Failed to load creator info for:', creatorAddress, error);
              // 提供默认创建者信息，防止UI因API错误而崩溃
              newCreators[creatorAddress] = {
                address: creatorAddress,
                username: `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`,
                avatar_url: null
              };
            }
          }
          
          setCreators(newCreators);
        };
        
        loadCreators();
        setLoading(false);
        setIsRefreshing(false);
        setError(null);
      }
    }
  }, [selectedSort]);

  // WebSocket连接状态
  const [connectionId, setConnectionId] = useState<string | null>(null);
  
  // 初始化WebSocket连接
  useEffect(() => {
    if (!isClient || !isInitialized) return; // 只在客户端运行且初始化完成后
    
    // 清除之前的定时器
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    // 设置防抖延迟
    const timeout = setTimeout(() => {
      // 根据选择的排序方式连接不同的WebSocket端点
      const connectWebSocket = () => {
        try {
          // 只在没有现有数据时显示loading状态，有数据时显示刷新状态
          if (tokens.length === 0) {
            setLoading(true);
          } else {
            setIsRefreshing(true);
          }
  
          
          // 断开之前的连接
          if (connectionId) {
            websocketService.disconnect(connectionId);
            setConnectionId(null);
          }
          
          // 根据排序选项选择WebSocket端点
          let endpoint;
          switch (selectedSort) {
            case 'newest':
              endpoint = 'tokens/newest/';
              break;
            case 'curved':
              endpoint = 'tokens/near-graduation/';
              break;
            case 'top-mc':
              endpoint = 'tokens/top-mc/';
              break;
            case 'graduated':
              endpoint = 'tokens/graduated/';
              break;
            default:
              endpoint = 'tokens/newest/';
              break;
          }

          // 建立WebSocket连接
          const newConnectionId = websocketService.connect(
            endpoint,
            handleTokenListData,
            (error) => {
              console.error('WebSocket connection error:', error);
              setError('WebSocket connection failed');
              setLoading(false);
            setIsRefreshing(false);
              // 如果WebSocket连接失败，回退到API
              fallbackToAPI();
            }
          );
          
          setConnectionId(newConnectionId);

        } catch (error) {
          console.error('Failed to connect WebSocket:', error);
          // 如果WebSocket连接失败，回退到API
          fallbackToAPI();
        }
      };
      
      // API回退函数
      const fallbackToAPI = async () => {
        try {
          // 只在没有现有数据时显示loading状态，有数据时显示刷新状态
          if (tokens.length === 0) {
            setLoading(true);
          } else {
            setIsRefreshing(true);
          }
          console.log('Falling back to API for sort:', selectedSort);
          
          // 根据选择的排序方式调用不同的专用API
          let response;
          const apiParams = {
            limit: selectedSort === 'newest' ? 12 : 50,
            network: 'sepolia'
          };

          switch (selectedSort) {
            case 'newest':
              response = await tokenAPI.getNewestTokens(apiParams);
              break;
            case 'curved':
              response = await tokenAPI.getNearGraduationTokens(apiParams);
              break;
            case 'top-mc':
              response = await tokenAPI.getTopMCTokens(apiParams);
              break;
            case 'graduated':
              response = await tokenAPI.getGraduatedTokens(apiParams);
              break;
            default:
              response = await tokenAPI.getNewestTokens(apiParams);
              break;
          }

          console.log('API fallback response:', response);
        
          if (response.success) {
            console.log('[TokenGrid] API response received:', response.data);
            // 处理API返回的数据，确保字段名一致
            const processedTokens = response.data.tokens.map((token: any) => {
              const processed = {
                ...token,
                // 映射下划线字段名到驼峰格式
                graduationProgress: parseFloat(token.graduation_progress || token.graduationProgress || '0'),
                volume24h: token.volume_24h || token.volume24h || '0',
                marketCap: token.market_cap || token.marketCap || '0',
                currentPrice: token.current_price || token.currentPrice || '0',
                imageUrl: token.image_url || token.imageUrl || '',
                createdAt: token.created_at || token.createdAt || new Date().toISOString(),
                isVerified: token.is_verified || token.isVerified || false,
                holderCount: token.holder_count || token.holderCount || 0,
                change24h: token.change_24h || token.change24h || '0',
                transactionCount: token.transaction_count || token.transactionCount || 0,
                ath: token.ath || '0'
              };
              console.log(`[TokenGrid] Processing token ${token.symbol}:`, {
                original: token.graduationProgress,
                processed: processed.graduationProgress,
                type: typeof processed.graduationProgress
              });
              return processed;
            });
            
            let filteredTokens = processedTokens;
            
            // 根据排序选项处理数据
            if (selectedSort === 'curved') {
              // 过滤进度80%以上的代币
              console.log('Total tokens received:', processedTokens.length);
              console.log('Progress distribution:', processedTokens.map((t: any) => t.graduationProgress).sort((a: number, b: number) => a - b));
              filteredTokens = processedTokens.filter((token: any) => 
                token.graduationProgress >= 80
              );
              console.log('Filtered tokens with progress >= 80%:', filteredTokens.length);
            } else if (selectedSort === 'top-mc') {
              // 按市值排序（从高到低）
              filteredTokens = processedTokens.sort((a: any, b: any) => {
                const marketCapA = parseFloat(a.marketCap || '0');
                const marketCapB = parseFloat(b.marketCap || '0');
                return marketCapB - marketCapA; // 降序排列
              });
              console.log('Sorted tokens by market cap (top 12):', filteredTokens.slice(0, 12).map((t: any) => ({ name: t.name, marketCap: t.marketCap })));
            }
            
            console.log('[TokenGrid] Setting filtered tokens:', filteredTokens);
            setTokens(filteredTokens);
            
            // 加载创作者信息
            const creatorAddresses = filteredTokens
              .map((token: any) => token.creator)
              .filter((creator: any) => creator && typeof creator === 'string');
            
            const loadCreators = async () => {
              const newCreators: {[key: string]: any} = {};
              
              for (const creatorAddress of creatorAddresses) {
                try {
                  const creatorData = await userAPI.getUser(creatorAddress.toLowerCase());
                  newCreators[creatorAddress] = creatorData;
                } catch (error) {
                  console.error('Failed to load creator info for:', creatorAddress, error);
                  // 提供默认创建者信息，防止UI因API错误而崩溃
                  newCreators[creatorAddress] = {
                    address: creatorAddress,
                    username: `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`,
                    avatar_url: null
                  };
                }
              }
              
              setCreators(newCreators);
            };
            
            loadCreators();
          } else {
            setError('Failed to load tokens');
          }
        } catch (err) {
          console.error('Error loading tokens:', err);
          setError('Failed to load tokens');
        } finally {
          setLoading(false);
          setIsRefreshing(false);
        }
      };

      // 优先使用WebSocket连接
      connectWebSocket();
    }, 300); // 300ms 防抖延迟
    
    setLoadingTimeout(timeout);
    
    // 清理函数
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      // 断开WebSocket连接
      if (connectionId) {
        websocketService.disconnect(connectionId);
        setConnectionId(null);
      }
    };
  }, [selectedSort, isClient, isInitialized, handleTokenListData, connectionId]);
  
  // 组件卸载时清理WebSocket连接
  useEffect(() => {
    return () => {
      if (connectionId) {
        websocketService.disconnect(connectionId);
      }
    };
  }, [connectionId]);

  // 防抖的收藏状态加载
  const [favoriteTimeout, setFavoriteTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // 加载用户收藏状态
  useEffect(() => {
    if (!isClient) return; // 只在客户端运行
    
    // 清除之前的定时器
    if (favoriteTimeout) {
      clearTimeout(favoriteTimeout);
    }
    
    // 设置防抖延迟
    const timeout = setTimeout(() => {
      const loadFavoriteStatus = async () => {
        if (!isConnected || !address || tokens.length === 0) return;

        try {
          // 批量检查收藏状态，但限制并发数量
          const batchSize = 5;
          const newFavorites = new Set<string>();
          
          for (let i = 0; i < tokens.length; i += batchSize) {
            const batch = tokens.slice(i, i + batchSize);
            const favoritePromises = batch.map(token =>
              favoriteAPI.checkFavoriteStatus(address, token.address, 'sepolia')
            );
            
            const responses = await Promise.all(favoritePromises);
            responses.forEach((response, index) => {
              if (response.success && response.data.is_favorited) {
                newFavorites.add(batch[index].address);
              }
            });
            
            // 小延迟避免过于频繁的请求
            if (i + batchSize < tokens.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          setFavorites(newFavorites);
        } catch (error) {
          console.error('Error loading favorite status:', error);
        }
      };

      loadFavoriteStatus();
    }, 500); // 500ms 防抖延迟
    
    setFavoriteTimeout(timeout);
    
    // 清理函数
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isConnected, address, tokens, isClient]);

  const [isFavoriteLoading, debouncedToggleFavorite] = useDebounce(
    async (tokenAddress: string, tokenName: string) => {
      if (!isConnected || !address) {
        toast.error('Please connect your wallet first');
        return;
      }

      try {
        const response = await favoriteAPI.toggleFavorite(address, {
          token_address: tokenAddress,
          network: 'sepolia'
        });

        if (response.success) {
          const newFavorites = new Set(favorites);
          if (response.data.is_favorited) {
            newFavorites.add(tokenAddress);
            toast.success(toastMessages.favorites.added(tokenName));
          } else {
            newFavorites.delete(tokenAddress);
            toast.success(toastMessages.favorites.removed(tokenName));
          }
          setFavorites(newFavorites);
          
          // 重新检查收藏状态以确保同步
          setTimeout(async () => {
            try {
              const statusResponse = await favoriteAPI.checkFavoriteStatus(address, tokenAddress, 'sepolia');
              if (statusResponse.success) {
                const updatedFavorites = new Set(favorites);
                if (statusResponse.data.is_favorited) {
                  updatedFavorites.add(tokenAddress);
                } else {
                  updatedFavorites.delete(tokenAddress);
                }
                setFavorites(updatedFavorites);
              }
            } catch (error) {
              console.error('Error rechecking favorite status:', error);
            }
          }, 500);
        } else {
          toast.error('Failed to update favorite status');
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Failed to update favorite status');
      }
    },
    1000
  );

  // 保存排序设置到localStorage
  const handleSortChange = (sortValue: string) => {
    console.log('Saving sort to localStorage:', sortValue);
    setSelectedSort(sortValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tokenGridSort', sortValue);
      console.log('Saved to localStorage, current value:', localStorage.getItem('tokenGridSort'));
    }
  };

  // 保存视图模式设置到localStorage
  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tokenGridViewMode', mode);
    }
  };

  // 筛选功能
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      mcapMin: "",
      mcapMax: "",
      volumeMin: "",
      volumeMax: ""
    });
  };

  const applyFilters = () => {
    // 这里可以添加筛选逻辑
    setShowFilter(false);
  };

  // 格式化数字显示
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(2);
  };

  // 格式化价格变化
  const formatPriceChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const toggleFavorite = (tokenAddress: string, tokenName: string) => {
    debouncedToggleFavorite(tokenAddress, tokenName);
  };

  return (
    <div className="px-6 pb-8">
      {/* 标题和筛选器 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white font-hubot-sans">Live Tokens</h2>
            <p className="text-gray-400 text-sm">Discover trending tokens in real-time</p>
          </div>
        </div>

        {/* 筛选和排序控件 */}
        <div className="flex items-center space-x-4 relative">
          {/* 排序按钮 */}
          <div className="flex space-x-2 bg-[#1a1a1a] rounded-xl p-1">
            {sortOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <Button
                  key={option.value}
                  variant={selectedSort === option.value ? "default" : "outline"}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    selectedSort === option.value
                      ? "bg-[#70E000] text-black hover:bg-[#70E000]/90 shadow-lg"
                      : "bg-transparent text-gray-400 hover:text-white hover:bg-[#232323] border-0"
                  }`}
                  onClick={() => handleSortChange(option.value)}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {option.name}
                </Button>
              );
            })}
          </div>

          {/* 筛选按钮 */}
          <div className="relative">
            <Button
              variant="outline"
              className="bg-[#1a1a1a] border-gray-700 text-gray-300 hover:text-white hover:bg-[#232323]"
              onClick={() => setShowFilter(!showFilter)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            
            {/* 筛选面板 */}
            {showFilter && (
              <>
                {/* 背景遮罩 */}
                <div 
                  className="fixed inset-0 bg-black/50 z-[9998]"
                  onClick={() => setShowFilter(false)}
                />
                {/* 弹窗内容 */}
                <div className="absolute top-full right-0 mt-2 bg-[#1a1a1a] border border-gray-700 rounded-xl p-6 z-[9999] min-w-[400px] shadow-2xl">
                  <div className="space-y-6">
                    {/* 市值筛选 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-white">Mcap</label>
                        <span className="text-xs text-gray-400">$1.0K - $50.0M+</span>
                      </div>
                      
                      {/* 滑块 */}
                      <div className="relative mb-4">
                        <div className="h-2 bg-gray-700 rounded-full">
                          <div className="h-2 bg-[#70E000] rounded-full w-full"></div>
                        </div>
                        <div className="absolute top-0 left-0 w-4 h-4 bg-[#70E000] rounded-full transform -translate-y-1 cursor-pointer"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 bg-[#70E000] rounded-full transform -translate-y-1 cursor-pointer"></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Minimum</label>
                          <input
                            type="text"
                            placeholder="e.g., 10k, 1m"
                            value={filters.mcapMin}
                            onChange={(e) => handleFilterChange('mcapMin', e.target.value)}
                            className="w-full px-3 py-2 bg-[#232323] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#70E000]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Maximum</label>
                          <input
                            type="text"
                            placeholder="e.g., 10k, 1m"
                            value={filters.mcapMax}
                            onChange={(e) => handleFilterChange('mcapMax', e.target.value)}
                            className="w-full px-3 py-2 bg-[#232323] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#70E000]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 24小时交易量筛选 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-white">24h Vol</label>
                        <span className="text-xs text-gray-400">$0 - $500.0K+</span>
                      </div>
                      
                      {/* 滑块 */}
                      <div className="relative mb-4">
                        <div className="h-2 bg-gray-700 rounded-full">
                          <div className="h-2 bg-[#70E000] rounded-full w-full"></div>
                        </div>
                        <div className="absolute top-0 left-0 w-4 h-4 bg-[#70E000] rounded-full transform -translate-y-1 cursor-pointer"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 bg-[#70E000] rounded-full transform -translate-y-1 cursor-pointer"></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Minimum</label>
                          <input
                            type="text"
                            placeholder="e.g., 5k, 100k"
                            value={filters.volumeMin}
                            onChange={(e) => handleFilterChange('volumeMin', e.target.value)}
                            className="w-full px-3 py-2 bg-[#232323] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#70E000]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Maximum</label>
                          <input
                            type="text"
                            placeholder="e.g., 5k, 100k"
                            value={filters.volumeMax}
                            onChange={(e) => handleFilterChange('volumeMax', e.target.value)}
                            className="w-full px-3 py-2 bg-[#232323] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#70E000]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="bg-transparent border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 px-6"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={applyFilters}
                      className="bg-[#70E000] text-black hover:bg-[#5BC500] px-6"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 视图模式切换 */}
          <div className="flex space-x-1 bg-[#1a1a1a] rounded-xl p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-[#70E000] text-black hover:bg-[#70E000]/90 shadow-lg"
                  : "bg-transparent text-gray-400 hover:text-white hover:bg-[#232323] border-0"
              }`}
              onClick={() => handleViewModeChange("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-[#70E000] text-black hover:bg-[#70E000]/90 shadow-lg"
                  : "bg-transparent text-gray-400 hover:text-white hover:bg-[#232323] border-0"
              }`}
              onClick={() => handleViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>


      {/* 代币网格 - 响应式布局 */}
      {/* 移除刷新状态指示器，避免抖动 */}
      
      {(loading && tokens.length === 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="group relative bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 animate-pulse">
              {/* 收藏按钮骨架 - 右上角 */}
              <div className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-700"></div>

              {/* 代币信息区域骨架 */}
              <div className="flex items-start space-x-4 mb-6">
                {/* Logo骨架 - 左侧 */}
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gray-700"></div>
                
                {/* 名称和创建者信息骨架 - 右侧内容 */}
                <div className="flex-1 min-w-0">
                  {/* 名称和符号骨架 */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="h-6 bg-gray-700 rounded w-20"></div>
                      <div className="h-4 bg-gray-700 rounded w-12"></div>
                      <div className="w-4 h-4 rounded-full bg-gray-700"></div>
                    </div>
                    
                    {/* 创建者信息骨架 */}
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-gray-700"></div>
                      <div className="h-4 bg-gray-700 rounded w-16"></div>
                      <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                      <div className="h-4 bg-gray-700 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 市场数据骨架 */}
              <div className="space-y-4">
                {/* 市值和交易量骨架 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="h-6 bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-6 bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-12 ml-auto"></div>
                  </div>
                </div>

                {/* 进度条骨架 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-700 rounded w-16"></div>
                    <div className="h-4 bg-gray-700 rounded w-12"></div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div className="w-1/2 h-3 bg-gray-700 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* 悬停效果骨架 */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#70E000]/5 to-transparent opacity-0 pointer-events-none"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-[#70E000] text-black rounded-lg hover:bg-[#5BC000] transition-colors"
          >
            Retry
          </button>
        </div>
      ) : viewMode === "list" ? (
        // 列表视图
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 overflow-hidden">
          {/* 列表头部 */}
          <div className="grid grid-cols-12 gap-2 px-4 py-4 bg-[#232323] border-b border-gray-700 text-sm font-medium text-gray-300">
            <div className="col-span-1">#</div>
            <div className="col-span-2">COIN</div>
            <div className="col-span-1">GRAPH</div>
            <div className="col-span-1">MCAP</div>
            <div className="col-span-1">ATH</div>
            <div className="col-span-1">AGE</div>
            <div className="col-span-1">TXNS</div>
            <div className="col-span-1">24H VOL</div>
            <div className="col-span-1">TRADERS</div>
            <div className="col-span-1">24H</div>
            <div className="col-span-1 text-center">FAVORITE</div>
          </div>
          
          {/* 列表内容 */}
          {tokens.map((token, index) => (
            <div
              key={token.address}
              className="grid grid-cols-12 gap-2 px-4 py-4 border-b border-gray-800 hover:bg-[#232323]/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/token/${token.address}`)}
            >
              {/* 排名 */}
              <div className="col-span-1 flex items-center text-gray-400 text-sm">
                #{index + 1}
              </div>
              
              {/* 代币信息 */}
              <div className="col-span-2 flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden">
                  {token.imageUrl ? (
                    <img
                      src={token.imageUrl}
                      alt={`${token.name} logo`}
                      className="w-5 h-5 object-contain rounded-full"
                    />
                  ) : (
                    <div className="text-xs font-bold text-white">{token.symbol.slice(0, 2)}</div>
                  )}
                </div>
                <div>
                  <div className="text-white font-medium text-sm truncate">{token.name}</div>
                  <div className="text-gray-400 text-xs">{token.symbol}</div>
                </div>
              </div>
              
              {/* 图表 */}
              <div className="col-span-1 flex items-center">
                <MiniChart
                  width={48}
                  height={24}
                  color={parseFloat(token.change24h || '0') >= 0 ? '#10B981' : '#EF4444'}
                  className="opacity-80"
                  useRealData={true}
                  tokenAddress={token.address}
                />
              </div>
              
              {/* 市值 */}
              <div className="col-span-1 flex items-center text-white text-sm">
                ${formatNumber(parseFloat(token.marketCap || '0'))}
              </div>
              
              {/* ATH */}
              <div className="col-span-1 flex items-center text-white text-sm">
                ${formatNumber(parseFloat(token.ath || '0'))}
              </div>
              
              {/* 年龄 */}
              <div className="col-span-1 flex items-center text-gray-400 text-sm">
                {getTimeAgo(token.createdAt)}
              </div>
              
              {/* 交易数 */}
              <div className="col-span-1 flex items-center text-gray-400 text-sm">
                {token.transactionCount || '-'}
              </div>
              
              {/* 24小时交易量 */}
              <div className="col-span-1 flex items-center text-gray-400 text-sm">
                ${formatNumber(parseFloat(token.volume24h || '0') * okbPrice)}
              </div>
              
              {/* 交易者数 */}
              <div className="col-span-1 flex items-center text-gray-400 text-sm">
                {token.holderCount || '-'}
              </div>

              {/* 24小时变化 */}
              <div className="col-span-1 flex items-center text-sm">
                <span className={parseFloat(token.change24h || '0') >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatPriceChange(parseFloat(token.change24h || '0'))}
                </span>
              </div>
              
              {/* 收藏按钮 */}
              <div className="col-span-1 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(token.address, token.name);
                  }}
                  disabled={isFavoriteLoading}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    favorites.has(token.address)
                      ? 'bg-[#70E000] text-black'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Star 
                    className={`h-4 w-4 ${favorites.has(token.address) ? 'fill-current' : ''}`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 网格视图
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {tokens.map((token, index) => (
            <div
              key={token.address}
              className={`group relative bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 hover:border-[#70E000]/50 hover:shadow-xl hover:shadow-[#70E000]/10 transition-all duration-300 cursor-pointer`}
              onClick={() => {
                router.push(`/token/${token.address}`);
              }}
            >
              {/* 收藏按钮 - 右上角 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(token.address, token.name);
                }}
                disabled={isFavoriteLoading}
                className={`absolute top-4 right-4 z-10 p-2.5 rounded-full transition-all duration-200 ${
                  favorites.has(token.address)
                    ? 'bg-[#70E000] text-black shadow-lg'
                    : 'bg-black/20 backdrop-blur-sm text-gray-400 hover:text-white hover:bg-black/40'
                } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Star className={`h-4 w-4 ${favorites.has(token.address) ? 'fill-current' : ''} ${isFavoriteLoading ? 'animate-pulse' : ''}`} />
              </button>

              {/* 代币信息区域 */}
              <div className="flex items-start space-x-4 mb-6">
                {/* Logo - 左侧 */}
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1B1B1B] to-[#232323] flex items-center justify-center shadow-lg">
                  {token.image_url ? (
                    <Image 
                      src={token.image_url} 
                      alt={`${token.name} logo`} 
                      width={64} 
                      height={64} 
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-2xl font-bold text-white">${token.symbol.slice(0, 2)}</span>`;
                        }
                      }}
                      unoptimized={true}
                    />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center bg-gray-800 rounded-full">
                      <span className="text-2xl font-bold text-white">{token.symbol.slice(0, 2)}</span>
                    </div>
                  )}
                </div>
                
                {/* 名称和创建者信息 - 右侧内容 */}
                <div className="flex-1 min-w-0">
                  {/* 名称和符号 */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{token.name}</h3>
                      <span className="text-gray-400 text-sm font-medium">({token.symbol})</span>
                      {token.isVerified && (
                        <div className="relative group/icon">
                          <div className="flex items-center justify-center cursor-help">
                            <BadgeCheck className="w-4 h-4 text-blue-400" />
                          </div>
                          {/* 悬停提示 */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Verified Token
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 创建者信息 */}
                    <div className="flex items-center space-x-3">
                      <button 
                        className="flex items-center space-x-2 hover:bg-[#232323] rounded-lg px-2 py-1 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const creatorAddress = typeof token.creator === 'string' 
                            ? token.creator 
                            : token.creator?.address;
                          if (creatorAddress) {
                            router.push(`/profile/${creatorAddress}`);
                          }
                        }}
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center overflow-hidden">
                          {(() => {
                            const creatorInfo = creators[token.creator];
                            if (creatorInfo?.avatar_url && creatorInfo.avatar_url.trim() !== '') {
                              if (creatorInfo.avatar_url.startsWith('/media/')) {
                                return (
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}${creatorInfo.avatar_url}?t=${creatorInfo.updated_at || Date.now()}`}
                                    alt="Creator avatar"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full object-cover"
                                    unoptimized={true}
                                  />
                                );
                              } else {
                                try {
                                  // Handle Unicode encoded emoji from backend
                                  if (creatorInfo.avatar_url.includes('\\u')) {
                                    // Parse the Unicode escape sequences
                                    const decoded = JSON.parse(`"${creatorInfo.avatar_url}"`);
                                    return <span className="text-xs">{decoded}</span>;
                                  }
                                  // Handle direct emoji or other formats
                                  return <span className="text-xs">{creatorInfo.avatar_url}</span>;
                                } catch (e) {
                                  // Fallback to original string if parsing fails
                                  return <span className="text-xs">{creatorInfo.avatar_url}</span>;
                                }
                              }
                            }
                            return <span className="text-xs">👤</span>;
                          })()}
                        </div>
                        <span className="text-gray-400 text-xs">
                          {(() => {
                            const creatorInfo = creators[token.creator];
                            if (creatorInfo?.username) {
                              return creatorInfo.username;
                            }
                            if (creatorInfo?.display_name) {
                              return creatorInfo.display_name;
                            }
                            if (typeof token.creator === 'string') {
                              return `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}`;
                            }
                            return 'Creator';
                          })()}
                        </span>
                      </button>
                      <span className="text-gray-400 text-xs">•</span>
                      <span className="text-gray-400 text-xs">
                        {getTimeAgo(token.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  {/* 描述 */}
                  <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                    {token.description}
                  </p>
                </div>
              </div>

              {/* 市场数据 */}
              <div className="space-y-4">
                {/* 市值和交易量 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[#70E000] font-bold text-lg mb-1">
                      ${parseFloat(token.marketCap).toFixed(4)}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Market Cap
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold text-lg mb-1">
                      ${(() => {
                        const volume = parseFloat(token.volume24h || '0');
                        const volumeInUSD = volume * okbPrice;
                        // 如果交易量小于0.01美元，显示为$0.00
                        return volumeInUSD < 0.01 ? '0.00' : volumeInUSD.toFixed(2);
                      })()}
                    </div>
                    <div className="text-gray-400 text-xs">
                      24h VOL
                    </div>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm font-medium">Progress</span>
                    <span className="text-[#70E000] font-bold text-sm">{token.graduationProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${token.graduationProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 悬停效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#70E000]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
