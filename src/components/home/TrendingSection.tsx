"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Flame, Share2, Info, Star, User, BadgeCheck } from "lucide-react";
import { FaXTwitter, FaTelegram, FaGlobe } from "react-icons/fa6";
import Image from "next/image";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";
import { tokenAPI, favoriteAPI, userAPI, cacheAPI } from "@/services/api";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useRouter } from "next/navigation";
import websocketService from "@/services/websocket";
import { extractCreatorAddresses } from "@/utils/contractAddresses";

// 时间格式化函数
const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

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
  const [creators, setCreators] = useState<{ [key: string]: any }>({}); // 存储创作者信息
  const [dataSource, setDataSource] = useState<"API" | "WebSocket" | null>(
    null
  ); // 跟踪数据来源
  const [lastStableData, setLastStableData] = useState<any[]>([]); // 存储稳定的数据
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]); // 待处理的更新
  const [updateDebounceTimer, setUpdateDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);
  const lastDataHashRef = useRef<string | null>(null); // 用于WebSocket数据去重

  // 数据稳定化：检查是否为显著变化
  const isSignificantChange = useCallback(
    (newTokens: any[], currentTokens: any[]) => {
      if (currentTokens.length === 0) return true; // 首次加载
      if (newTokens.length !== currentTokens.length) return true; // 数量变化

      // 检查前4个代币的排序是否发生变化
      for (
        let i = 0;
        i < Math.min(4, newTokens.length, currentTokens.length);
        i++
      ) {
        if (newTokens[i].address !== currentTokens[i].address) {
          return true;
        }
      }

      // 检查volume24h是否有显著变化（超过10%）
      const firstToken = newTokens[0];
      const currentFirst = currentTokens[0];
      if (
        firstToken &&
        currentFirst &&
        firstToken.address === currentFirst.address
      ) {
        const newVolume = parseFloat(
          firstToken.volume24h || firstToken.volume_24h || "0"
        );
        const currentVolume = parseFloat(
          currentFirst.volume24h || currentFirst.volume_24h || "0"
        );
        const changePercent =
          currentVolume > 0
            ? Math.abs((newVolume - currentVolume) / currentVolume)
            : 0;

        if (changePercent > 0.1) {
          // 10%以上的变化才更新
          return true;
        }
      }

      return false;
    },
    []
  );

  // 防抖更新函数
  const debouncedUpdate = useCallback(
    (newTokens: any[], source: "API" | "WebSocket") => {
      // 清除之前的定时器
      if (updateDebounceTimer) {
        clearTimeout(updateDebounceTimer);
      }

      // 如果是显著变化，立即更新
      if (isSignificantChange(newTokens, tokens)) {
        // Immediate update - significant change detected
        setTokens(newTokens);
        setLastStableData(newTokens);
        setPendingUpdates([]);
        return;
      }

      // 否则，延迟更新（防止频繁跳动）
      // Delayed update - data change not significant
      setPendingUpdates(newTokens);

      const timer = setTimeout(() => {
        // Execute delayed update
        setTokens(newTokens);
        setLastStableData(newTokens);
        setPendingUpdates([]);
      }, 3000); // 3秒后更新

      setUpdateDebounceTimer(timer);
    },
    [updateDebounceTimer, isSignificantChange, tokens]
  );

  // 数据一致性检查函数
  const checkDataConsistency = useCallback(
    (newTokens: any[], source: "API" | "WebSocket") => {
      if (tokens.length > 0 && newTokens.length > 0) {
        const currentFirst = tokens[0];
        const newFirst = newTokens[0];

        if (currentFirst.address === newFirst.address) {
          const socialMediaChanged =
            currentFirst.website !== newFirst.website ||
            currentFirst.twitter !== newFirst.twitter ||
            currentFirst.telegram !== newFirst.telegram;

          if (socialMediaChanged) {
          }
        }
      }
      setDataSource(source);
    },
    [tokens, dataSource]
  );

  // 加载OKB价格
  useEffect(() => {
    if (!isClient) return;

    const loadOKBPrice = async () => {
      try {
        const response = await tokenAPI.getOKBPrice();
        if (response.success) {
          setOkbPrice(parseFloat(response.data.price));
        }
      } catch (error) {}
    };

    loadOKBPrice();
  }, [isClient]);

  // 处理WebSocket代币列表数据
  const handleTokenListData = useCallback(
    (data: any) => {
      // 处理多种类型的WebSocket消息
      if (
        data.type === "token_list" ||
        data.type === "token_update" ||
        data.type === "trending_tokens_update"
      ) {
        const tokenList = data.data;
        if (Array.isArray(tokenList)) {
          // 数据去重：检查地址排序和关键数据字段
          const keyData = tokenList.slice(0, 4).map((t) => ({
            address: t.address,
            currentPrice: t.currentPrice || t.current_price || "0",
            marketCap: t.marketCap || t.market_cap || "0",
            volume24h: t.volume24h || t.volume_24h || "0",
            graduationProgress:
              t.graduationProgress || t.graduation_progress || "0",
            okbCollected: t.okbCollected || t.okb_collected || "0",
          }));
          const dataHash = JSON.stringify(keyData);

          // 检查数据是否真的有变化
          if (lastDataHashRef.current === dataHash) {
            return; // 数据没有变化，跳过更新
          }
          lastDataHashRef.current = dataHash;

          // 取前4个作为热门代币
          const trendingTokens = tokenList.slice(0, 4).map((token: any) => ({
            ...token,
            // WebSocket数据可能使用下划线命名，需要转换
            graduationProgress: parseFloat(
              token.graduationProgress || token.graduation_progress || "0"
            ),
            volume24h: token.volume24h || token.volume_24h || "0",
            createdAt:
              token.createdAt || token.created_at || new Date().toISOString(),
            isVerified: token.isVerified || token.is_verified || false,
            imageUrl: token.imageUrl || token.image_url || "",
            marketCap: token.marketCap || token.market_cap || "0",
            currentPrice: token.currentPrice || token.current_price || "0",
            // 社交媒体字段映射
            website: token.website || "",
            twitter: token.twitter || "",
            telegram: token.telegram || "",
          }));

          // 使用防抖更新，避免页面跳动
          debouncedUpdate(trendingTokens, "WebSocket");
          setLoading(false);

          // 加载创作者信息
          const creatorAddresses = extractCreatorAddresses(trendingTokens);

          const loadCreators = async () => {
            const newCreators: { [key: string]: any } = {};

            for (const creatorAddress of creatorAddresses) {
              try {
                const creatorData = await userAPI.getUser(
                  creatorAddress.toLowerCase()
                );
                newCreators[creatorAddress] = creatorData;
              } catch (error) {
                // 提供默认创建者信息，确保UI不会因为API错误而崩溃
                newCreators[creatorAddress] = {
                  address: creatorAddress,
                  username: `${creatorAddress.slice(
                    0,
                    6
                  )}...${creatorAddress.slice(-4)}`,
                  avatar_url: "👤",
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
    },
    [setTokens, setCreators, setLoading, setError]
  );

  // 初始化WebSocket连接和备用API加载
  useEffect(() => {
    if (!isClient) return; // 只在客户端运行

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
          network: "sepolia",
        });

        if (response.success && isComponentMounted) {
          // 处理API返回的数据，确保字段名一致
          const processedTokens = response.data.tokens.map((token: any) => {
            const processed = {
              ...token,
              // API返回的是驼峰命名，确保数据类型正确
              graduationProgress: parseFloat(token.graduationProgress || "0"),
              volume24h: token.volume24h || "0",
              marketCap: token.marketCap || "0",
              currentPrice: token.currentPrice || "0",
              imageUrl: token.imageUrl || token.image_url || "",
              createdAt: token.createdAt || new Date().toISOString(),
              isVerified: token.isVerified || false,
              // 社交媒体字段映射 - 确保API数据也包含这些字段
              website: token.website || "",
              twitter: token.twitter || "",
              telegram: token.telegram || "",
            };

            return processed;
          });

          // 使用防抖更新，避免页面跳动
          debouncedUpdate(processedTokens, "API");

          // 调试：检查API数据一致性
          if (processedTokens.length > 0) {
          }

          // 加载创作者信息
          const creatorAddresses = extractCreatorAddresses(
            response.data.tokens
          );

          const loadCreators = async () => {
            if (!isComponentMounted) return;

            const newCreators: { [key: string]: any } = {};

            for (const creatorAddress of creatorAddresses) {
              try {
                const creatorData = await userAPI.getUser(
                  creatorAddress.toLowerCase()
                );
                if (isComponentMounted) {
                  newCreators[creatorAddress] = creatorData;
                }
              } catch (error) {}
            }

            if (isComponentMounted) {
              setCreators(newCreators);
            }
          };

          loadCreators();
        } else if (isComponentMounted) {
          setError("Failed to load trending tokens");
        }
      } catch (err) {
        if (isComponentMounted) {
          setError("Failed to load trending tokens");
        }
      } finally {
        if (isComponentMounted) {
          setLoading(false);
        }
      }
    };

    // 连接WebSocket获取实时热门代币列表
    connectionId = websocketService.connect("tokens/trending/", (data) => {
      websocketConnected = true;
      // 清除定期刷新，因为WebSocket已连接
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
      handleTokenListData(data);
    });

    // 延迟加载初始数据，给WebSocket一个连接的机会
    const initialLoadTimeout = setTimeout(() => {
      if (!websocketConnected && isComponentMounted) {
        loadTrendingTokens();
      }
    }, 2000); // 2秒后如果WebSocket还没连接，则使用API加载

    // 设置WebSocket连接超时检测
    const connectionTimeout = setTimeout(() => {
      if (!websocketConnected && isComponentMounted) {
        // WebSocket连接失败，启动定期刷新作为备用
        refreshInterval = setInterval(() => {
          if (isComponentMounted && !websocketConnected) {
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
          return;
        }

        if (checkCount < maxChecks) {
          setTimeout(checkConnection, 2000);
        } else {
        }
      };

      setTimeout(checkConnection, 1000); // 首次检查延迟1秒
    };

    checkConnectionAndLoad();

    // 清理函数
    return () => {
      isComponentMounted = false;

      if (connectionId) {
        websocketService.disconnect(connectionId);
        connectionId = null;
      }

      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }

      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }

      if (initialLoadTimeout) {
        clearTimeout(initialLoadTimeout);
      }

      // 清理防抖定时器
      if (updateDebounceTimer) {
        clearTimeout(updateDebounceTimer);
      }
    };
  }, [isClient, handleTokenListData]);

  // 加载用户收藏状态
  useEffect(() => {
    if (!isClient) return; // 只在客户端运行

    const loadFavoriteStatus = async () => {
      if (!isConnected || !address || tokens.length === 0) return;

      try {
        const favoritePromises = tokens.map((token) =>
          favoriteAPI.checkFavoriteStatus(address, token.address, "sepolia")
        );

        const responses = await Promise.all(favoritePromises);
        const newFavorites = new Set<string>();

        responses.forEach((response, index) => {
          if (response.success && response.data.is_favorited) {
            newFavorites.add(tokens[index].address);
          }
        });

        setFavorites(newFavorites);
      } catch (error) {}
    };

    loadFavoriteStatus();
  }, [isConnected, address, tokens, isClient]);

  const [isFavoriteLoading, debouncedToggleFavorite] = useDebounce(
    async (tokenAddress: string, tokenName: string) => {
      if (!isConnected || !address) {
        toast.error("Please connect your wallet first");
        return;
      }

      try {
        const response = await favoriteAPI.toggleFavorite(address, {
          token_address: tokenAddress,
          network: "sepolia",
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
              const statusResponse = await favoriteAPI.checkFavoriteStatus(
                address,
                tokenAddress,
                "sepolia"
              );
              if (statusResponse.success) {
                const updatedFavorites = new Set(favorites);
                if (statusResponse.data.is_favorited) {
                  updatedFavorites.add(tokenAddress);
                } else {
                  updatedFavorites.delete(tokenAddress);
                }
                setFavorites(updatedFavorites);
              }
            } catch (error) {}
          }, 500);
        } else {
          toast.error("Failed to update favorite status");
        }
      } catch (error) {
        toast.error("Failed to update favorite status");
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
        <h2 className="text-2xl font-bold text-white font-hubot-sans">
          Trending Now
        </h2>
      </div>

      {/* 热门代币卡片 - 响应式布局，考虑侧边栏宽度，最多显示4个 */}
      {loading ? (
        <div className="grid grid-cols-1 justify-items-start  lg:grid-cols-2 xl:grid-cols-3 2xl:flex 2xl:flex-wrap gap-6">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="relative rounded-2xl overflow-hidden w-full max-w-[380px] h-[420px] mx-auto 2xl:mx-0 bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 animate-pulse"
            >
              {/* 顶部装饰条骨架 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600"></div>

              {/* 收藏按钮骨架 - 右上角 */}
              <div className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-600/50"></div>

              {/* 内容骨架 */}
              <div className="relative p-6 flex flex-col h-full">
                {/* 头部区域骨架 - Logo和名称 */}
                <div className="flex items-center space-x-4 mb-6">
                  {/* 代币Logo骨架 */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600/50 shadow-lg"></div>

                  {/* 代币名称和验证标识骨架 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="h-6 bg-gray-600 rounded w-24"></div>
                      <div className="w-5 h-5 rounded-full bg-gray-600"></div>
                    </div>
                    <div className="h-4 bg-gray-600 rounded w-16"></div>
                  </div>
                </div>

                {/* 代币简介骨架 */}
                <div className="mb-6">
                  <div className="h-4 bg-gray-600 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                </div>

                {/* 毕业进度区域骨架 */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-4 bg-gray-600 rounded w-32"></div>
                    <div className="h-5 bg-gray-600 rounded w-12"></div>
                  </div>

                  {/* 进度条骨架 */}
                  <div className="w-full h-4 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30">
                    <div className="w-1/3 h-4 bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500 rounded-full"></div>
                  </div>

                  {/* 进度信息骨架 */}
                  <div className="flex justify-between items-center mt-2">
                    <div className="h-3 bg-gray-600 rounded w-24"></div>
                    <div className="h-3 bg-gray-600 rounded w-16"></div>
                  </div>
                </div>

                {/* 市场数据骨架 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                    <div className="h-3 bg-gray-600 rounded w-16 mb-1"></div>
                    <div className="h-4 bg-gray-600 rounded w-20"></div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                    <div className="h-3 bg-gray-600 rounded w-20 mb-1"></div>
                    <div className="h-4 bg-gray-600 rounded w-24"></div>
                  </div>
                </div>

                {/* 底部区域骨架 - 创建者信息和社交媒体 */}
                <div className="mt-auto">
                  {/* 创建者信息和社交媒体图标骨架 */}
                  <div className="flex items-center justify-between mb-4">
                    {/* 左侧：创建者信息骨架 */}
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border border-gray-500/50"></div>
                      <div>
                        <div className="h-4 bg-gray-600 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-600 rounded w-12"></div>
                      </div>
                    </div>

                    {/* 右侧：社交媒体图标骨架 */}
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-800/50 border border-gray-700/30"></div>
                      <div className="w-8 h-8 rounded-full bg-gray-800/50 border border-gray-700/30"></div>
                      <div className="w-8 h-8 rounded-full bg-gray-800/50 border border-gray-700/30"></div>
                    </div>
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
            className="mt-4 px-6 py-2 bg-[#D7FE11] text-black rounded-lg hover:bg-[#5BC000] transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 justify-items-start lg:grid-cols-2 xl:grid-cols-3 2xl:flex 2xl:flex-wrap gap-6">
          {tokens.map((token) => (
            <a
              key={`${token.address}-${token.name}-${Date.now()}`}
              className="relative rounded-2xl overflow-hidden group w-full max-w-[380px] h-[420px] mx-auto 2xl:mx-0 bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 cursor-pointer hover:border-[#D7FE11]/30 hover:shadow-[0_0_30px_rgba(112,224,0,0.1)] transition-all duration-300"
              // onClick={() => router.push(`/token/?address=${token.address}`)}
              href={`/token/?address=${token.address}`}
            >
              {/* 顶部装饰条 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D7FE11] via-yellow-400 to-orange-500"></div>

              {/* 收藏按钮 - 右上角 */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(token.address, token.name);
                }}
                disabled={isFavoriteLoading}
                className={`absolute top-4 right-4 z-10 p-2.5 rounded-full transition-all duration-300 ${
                  favorites.has(token.address)
                    ? "bg-[#D7FE11] text-black shadow-lg shadow-[#D7FE11]/30"
                    : "bg-black/30 backdrop-blur-sm hover:bg-[#D7FE11]/20 text-white hover:text-[#D7FE11]"
                } ${isFavoriteLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Star
                  className={`h-5 w-5 ${
                    favorites.has(token.address) ? "fill-current" : ""
                  } ${isFavoriteLoading ? "animate-pulse" : ""}`}
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
                            target.style.display = "none";
                            parent.innerHTML = `<div class="text-2xl font-bold text-white">${token.symbol.slice(
                              0,
                              2
                            )}</div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className="text-2xl font-bold text-white">
                        {token.symbol.slice(0, 2)}
                      </div>
                    )}
                  </div>

                  {/* 代币名称和验证标识 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-xl font-bold text-white truncate">
                        {token.name}
                      </h3>
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
                    <p className="text-gray-400 text-sm font-mono">
                      {token.symbol}
                    </p>
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
                    <span className="text-gray-300 text-sm font-medium">
                      Graduation Progress
                    </span>
                    <span className="text-[#D7FE11] font-bold text-lg">
                      {token.graduationProgress.toFixed(1)}%
                    </span>
                  </div>

                  {/* 进度条 */}
                  <div className="w-full h-4 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30">
                    <div
                      className="bg-gradient-to-r from-[#D7FE11] via-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-1000 shadow-lg"
                      style={{ width: `${token.graduationProgress}%` }}
                    ></div>
                  </div>

                  {/* 进度信息 */}
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                    <span>
                      OKB Collected:{" "}
                      {parseFloat(token.okbCollected || "0").toFixed(2)}
                    </span>
                    <span>
                      Target:{" "}
                      {parseFloat(token.graduationThreshold || "200").toFixed(
                        0
                      )}
                    </span>
                  </div>
                </div>

                {/* 市场数据 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                    <div className="text-gray-400 text-xs mb-1">24h Volume</div>
                    <div className="text-white font-bold text-sm">
                      $
                      {(() => {
                        const volume = parseFloat(token.volume24h || "0");
                        const volumeInUSD = volume * okbPrice;
                        return volumeInUSD < 0.01
                          ? "0.00"
                          : volumeInUSD.toFixed(2);
                      })()}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                    <div className="text-gray-400 text-xs mb-1">Market Cap</div>
                    <div className="text-white font-bold text-sm">
                      ${parseFloat(token.marketCap || "0").toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* 底部区域 - 创建者信息和社交媒体 */}
                <div className="mt-auto">
                  {/* 创建者信息和社交媒体图标 */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      className="flex items-center space-x-3 hover:bg-white/5 rounded-xl px-3 py-2 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const creatorAddress =
                          typeof token.creator === "string"
                            ? token.creator
                            : token.creator?.address;
                        if (creatorAddress) {
                          router.push(
                            `/profile/other/?address=${creatorAddress}`
                          );
                        }
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center overflow-hidden border border-gray-500/50">
                        {(() => {
                          const creatorInfo = creators[token.creator];
                          if (
                            creatorInfo?.avatar_url &&
                            creatorInfo.avatar_url.trim() !== ""
                          ) {
                            if (creatorInfo.avatar_url.startsWith("/media/")) {
                              return (
                                <Image
                                  src={`${
                                    process.env.NEXT_PUBLIC_BACKEND_URL || ""
                                  }${creatorInfo.avatar_url}?t=${
                                    creatorInfo.updated_at || Date.now()
                                  }`}
                                  alt="Creator avatar"
                                  width={32}
                                  height={32}
                                  className="rounded-full object-cover"
                                  style={{ width: "32px", height: "32px" }}
                                  unoptimized={true}
                                />
                              );
                            } else {
                              try {
                                if (creatorInfo.avatar_url.includes("\\u")) {
                                  return (
                                    <span className="text-sm">
                                      {JSON.parse(
                                        `"${creatorInfo.avatar_url}"`
                                      )}
                                    </span>
                                  );
                                }
                                if (creatorInfo.avatar_url.startsWith("\\u")) {
                                  return (
                                    <span className="text-sm">
                                      {String.fromCodePoint(
                                        parseInt(
                                          creatorInfo.avatar_url.slice(2),
                                          16
                                        )
                                      )}
                                    </span>
                                  );
                                }
                                return (
                                  <span className="text-sm">
                                    {creatorInfo.avatar_url}
                                  </span>
                                );
                              } catch (e) {
                                return (
                                  <span className="text-sm">
                                    {creatorInfo.avatar_url}
                                  </span>
                                );
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
                            if (typeof token.creator === "string") {
                              return `${token.creator.slice(
                                0,
                                6
                              )}...${token.creator.slice(-4)}`;
                            }
                            return "Unknown";
                          })()}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {getTimeAgo(token.createdAt)}
                        </div>
                      </div>
                    </button>

                    {/* 社交媒体图标 - 放在创建者信息的右侧 */}
                    <div className="flex items-center space-x-2">
                      {/* Twitter 图标 */}
                      {token.twitter && (
                        <a
                          href={token.twitter}
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-gray-800/50 hover:bg-[#D7FE11] hover:text-black transition-all duration-300 border border-gray-700/30"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          title="Twitter"
                        >
                          <FaXTwitter className="h-4 w-4 text-white" />
                        </a>
                      )}

                      {/* Telegram 图标 */}
                      {token.telegram && (
                        <a
                          href={token.telegram}
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-gray-800/50 hover:bg-[#D7FE11] hover:text-black transition-all duration-300 border border-gray-700/30"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          title="Telegram"
                        >
                          <FaTelegram className="h-4 w-4 text-white" />
                        </a>
                      )}

                      {/* Website 图标 */}
                      {token.website && (
                        <a
                          href={token.website}
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-gray-800/50 hover:bg-[#D7FE11] hover:text-black transition-all duration-300 border border-gray-700/30"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          title="Website"
                        >
                          <FaGlobe className="h-4 w-4 text-white" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
