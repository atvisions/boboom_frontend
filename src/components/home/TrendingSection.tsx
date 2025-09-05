"use client";
import { useState, useEffect, useCallback } from "react";
import { Flame, Share2, Info, Star, User, BadgeCheck } from "lucide-react";
import { FaXTwitter, FaTelegram, FaGlobe } from "react-icons/fa6";
import Image from "next/image";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";
import { tokenAPI, favoriteAPI, userAPI, cacheAPI } from "@/services/api";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useRouter } from "next/navigation";
import websocketService from "@/services/websocket";

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

export function TrendingSection() {
  const router = useRouter();
  const { address, isConnected, isClient } = useWalletAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  // 处理WebSocket代币列表数据
  const handleTokenListData = useCallback((data: any) => {
    // 处理多种类型的WebSocket消息
    if (data.type === 'token_list' || data.type === 'token_update') {
      const tokenList = data.data;
      if (Array.isArray(tokenList)) {
        console.log('[TrendingSection] Received WebSocket update:', data.type, tokenList.length, 'tokens');

        // 取前4个作为热门代币
        const trendingTokens = tokenList.slice(0, 4).map((token: any) => ({
          ...token,
          // WebSocket数据可能使用下划线命名，需要转换
          graduationProgress: parseFloat(token.graduationProgress || token.graduation_progress || '0'),
          volume24h: token.volume24h || token.volume_24h || '0',
          createdAt: token.createdAt || token.created_at || new Date().toISOString(),
          isVerified: token.isVerified || token.is_verified || false,
          imageUrl: token.imageUrl || token.image_url || '',
          marketCap: token.marketCap || token.market_cap || '0',
          currentPrice: token.currentPrice || token.current_price || '0'
        }));

        console.log('[TrendingSection] Processed trending tokens:', trendingTokens.map(t => `${t.symbol}: ${t.graduationProgress}%`));
        setTokens(trendingTokens);

        // 加载创作者信息
        const creatorAddresses = trendingTokens
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
              // 提供默认创建者信息，确保UI不会因为API错误而崩溃
              newCreators[creatorAddress] = {
                address: creatorAddress,
                username: `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`,
                avatar_url: '👤'
              };
            }
          }
          
          setCreators(newCreators);
        };
        
        loadCreators();
        setLoading(false);
        setError(null);
      }
    }
  }, [setTokens, setCreators, setLoading, setError]);

  // 初始化WebSocket连接和备用API加载
  useEffect(() => {
    if (!isClient) return; // 只在客户端运行
    
    console.log('[TrendingSection] Component mounting, clearing cache...');
    // 清除代币相关缓存，确保获取最新数据
    cacheAPI.clearTokens();
    
    let connectionId: string | null = null;
    let isComponentMounted = true;
    let websocketConnected = false;
    let refreshInterval: NodeJS.Timeout | null = null;

    // 备用API加载（如果WebSocket连接失败）
    const loadTrendingTokens = async () => {
      if (!isComponentMounted) return;

      try {
        setLoading(true);
        const response = await tokenAPI.getTokens({
          trending: true,
          limit: 4,
          network: 'sepolia'
        });

        if (response.success && isComponentMounted) {
          console.log('[TrendingSection] API response received:', response.data);
          // 处理API返回的数据，确保字段名一致
          const processedTokens = response.data.tokens.map((token: any) => {
            const processed = {
              ...token,
              // API返回的是驼峰命名，确保数据类型正确
              graduationProgress: parseFloat(token.graduationProgress || '0'),
              volume24h: token.volume24h || '0',
              marketCap: token.marketCap || '0',
              currentPrice: token.currentPrice || '0',
              imageUrl: token.imageUrl || '',
              createdAt: token.createdAt || new Date().toISOString(),
              isVerified: token.isVerified || false
            };
            console.log(`[TrendingSection] Processing token ${token.symbol}:`, {
              original: token.graduationProgress,
              processed: processed.graduationProgress,
              type: typeof processed.graduationProgress
            });
            return processed;
          });

          console.log('[TrendingSection] Setting processed tokens:', processedTokens);
          setTokens(processedTokens);

          // 加载创作者信息
          const creatorAddresses = response.data.tokens
            .map((token: any) => token.creator)
            .filter((creator: any) => creator && typeof creator === 'string');

          const loadCreators = async () => {
            if (!isComponentMounted) return;

            const newCreators: {[key: string]: any} = {};

            for (const creatorAddress of creatorAddresses) {
              try {
                const creatorData = await userAPI.getUser(creatorAddress.toLowerCase());
                if (isComponentMounted) {
                  newCreators[creatorAddress] = creatorData;
                }
              } catch (error) {
                console.error('Failed to load creator info for:', creatorAddress, error);
              }
            }

            if (isComponentMounted) {
              setCreators(newCreators);
            }
          };

          loadCreators();
        } else if (isComponentMounted) {
          setError('Failed to load trending tokens');
        }
      } catch (err) {
        console.error('[TrendingSection] Error loading trending tokens:', err);
        if (isComponentMounted) {
          setError('Failed to load trending tokens');
        }
      } finally {
        if (isComponentMounted) {
          console.log('[TrendingSection] Loading finished');
          setLoading(false);
        }
      }
    };

    // 立即加载初始数据
    loadTrendingTokens();

    // 连接WebSocket获取实时代币列表
    console.log('[TrendingSection] Attempting WebSocket connection...');
    connectionId = websocketService.connect('tokens/', (data) => {
      websocketConnected = true;
      // 清除定期刷新，因为WebSocket已连接
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        console.log('[TrendingSection] WebSocket connected, clearing periodic refresh');
      }
      handleTokenListData(data);
    });

    // 设置WebSocket连接超时检测
    const connectionTimeout = setTimeout(() => {
      if (!websocketConnected && isComponentMounted) {
        console.log('[TrendingSection] WebSocket connection timeout, starting periodic refresh');
        // WebSocket连接失败，启动定期刷新作为备用
        refreshInterval = setInterval(() => {
          if (isComponentMounted && !websocketConnected) {
            console.log('[TrendingSection] Periodic refresh triggered (WebSocket failed)');
            loadTrendingTokens();
          }
        }, 30000); // 每30秒刷新一次
      }
    }, 5000); // 5秒后检测WebSocket是否连接成功
    
    // WebSocket连接状态检查 - 改进的连接检查机制
    const checkConnectionAndLoad = () => {
      let checkCount = 0;
      const maxChecks = 3;
      
      const checkConnection = () => {
        if (!isComponentMounted) return;
        
        checkCount++;
        if (connectionId && websocketService.isConnected(connectionId)) {
          console.log('[TrendingSection] WebSocket connected successfully');
          return;
        }
        
        if (checkCount < maxChecks) {
          console.log(`[TrendingSection] WebSocket connection check ${checkCount}/${maxChecks}, retrying...`);
          setTimeout(checkConnection, 2000);
        } else {
          console.log('[TrendingSection] WebSocket connection failed after multiple attempts, using API only');
        }
      };
      
      setTimeout(checkConnection, 1000); // 首次检查延迟1秒
    };
    
    checkConnectionAndLoad();
    
    // 清理函数
    return () => {
      console.log('[TrendingSection] Component unmounting, cleaning up...');
      isComponentMounted = false;

      if (connectionId) {
        websocketService.disconnect(connectionId);
      }

      if (refreshInterval) {
        clearInterval(refreshInterval);
      }

      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
    };
  }, [isClient, handleTokenListData]);

  // 加载用户收藏状态
  useEffect(() => {
    if (!isClient) return; // 只在客户端运行
    
    const loadFavoriteStatus = async () => {
      if (!isConnected || !address || tokens.length === 0) return;

      try {
        const favoritePromises = tokens.map(token =>
          favoriteAPI.checkFavoriteStatus(address, token.address, 'sepolia')
        );
        
        const responses = await Promise.all(favoritePromises);
        const newFavorites = new Set<string>();
        
        responses.forEach((response, index) => {
          if (response.success && response.data.is_favorited) {
            newFavorites.add(tokens[index].address);
          }
        });
        
        setFavorites(newFavorites);
      } catch (error) {
        console.error('Error loading favorite status:', error);
      }
    };

    loadFavoriteStatus();
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

  const toggleFavorite = (tokenAddress: string, tokenName: string) => {
    debouncedToggleFavorite(tokenAddress, tokenName);
  };

  return (
    <div className="mb-8 px-6">
      {/* 标题 */}
      <div className="flex items-center space-x-2 mb-6">
        <Flame className="h-6 w-6 text-orange-500" />
        <h2 className="text-2xl font-bold text-white font-hubot-sans">Trending Now</h2>
      </div>

      {/* 热门代币卡片 - 响应式布局，考虑侧边栏宽度，最多显示4个 */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="relative rounded-lg overflow-hidden w-full max-w-[350px] h-[343px] mx-auto bg-transparent animate-pulse">
              {/* 背景骨架 */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
              
              {/* 收藏按钮骨架 - 右上角 */}
              <div className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-600"></div>
              
              {/* 内容骨架 */}
              <div className="relative p-6 flex flex-col items-center text-center h-full justify-center">
                {/* Logo骨架 - 圆形 */}
                <div className="w-20 h-20 rounded-full bg-gray-600 mb-4"></div>
                
                {/* 代币名称和验证标识骨架 */}
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <div className="h-8 bg-gray-600 rounded w-24"></div>
                  <div className="w-5 h-5 rounded-full bg-gray-600"></div>
                </div>
                
                {/* 代币简介骨架 */}
                <div className="mb-4 px-2 w-full">
                  <div className="h-4 bg-gray-600 rounded w-3/4 mx-auto"></div>
                </div>
                
                {/* 市场数据骨架 */}
                <div className="space-y-3 mb-4 w-full">
                  {/* Progress显示在进度条上方 */}
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-600 rounded w-16"></div>
                    <div className="h-4 bg-gray-600 rounded w-12"></div>
                  </div>
                  
                  {/* 进度条骨架 */}
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className="w-1/3 h-3 bg-gray-600 rounded-full"></div>
                  </div>
                  
                  {/* 24h Volume骨架 */}
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-600 rounded w-20"></div>
                    <div className="h-4 bg-gray-600 rounded w-24"></div>
                  </div>
                </div>
                
                {/* 创建者信息和社交媒体骨架 */}
                <div className="flex items-center justify-between w-full">
                  {/* 创建者信息骨架 - 靠左 */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                    <div className="h-4 bg-gray-600 rounded w-16"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                    <div className="h-4 bg-gray-600 rounded w-12"></div>
                  </div>
                  
                  {/* 社交媒体图标骨架 - 靠右 */}
                  <div className="flex space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                    <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                    <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                  </div>
                </div>
              </div>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {tokens.map((token) => (
            <div
              key={token.address}
              className="relative rounded-lg overflow-hidden group w-full max-w-[350px] h-[343px] mx-auto bg-transparent cursor-pointer"
              onClick={() => router.push(`/token/${token.address}`)}
            >
              {/* 背景图 */}
              <div className="absolute inset-0">
                <Image
                  src="/Futuristic.png"
                  alt="Futuristic background"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
                />
              </div>

              {/* 收藏按钮 - 右上角 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(token.address, token.name);
                }}
                disabled={isFavoriteLoading}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${
                  favorites.has(token.address)
                    ? 'bg-[#70E000] text-black'
                    : 'bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white'
                } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Star 
                  className={`h-5 w-5 ${favorites.has(token.address) ? 'fill-current' : ''} ${isFavoriteLoading ? 'animate-pulse' : ''}`}
                />
              </button>

              {/* 内容 */}
              <div className="relative p-6 flex flex-col items-center text-center h-full justify-center">
                {/* 代币Logo - 圆形设计 */}
                <div className="w-20 h-20 rounded-full mb-4 flex items-center justify-center overflow-hidden">
                  {token.image_url ? (
                    <img
                      src={token.image_url}
                      alt={`${token.name} logo`}
                      className="w-16 h-16 object-contain rounded-full"
                    />
                  ) : (
                    <div className="text-3xl font-bold text-white">{token.symbol.slice(0, 2)}</div>
                  )}
                </div>

                {/* 代币名称和验证标识 */}
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <h3 className="text-2xl font-bold text-white">{token.name}</h3>
                  {token.isVerified && (
                    <div className="relative group/icon">
                      <div className="flex items-center justify-center cursor-help">
                        <BadgeCheck className="w-5 h-5 text-blue-400" />
                      </div>
                      {/* 悬停提示 */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Verified Token
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 代币简介 */}
                {token.description && (
                  <div className="mb-4 px-2">
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-1">
                      {token.description}
                    </p>
                  </div>
                )}

                {/* 市场数据 */}
                <div className="space-y-3 mb-4 w-full">
                  {/* Progress显示在进度条上方 */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Progress</span>
                    <span className="text-[#70E000] font-bold text-sm">
                      {token.graduationProgress.toFixed(1)}%
                    </span>
                  </div>

                  {/* 进度条 */}
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${token.graduationProgress}%` }}
                    ></div>
                  </div>

                  {/* 24h Volume */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">24h Volume</span>
                    <span className="text-white font-bold text-sm">
                      ${(() => {
                        const volume = parseFloat(token.volume24h || '0');
                        const volumeInUSD = volume * okbPrice;
                        // 如果交易量小于0.01美元，显示为$0.00
                        return volumeInUSD < 0.01 ? '0.00' : volumeInUSD.toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>

                                  {/* 创建者信息和社交媒体图标 - 左右分布 */}
                  <div className="flex items-center justify-between w-full">
                    {/* 创建者信息 - 靠左 */}
                    <div className="flex items-center space-x-2">
                      <button 
                        className="flex items-center space-x-2 hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
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
                        <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                          {(() => {
                            const creatorInfo = creators[token.creator];
                            if (creatorInfo?.avatar_url && creatorInfo.avatar_url.trim() !== '') {
                              if (creatorInfo.avatar_url.startsWith('/media/')) {
                                return (
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}${creatorInfo.avatar_url}?t=${creatorInfo.updated_at || Date.now()}`}
                                    alt="Creator avatar"
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded-full object-cover"
                                    unoptimized={true}
                                  />
                                );
                              } else {
                                try {
                                  if (creatorInfo.avatar_url.includes('\\u')) {
                                    return <span className="text-sm">{JSON.parse(`"${creatorInfo.avatar_url}"`)}</span>;
                                  }
                                  if (creatorInfo.avatar_url.startsWith('\\u')) {
                                    return <span className="text-sm">{String.fromCodePoint(parseInt(creatorInfo.avatar_url.slice(2), 16))}</span>;
                                  }
                                  return <span className="text-sm">{creatorInfo.avatar_url}</span>;
                                } catch (e) {
                                  return <span className="text-sm">{creatorInfo.avatar_url}</span>;
                                }
                              }
                            }
                            return <span className="text-sm">👤</span>;
                          })()}
                        </div>
                        <span className="text-gray-300 text-sm font-mono">
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
                            return 'Unknown';
                          })()}
                        </span>
                      </button>
                      <span className="text-gray-300 text-xs">•</span>
                      <span className="text-gray-300 text-xs">
                        {getTimeAgo(token.createdAt)}
                      </span>
                    </div>

                  {/* 社交媒体图标 - 靠右 */}
                  <div className="flex space-x-2">
                    {token.twitter && (
                      <a 
                        href={token.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full hover:bg-[#70E000] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaXTwitter className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {token.telegram && (
                      <a 
                        href={token.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full hover:bg-[#70E000] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaTelegram className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {token.website && (
                      <a 
                        href={token.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full hover:bg-[#70E000] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaGlobe className="h-4 w-4 text-white" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
