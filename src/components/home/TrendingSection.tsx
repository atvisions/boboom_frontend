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

        console.log('[TrendingSection] Processed trending tokens:', trendingTokens.map(t => `${t.symbol}: ${t.graduationProgress}% - Image: ${t.imageUrl}`));
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
              imageUrl: token.imageUrl || token.image_url || '',
              createdAt: token.createdAt || new Date().toISOString(),
              isVerified: token.isVerified || false
            };
            console.log(`[TrendingSection] Processing token ${token.symbol}:`, {
              original: token.graduationProgress,
              processed: processed.graduationProgress,
              type: typeof processed.graduationProgress,
              imageUrl: processed.imageUrl,
              originalImageUrl: token.imageUrl,
              originalImageUrlUnderscore: token.image_url
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

    // 连接WebSocket获取实时热门代币列表
    console.log('[TrendingSection] Attempting WebSocket connection...');
    connectionId = websocketService.connect('tokens/trending/', (data) => {
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
              className="relative rounded-2xl overflow-hidden group w-full max-w-[380px] h-[420px] mx-auto bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 cursor-pointer hover:border-[#70E000]/30 hover:shadow-[0_0_30px_rgba(112,224,0,0.1)] transition-all duration-300"
              onClick={() => router.push(`/token/${token.address}`)}
            >
              {/* 顶部装饰条 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#70E000] via-yellow-400 to-orange-500"></div>

              {/* 收藏按钮 - 右上角 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(token.address, token.name);
                }}
                disabled={isFavoriteLoading}
                className={`absolute top-4 right-4 z-10 p-2.5 rounded-full transition-all duration-300 ${
                  favorites.has(token.address)
                    ? 'bg-[#70E000] text-black shadow-lg shadow-[#70E000]/30'
                    : 'bg-black/30 backdrop-blur-sm hover:bg-[#70E000]/20 text-white hover:text-[#70E000]'
                } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Star 
                  className={`h-5 w-5 ${favorites.has(token.address) ? 'fill-current' : ''} ${isFavoriteLoading ? 'animate-pulse' : ''}`}
                />
              </button>

              {/* 内容区域 */}
              <div className="relative p-6 flex flex-col h-full">
                {/* 头部区域 - Logo和名称 */}
                <div className="flex items-center space-x-4 mb-6">
                  {/* 代币Logo */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden border-2 border-gray-600/50 shadow-lg">
                    {token.imageUrl ? (
                      <img
                        src={token.imageUrl}
                        alt={`${token.name} logo`}
                        className="w-12 h-12 object-contain rounded-xl"
                        onError={(e) => {
                          // 图片加载失败时显示代币符号
                          const target = e.currentTarget as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            target.style.display = 'none';
                            parent.innerHTML = `<div class="text-2xl font-bold text-white">${token.symbol.slice(0, 2)}</div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className="text-2xl font-bold text-white">{token.symbol.slice(0, 2)}</div>
                    )}
                  </div>

                  {/* 代币名称和验证标识 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-xl font-bold text-white truncate">{token.name}</h3>
                      {token.isVerified && (
                        <div className="relative group/icon">
                          <BadgeCheck className="w-5 h-5 text-blue-400" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Verified Token
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm font-mono">{token.symbol}</p>
                  </div>
                </div>

                {/* 代币简介 */}
                {token.description && (
                  <div className="mb-6">
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                      {token.description}
                    </p>
                  </div>
                )}

                {/* 毕业进度区域 */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-300 text-sm font-medium">Graduation Progress</span>
                    <span className="text-[#70E000] font-bold text-lg">
                      {token.graduationProgress.toFixed(1)}%
                    </span>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="w-full h-4 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30">
                    <div 
                      className="bg-gradient-to-r from-[#70E000] via-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-1000 shadow-lg"
                      style={{ width: `${token.graduationProgress}%` }}
                    ></div>
                  </div>
                  
                  {/* 进度信息 */}
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                    <span>OKB Collected: {parseFloat(token.okbCollected || '0').toFixed(2)}</span>
                    <span>Target: {parseFloat(token.graduationThreshold || '200').toFixed(0)}</span>
                  </div>
                </div>

                {/* 市场数据 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                    <div className="text-gray-400 text-xs mb-1">24h Volume</div>
                    <div className="text-white font-bold text-sm">
                      ${(() => {
                        const volume = parseFloat(token.volume24h || '0');
                        const volumeInUSD = volume * okbPrice;
                        return volumeInUSD < 0.01 ? '0.00' : volumeInUSD.toFixed(2);
                      })()}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                    <div className="text-gray-400 text-xs mb-1">Market Cap</div>
                    <div className="text-white font-bold text-sm">
                      ${parseFloat(token.marketCap || '0').toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* 底部区域 - 创建者信息和社交媒体 */}
                <div className="mt-auto">
                  {/* 创建者信息 */}
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      className="flex items-center space-x-3 hover:bg-white/5 rounded-xl px-3 py-2 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const creatorAddress = typeof token.creator === 'string' 
                          ? token.creator 
                          : token.creator?.address;
                        if (creatorAddress) {
                          router.push(`/profile/${creatorAddress}/`);
                        }
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center overflow-hidden border border-gray-500/50">
                        {(() => {
                          const creatorInfo = creators[token.creator];
                          if (creatorInfo?.avatar_url && creatorInfo.avatar_url.trim() !== '') {
                            if (creatorInfo.avatar_url.startsWith('/media/')) {
                              return (
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}${creatorInfo.avatar_url}?t=${creatorInfo.updated_at || Date.now()}`}
                                  alt="Creator avatar"
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full object-cover"
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
                      <div className="text-left">
                        <div className="text-white text-sm font-medium">
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
                        </div>
                        <div className="text-gray-400 text-xs">
                          {getTimeAgo(token.createdAt)}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* 社交媒体图标 */}
                  <div className="flex items-center justify-center space-x-3">
                    {token.twitter && token.twitter.trim() && (
                      <a 
                        href={token.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-gray-800/50 hover:bg-[#70E000] hover:text-black transition-all duration-300 border border-gray-700/30"
                        onClick={(e) => e.stopPropagation()}
                        title="Twitter"
                      >
                        <FaXTwitter className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {token.telegram && token.telegram.trim() && (
                      <a 
                        href={token.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-gray-800/50 hover:bg-[#70E000] hover:text-black transition-all duration-300 border border-gray-700/30"
                        onClick={(e) => e.stopPropagation()}
                        title="Telegram"
                      >
                        <FaTelegram className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {token.website && token.website.trim() && (
                      <a 
                        href={token.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-gray-800/50 hover:bg-[#70E000] hover:text-black transition-all duration-300 border border-gray-700/30"
                        onClick={(e) => e.stopPropagation()}
                        title="Website"
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
