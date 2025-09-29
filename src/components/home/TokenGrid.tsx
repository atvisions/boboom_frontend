"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, TrendingUp, Clock, Zap, Star, Shield, BadgeCheck, Grid3X3, List, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { tokenAPI, favoriteAPI, userAPI, clearApiCache } from "@/services/api";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import websocketService from "@/services/websocket";
import { MiniChart } from "@/components/ui/MiniChart";
import { AnimatedPercentage, AnimatedVolume } from "@/components/ui/AnimatedNumber";
import { formatPrice, formatNumber as utilsFormatNumber } from "@/lib/utils";
import { NETWORK_CONFIG } from "@/contracts/config-simple";
import { extractCreatorAddresses } from "@/utils/contractAddresses";

// 双向范围滑动条组件
interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  step?: number;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  formatValue = (v) => v.toString(),
  step = 1
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newValue = min + (percentage / 100) * (max - min);
    const steppedValue = Math.round(newValue / step) * step;

    if (isDragging === 'min') {
      onChange([Math.min(steppedValue, value[1]), value[1]]);
    } else {
      onChange([value[0], Math.max(steppedValue, value[0])]);
    }
  }, [isDragging, min, max, step, value, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="relative">
      <div
        ref={sliderRef}
        className="relative h-2 bg-gray-700 rounded-full cursor-pointer"
      >
        {/* 活跃范围 */}
        <div
          className="absolute h-2 bg-[#D7FE11] rounded-full"
          style={{
            left: `${getPercentage(value[0])}%`,
            width: `${getPercentage(value[1]) - getPercentage(value[0])}%`
          }}
        />

        {/* 最小值滑块 */}
        <div
          className="absolute w-4 h-4 bg-[#D7FE11] rounded-full transform -translate-y-1 cursor-pointer hover:scale-110 transition-transform"
          style={{ left: `${getPercentage(value[0])}%`, transform: 'translateX(-50%) translateY(-25%)' }}
          onMouseDown={handleMouseDown('min')}
        />

        {/* 最大值滑块 */}
        <div
          className="absolute w-4 h-4 bg-[#D7FE11] rounded-full transform -translate-y-1 cursor-pointer hover:scale-110 transition-transform"
          style={{ left: `${getPercentage(value[1])}%`, transform: 'translateX(-50%) translateY(-25%)' }}
          onMouseDown={handleMouseDown('max')}
        />
      </div>

      {/* 值显示 */}
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{formatValue(value[0])}</span>
        <span>{formatValue(value[1])}</span>
      </div>
    </div>
  );
};

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
  { name: "Graduated", value: "graduated", icon: Shield },
  { name: "Top MC", value: "top-mc", icon: TrendingUp }
];

export function TokenGrid() {
  const router = useRouter();
  const { address, isConnected, isClient } = useWalletAuth();
  
  // 状态初始化
  const [selectedSort, setSelectedSort] = useState("top-mc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilter, setShowFilter] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 保存原始未筛选的代币数据
  const [originalTokens, setOriginalTokens] = useState<any[]>([]);

  // 控制是否应该应用筛选的标志
  const [shouldApplyFilters, setShouldApplyFilters] = useState(true);

  // 立即阻止筛选的标志（用于清除筛选时）
  const [isClearing, setIsClearing] = useState(false);

  // 跟踪待执行的筛选setTimeout
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 筛选状态
  const [filters, setFilters] = useState({
    mcapMin: "",
    mcapMax: "",
    volumeMin: "",
    volumeMax: ""
  });

  // 滑动条状态
  const [mcapRange, setMcapRange] = useState<[number, number]>([1000, 50000000]); // $1K - $50M
  const [volumeRange, setVolumeRange] = useState<[number, number]>([0, 500000]); // $0 - $500K

  // 从localStorage加载筛选条件
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem('tokenGridFilters');
      if (savedFilters) {
        try {
          const parsedFilters = JSON.parse(savedFilters);
          setFilters(parsedFilters);
        } catch (error) {

        }
      }
    }
  }, []);

  // 保存筛选条件到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      localStorage.setItem('tokenGridFilters', JSON.stringify(filters));
    }
  }, [filters, isInitialized]);
  
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
  const [okbPrice, setOkbPrice] = useState<number>(205.91); // 默认OKB价格，使用更接近实际的值
  const [creators, setCreators] = useState<{[key: string]: any}>({}); // 存储创作者信息

  // 加载OKB价格
  useEffect(() => {
    if (!isClient) return;

    const loadOKBPrice = async () => {
      try {
        const response = await tokenAPI.getOKBPrice();
        if (response.success) {
          const newPrice = parseFloat(response.data.price);
          setOkbPrice(newPrice);
        }
      } catch (error) {
        // OKB价格加载失败，使用默认值
      }
    };

    loadOKBPrice();
  }, [isClient]);

  // 防抖的数据加载函数
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  // API 回退状态
  const [isUsingAPIFallback, setIsUsingAPIFallback] = useState(false);

  // 处理WebSocket代币列表数据
  const handleTokenListData = useCallback((data: any) => {
    // 如果正在使用 API 回退，忽略 WebSocket 数据
    if (isUsingAPIFallback) {
      // Ignoring WebSocket data because API fallback is active
      return;
    }

    // 处理单个代币价格更新
    if (data.type === 'price_update' || data.type === 'token_detail_update') {
      const tokenData = data.data;
      if (tokenData && tokenData.address) {
        setTokens(prevTokens => {
          return prevTokens.map(token => {
            if (token.address.toLowerCase() === tokenData.address.toLowerCase()) {
              return {
                ...token,
                currentPrice: tokenData.current_price || tokenData.currentPrice || token.currentPrice,
                marketCap: tokenData.market_cap || tokenData.marketCap || token.marketCap,
                volume24h: tokenData.volume_24h || tokenData.volume24h || token.volume24h,
                change24h: tokenData.price_change_24h || tokenData.change24h || token.change24h,
                high24h: tokenData.high_24h || tokenData.high24h || token.high24h,
                low24h: tokenData.low_24h || tokenData.low24h || token.low24h,
                ath: tokenData.ath || tokenData.ath_price || token.ath,
                transactionCount: tokenData.transaction_count || tokenData.transactionCount || token.transactionCount,
                holderCount: tokenData.holder_count || tokenData.holderCount || token.holderCount
              };
            }
            return token;
          });
        });

        // 同时更新原始数据
        setOriginalTokens(prevTokens => {
          return prevTokens.map(token => {
            if (token.address.toLowerCase() === tokenData.address.toLowerCase()) {
              return {
                ...token,
                currentPrice: tokenData.current_price || tokenData.currentPrice || token.currentPrice,
                marketCap: tokenData.market_cap || tokenData.marketCap || token.marketCap,
                volume24h: tokenData.volume_24h || tokenData.volume24h || token.volume24h,
                change24h: tokenData.price_change_24h || tokenData.change24h || token.change24h,
                high24h: tokenData.high_24h || tokenData.high24h || token.high24h,
                low24h: tokenData.low_24h || tokenData.low24h || token.low24h,
                ath: tokenData.ath || tokenData.ath_price || token.ath,
                transactionCount: tokenData.transaction_count || tokenData.transactionCount || token.transactionCount,
                holderCount: tokenData.holder_count || tokenData.holderCount || token.holderCount
              };
            }
            return token;
          });
        });
        return;
      }
    }

    // 处理不同类型的WebSocket消息
    const isValidTokenData = (
      data.type === 'token_list' ||
      data.type === 'newest_tokens' ||
      data.type === 'near_graduation_tokens' ||
      data.type === 'top_mc_tokens' ||
      data.type === 'graduated_tokens' ||
      data.type === 'newest_tokens_update' ||
      data.type === 'near_graduation_tokens_update' ||
      data.type === 'top_mc_tokens_update' ||
      data.type === 'graduated_tokens_update'
    );

    if (isValidTokenData) {
      // Received WebSocket data

      let tokenList = data.data;
      if (Array.isArray(tokenList)) {
        // 🔥 强制验证：对于 graduated 标签页，只显示真正毕业的代币
        if (selectedSort === 'graduated') {
          tokenList = tokenList.filter((token: any) => {
            const isGraduated = token.phase === 'GRADUATED' || token.has_graduated === true;
            if (!isGraduated) {

            }
            return isGraduated;
          });

        }

        const processedTokens = tokenList.map((token: any) => ({
          ...token,
          // WebSocket数据可能使用下划线命名，需要转换
          graduationProgress: parseFloat(token.graduationProgress || token.graduation_progress || '0'),
          volume24h: token.volume_24h || token.volume24h || '0',
          change24h: token.change_24h || token.change24h || '0',
          createdAt: token.created_at || token.createdAt || new Date().toISOString(),
          isVerified: token.is_verified || token.isVerified || false,
          imageUrl: token.image_url || token.imageUrl || '',
          marketCap: token.market_cap || token.marketCap || '0',
          currentPrice: token.current_price || token.currentPrice || '0',
          // 重要：确保ATH和交易数量字段被正确映射
          ath: token.ath || token.ath_price || '0',
          transactionCount: token.transaction_count || token.transactionCount || 0,
          holderCount: token.holder_count || token.holderCount || 0
        }));

        // 保存原始数据
        setOriginalTokens(processedTokens);

        // 应用排序逻辑（不应用用户筛选条件，让用户手动应用）
        let sortedTokens = [...processedTokens];

        if (selectedSort === 'curved') {
          sortedTokens = sortedTokens.filter((token: any) => {
            const progress = token.graduationProgress || 0;
            const isGraduated = token.phase === 'GRADUATED' || token.has_graduated === true;

            // 特别调试 OPTEST
            if (token.symbol === 'OPTEST') {

            }

            // 只显示进度80%以上但还没毕业的代币
            return progress >= 80 && !isGraduated;
          });
        } else if (selectedSort === 'top-mc') {
          sortedTokens = sortedTokens.sort((a: any, b: any) => {
            const marketCapA = parseFloat(a.marketCap || '0');
            const marketCapB = parseFloat(b.marketCap || '0');
            return marketCapB - marketCapA;
          });
        }

        // 如果有活跃的筛选条件且允许应用筛选，应用筛选
        if (shouldApplyFilters && !isClearing && hasActiveFilters()) {
          sortedTokens = sortedTokens.filter(passesFilter);
        }

        // Setting filtered tokens
        setTokens(sortedTokens);

        // 加载创作者信息
        const creatorAddresses = extractCreatorAddresses(sortedTokens);
        
        const loadCreators = async () => {
          const newCreators: {[key: string]: any} = {};
          
          for (const creatorAddress of creatorAddresses) {
            try {
              const creatorData = await userAPI.getUser(creatorAddress.toLowerCase());
              newCreators[creatorAddress] = creatorData;
            } catch (error) {

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
  }, [selectedSort, isUsingAPIFallback]);

  // 移除自动筛选的useEffect，改为手动应用筛选
  // useEffect(() => {
  //   if (isInitialized && tokens.length > 0) {
  //     // 重新应用筛选条件到现有数据
  //     const allTokens = [...tokens]; // 保存原始数据的副本
  //     // 这里我们需要重新获取完整数据并应用筛选
  //     // 为了避免频繁的API调用，我们可以在用户点击Apply时才重新加载
  //     // 这个useEffect主要用于UI状态更新
  //   }
  // }, [filters, isInitialized]);

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

              // 在开发环境中，WebSocket 连接失败是正常的，不显示错误 UI
              const isDevelopment = process.env.NODE_ENV === 'development';
              if (!isDevelopment) {
                setError('WebSocket connection failed');
              }

              setLoading(false);
              setIsRefreshing(false);
              // 如果WebSocket连接失败，回退到API
              fallbackToAPI();
            }
          );
          
          setConnectionId(newConnectionId);

          // 不需要额外的代币列表连接，主要的端点连接已经足够

        } catch (error) {

          // 如果WebSocket连接失败，回退到API
          fallbackToAPI();
        }
      };
      
      // API回退函数
      const fallbackToAPI = async () => {
        try {

          setIsUsingAPIFallback(true);

          // 只在没有现有数据时显示loading状态，有数据时显示刷新状态
          if (tokens.length === 0) {
            setLoading(true);
          } else {
            setIsRefreshing(true);
          }

          // 根据选择的排序方式调用不同的专用API
          let response;
          const apiParams = {
            limit: selectedSort === 'newest' ? 12 : 50,
            network: NETWORK_CONFIG.NETWORK_NAME
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

          if (response.success) {

            // 处理API返回的数据，确保字段名一致
            let rawTokens = response.data.tokens;

            // 🔥 强制验证：对于 graduated 标签页，只显示真正毕业的代币
            if (selectedSort === 'graduated') {
              rawTokens = rawTokens.filter((token: any) => {
                const isGraduated = token.phase === 'GRADUATED' || token.has_graduated === true;
                if (!isGraduated) {

                }
                return isGraduated;
              });

            }

            const processedTokens = rawTokens.map((token: any) => {
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
                ath: token.ath || token.ath_price || '0'
              };

              return processed;
            });
            
            let filteredTokens = processedTokens;

            // 应用用户筛选条件
            if (hasActiveFilters()) {
              filteredTokens = filteredTokens.filter(passesFilter);
            }

            // 根据排序选项处理数据
            if (selectedSort === 'curved') {
              // 过滤进度80%以上但还没毕业的代币
              filteredTokens = filteredTokens.filter((token: any) => {
                const progress = token.graduationProgress || 0;
                const isGraduated = token.phase === 'GRADUATED' || token.has_graduated === true;
                // 只显示进度80%以上但还没毕业的代币
                return progress >= 80 && !isGraduated;
              });

            } else if (selectedSort === 'top-mc') {
              // 按市值排序（从高到低）
              filteredTokens = filteredTokens.sort((a: any, b: any) => {
                const marketCapA = parseFloat(a.marketCap || '0');
                const marketCapB = parseFloat(b.marketCap || '0');
                return marketCapB - marketCapA; // 降序排列
              });

            }

            // 保存原始数据和筛选后的数据
            setOriginalTokens(processedTokens);
            setTokens(filteredTokens);
            
            // 加载创作者信息
            const creatorAddresses = extractCreatorAddresses(filteredTokens);
            
            const loadCreators = async () => {
              const newCreators: {[key: string]: any} = {};
              
              for (const creatorAddress of creatorAddresses) {
                try {
                  const creatorData = await userAPI.getUser(creatorAddress.toLowerCase());
                  newCreators[creatorAddress] = creatorData;
                } catch (error) {

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
            // 在生产环境中显示 API 错误，开发环境中静默处理
            const isDevelopment = process.env.NODE_ENV === 'development';
            if (!isDevelopment) {
              setError('Failed to load tokens');
            }
          }
        } catch (err) {

          // 在生产环境中显示 API 错误，开发环境中静默处理
          const isDevelopment = process.env.NODE_ENV === 'development';
          if (!isDevelopment) {
            setError('Failed to load tokens');
          }
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
  }, [selectedSort, isClient, isInitialized, handleTokenListData]);
  
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
          network: NETWORK_CONFIG.NETWORK_NAME
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

            }
          }, 500);
        } else {
          toast.error('Failed to update favorite status');
        }
      } catch (error) {

        toast.error('Failed to update favorite status');
      }
    },
    1000
  );

  // 保存排序设置到localStorage
  const handleSortChange = (sortValue: string) => {

    // 如果切换到不同的排序方式，清除当前数据以避免显示错误的数据
    if (sortValue !== selectedSort) {

      setTokens([]);
      setOriginalTokens([]);
      setLoading(true);
      setError(null);
      setIsRefreshing(false);
      setIsUsingAPIFallback(false);

      // 清除 API 缓存
      try {
        clearApiCache();

      } catch (error) {

      }

      // 断开现有的 WebSocket 连接
      if (connectionId) {

        websocketService.disconnect(connectionId);
        setConnectionId(null);
      }
    }

    setSelectedSort(sortValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tokenGridSort', sortValue);
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

  // 滑动条处理函数
  const handleMcapRangeChange = (range: [number, number]) => {
    setMcapRange(range);
    setFilters(prev => ({
      ...prev,
      mcapMin: range[0] > 1000 ? formatSliderValue(range[0]) : "",
      mcapMax: range[1] < 50000000 ? formatSliderValue(range[1]) : ""
    }));
  };

  const handleVolumeRangeChange = (range: [number, number]) => {
    setVolumeRange(range);
    setFilters(prev => ({
      ...prev,
      volumeMin: range[0] > 0 ? formatSliderValue(range[0]) : "",
      volumeMax: range[1] < 500000 ? formatSliderValue(range[1]) : ""
    }));
  };

  // 格式化滑动条值
  const formatSliderValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}m`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  const clearFilters = () => {

    const emptyFilters = {
      mcapMin: "",
      mcapMax: "",
      volumeMin: "",
      volumeMax: ""
    };

    // 立即设置清除标志，阻止任何筛选操作
    setIsClearing(true);

    // 清除任何待执行的筛选setTimeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
      filterTimeoutRef.current = null;
    }

    // 立即更新筛选状态
    setFilters(emptyFilters);

    // 暂时禁用WebSocket的自动筛选
    setShouldApplyFilters(false);

    // 重置滑动条
    setMcapRange([1000, 50000000]);
    setVolumeRange([0, 500000]);

    // 直接恢复原始数据，不通过筛选函数
    if (originalTokens.length > 0) {
      setTokens([...originalTokens]);
    }

    // 延迟重新启用筛选并清除清除标志
    setTimeout(() => {
      setIsClearing(false);
      setShouldApplyFilters(true);
    }, 300); // 增加延迟时间，确保状态更新完成
  };

  // 解析数字输入（支持k, m, b后缀）
  const parseNumberInput = (input: string): number => {
    if (!input) return 0;

    const cleanInput = input.toLowerCase().replace(/[,$\s]/g, '');
    const lastChar = cleanInput.slice(-1);
    const numPart = parseFloat(cleanInput.slice(0, -1)) || parseFloat(cleanInput);

    if (isNaN(numPart)) return 0;

    switch (lastChar) {
      case 'k':
        return numPart * 1000;
      case 'm':
        return numPart * 1000000;
      case 'b':
        return numPart * 1000000000;
      default:
        return parseFloat(cleanInput) || 0;
    }
  };

  // 使用自定义筛选条件应用筛选
  const applyFiltersWithCustomFilters = (customFilters: any) => {

    if (originalTokens.length > 0) {
      let filteredTokens = [...originalTokens]; // 从原始数据开始

      // 检查是否有活跃的筛选条件
      const hasCustomActiveFilters = !!(customFilters.mcapMin || customFilters.mcapMax || customFilters.volumeMin || customFilters.volumeMax);

      if (hasCustomActiveFilters) {
        filteredTokens = filteredTokens.filter((token: any) => {
          const mcapMin = parseNumberInput(customFilters.mcapMin);
          const mcapMax = parseNumberInput(customFilters.mcapMax);
          const volumeMin = parseNumberInput(customFilters.volumeMin);
          const volumeMax = parseNumberInput(customFilters.volumeMax);

          const tokenMcap = parseFloat(token.marketCap || '0');
          // 交易量需要转换为USD值进行比较
          const tokenVolumeOKB = parseFloat(token.volume24h || '0');
          const tokenVolumeUSD = tokenVolumeOKB * okbPrice;

          // 市值筛选
          if (mcapMin > 0 && tokenMcap < mcapMin) return false;
          if (mcapMax > 0 && tokenMcap > mcapMax) return false;

          // 交易量筛选（使用USD值）
          if (volumeMin > 0 && tokenVolumeUSD < volumeMin) return false;
          if (volumeMax > 0 && tokenVolumeUSD > volumeMax) return false;

          return true;
        });
      }

      // 应用排序逻辑
      if (selectedSort === 'curved') {
        filteredTokens = filteredTokens.filter((token: any) => {
          const progress = token.graduationProgress || 0;
          const isGraduated = token.phase === 'GRADUATED' || token.has_graduated === true;
          // 只显示进度80%以上但还没毕业的代币
          return progress >= 80 && !isGraduated;
        });
      } else if (selectedSort === 'top-mc') {
        filteredTokens = filteredTokens.sort((a: any, b: any) => {
          const marketCapA = parseFloat(a.marketCap || '0');
          const marketCapB = parseFloat(b.marketCap || '0');
          return marketCapB - marketCapA;
        });
      }

      setTokens(filteredTokens);
    }
  };

  // 应用筛选器
  const applyFilters = () => {
    setShowFilter(false);
    applyFiltersWithCustomFilters(filters);
  };

  // 检查代币是否通过筛选条件
  const passesFilter = (token: any): boolean => {
    const mcapMin = parseNumberInput(filters.mcapMin);
    const mcapMax = parseNumberInput(filters.mcapMax);
    const volumeMin = parseNumberInput(filters.volumeMin);
    const volumeMax = parseNumberInput(filters.volumeMax);

    const tokenMcap = parseFloat(token.marketCap || '0');
    // 交易量需要转换为USD值进行比较
    const tokenVolumeOKB = parseFloat(token.volume24h || '0');
    const tokenVolumeUSD = tokenVolumeOKB * okbPrice;

    // 市值筛选
    if (mcapMin > 0 && tokenMcap < mcapMin) return false;
    if (mcapMax > 0 && tokenMcap > mcapMax) return false;

    // 交易量筛选（使用USD值）
    if (volumeMin > 0 && tokenVolumeUSD < volumeMin) return false;
    if (volumeMax > 0 && tokenVolumeUSD > volumeMax) return false;

    return true;
  };

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = (): boolean => {
    return !!(filters.mcapMin || filters.mcapMax || filters.volumeMin || filters.volumeMax);
  };

  // 移除单个筛选条件
  const removeFilter = (filterKey: string) => {
    // 如果正在清除筛选，不执行任何操作
    if (isClearing) return;

    const newFilters = { ...filters, [filterKey]: "" };
    setFilters(newFilters);

    // 清除之前的setTimeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    // 使用新的筛选条件立即应用筛选
    filterTimeoutRef.current = setTimeout(() => {
      if (!isClearing) { // 再次检查是否正在清除
        applyFiltersWithCustomFilters(newFilters);
      }
      filterTimeoutRef.current = null;
    }, 100);
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
          {/* <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div> */}
          <div>
            <h2 className="text-3xl font-bold text-white font-hubot-sans">Live Tokens</h2>
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
                      ? "bg-[#D7FE11] text-black hover:bg-[#D7FE11]/90 shadow-lg"
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
              className={`relative ${hasActiveFilters()
                ? 'bg-[#D7FE11]/10 border-[#D7FE11]/50 text-[#D7FE11] hover:bg-[#D7FE11]/20'
                : 'bg-[#1a1a1a] border-gray-700 text-gray-300 hover:text-white hover:bg-[#232323]'
              }`}
              onClick={() => setShowFilter(!showFilter)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
              {hasActiveFilters() && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D7FE11] rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                </div>
              )}
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

                      {/* 滑动条 */}
                      <div className="mb-4">
                        <RangeSlider
                          min={1000}
                          max={50000000}
                          value={mcapRange}
                          onChange={handleMcapRangeChange}
                          formatValue={(value) => {
                            if (value >= 1000000) {
                              return `$${(value / 1000000).toFixed(1)}M`;
                            } else if (value >= 1000) {
                              return `$${(value / 1000).toFixed(0)}K`;
                            }
                            return `$${value}`;
                          }}
                          step={1000}
                        />
                      </div>

                      {/* 快速选择按钮 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {['10k', '100k', '1m', '10m'].map((value) => (
                          <button
                            key={value}
                            onClick={() => handleFilterChange('mcapMin', value)}
                            className="px-3 py-1 bg-[#232323] hover:bg-[#D7FE11]/20 text-gray-300 hover:text-[#D7FE11] text-xs rounded-lg transition-colors"
                          >
                            ≥ {value}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Minimum</label>
                          <input
                            type="text"
                            placeholder="e.g., 10k, 1m"
                            value={filters.mcapMin}
                            onChange={(e) => handleFilterChange('mcapMin', e.target.value)}
                            className="w-full px-3 py-2 bg-[#232323] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#D7FE11]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Maximum</label>
                          <input
                            type="text"
                            placeholder="e.g., 10k, 1m"
                            value={filters.mcapMax}
                            onChange={(e) => handleFilterChange('mcapMax', e.target.value)}
                            className="w-full px-3 py-2 bg-[#232323] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#D7FE11]"
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

                      {/* 滑动条 */}
                      <div className="mb-4">
                        <RangeSlider
                          min={0}
                          max={500000}
                          value={volumeRange}
                          onChange={handleVolumeRangeChange}
                          formatValue={(value) => {
                            if (value >= 1000000) {
                              return `$${(value / 1000000).toFixed(1)}M`;
                            } else if (value >= 1000) {
                              return `$${(value / 1000).toFixed(0)}K`;
                            }
                            return `$${value}`;
                          }}
                          step={1000}
                        />
                      </div>

                      {/* 快速选择按钮 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {['1k', '5k', '50k', '100k'].map((value) => (
                          <button
                            key={value}
                            onClick={() => handleFilterChange('volumeMin', value)}
                            className="px-3 py-1 bg-[#232323] hover:bg-[#D7FE11]/20 text-gray-300 hover:text-[#D7FE11] text-xs rounded-lg transition-colors"
                          >
                            ≥ {value}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Minimum</label>
                          <input
                            type="text"
                            placeholder="e.g., 5k, 100k"
                            value={filters.volumeMin}
                            onChange={(e) => handleFilterChange('volumeMin', e.target.value)}
                            className="w-full px-3 py-2 bg-[#232323] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#D7FE11]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Maximum</label>
                          <input
                            type="text"
                            placeholder="e.g., 5k, 100k"
                            value={filters.volumeMax}
                            onChange={(e) => handleFilterChange('volumeMax', e.target.value)}
                            className="w-full px-3 py-2 bg-[#232323] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#D7FE11]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-between items-center mt-6">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="bg-transparent border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2"
                        disabled={!hasActiveFilters()}
                      >
                        Clear All
                      </Button>
                      {hasActiveFilters() && (
                        <span className="text-xs text-gray-400">
                          {Object.values(filters).filter(v => v).length} filter(s) active
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={applyFilters}
                      className="bg-[#D7FE11] text-black hover:bg-[#5BC500] px-6 py-2 font-medium"
                    >
                      Apply Filters
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
                  ? "bg-[#D7FE11] text-black hover:bg-[#D7FE11]/90 shadow-lg"
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
                  ? "bg-[#D7FE11] text-black hover:bg-[#D7FE11]/90 shadow-lg"
                  : "bg-transparent text-gray-400 hover:text-white hover:bg-[#232323] border-0"
              }`}
              onClick={() => handleViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 结果统计 */}
      {!loading && tokens.length > 0 && (
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center space-x-4">
            <span className="text-gray-400 text-sm">
              Showing {tokens.length} token{tokens.length !== 1 ? 's' : ''}
              {hasActiveFilters() && (
                <span className="text-[#D7FE11] ml-1">(filtered)</span>
              )}
            </span>
            {isRefreshing && (
              <div className="flex items-center space-x-2 text-[#D7FE11] text-sm">
                <div className="w-3 h-3 border-2 border-[#D7FE11] border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* 活跃筛选条件显示 */}
            {hasActiveFilters() && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Filters:</span>
                {filters.mcapMin && (
                  <button
                    onClick={() => removeFilter('mcapMin')}
                    className="px-2 py-1 bg-[#D7FE11]/10 text-[#D7FE11] text-xs rounded-full hover:bg-[#D7FE11]/20 transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <span>Mcap ≥ {filters.mcapMin}</span>
                    <span className="text-[#D7FE11]/70 hover:text-[#D7FE11]">×</span>
                  </button>
                )}
                {filters.mcapMax && (
                  <button
                    onClick={() => removeFilter('mcapMax')}
                    className="px-2 py-1 bg-[#D7FE11]/10 text-[#D7FE11] text-xs rounded-full hover:bg-[#D7FE11]/20 transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <span>Mcap ≤ {filters.mcapMax}</span>
                    <span className="text-[#D7FE11]/70 hover:text-[#D7FE11]">×</span>
                  </button>
                )}
                {filters.volumeMin && (
                  <button
                    onClick={() => removeFilter('volumeMin')}
                    className="px-2 py-1 bg-[#D7FE11]/10 text-[#D7FE11] text-xs rounded-full hover:bg-[#D7FE11]/20 transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <span>Volume ≥ {filters.volumeMin}</span>
                    <span className="text-[#D7FE11]/70 hover:text-[#D7FE11]">×</span>
                  </button>
                )}
                {filters.volumeMax && (
                  <button
                    onClick={() => removeFilter('volumeMax')}
                    className="px-2 py-1 bg-[#D7FE11]/10 text-[#D7FE11] text-xs rounded-full hover:bg-[#D7FE11]/20 transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <span>Volume ≤ {filters.volumeMax}</span>
                    <span className="text-[#D7FE11]/70 hover:text-[#D7FE11]">×</span>
                  </button>
                )}
              </div>
            )}
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

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
              <div className="absolute inset-0 bg-gradient-to-br from-[#D7FE11]/5 to-transparent opacity-0 pointer-events-none"></div>
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
      ) : tokens.length === 0 ? (
        // 空状态
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center">
            {(() => {
              const option = sortOptions.find(opt => opt.value === selectedSort);
              const IconComponent = option?.icon || Filter;
              return <IconComponent className="h-10 w-10 text-gray-400" />;
            })()}
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {(() => {
              if (hasActiveFilters()) {
                return "No tokens found";
              }
              switch (selectedSort) {
                case 'newest':
                  return "No new tokens";
                case 'curved':
                  return "No tokens near graduation";
                case 'graduated':
                  return "No graduated tokens";
                case 'top-mc':
                  return "No tokens available";
                default:
                  return "No tokens found";
              }
            })()}
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {(() => {
              if (hasActiveFilters()) {
                return "No tokens match your current filter criteria. Try adjusting your filters or clearing them to see more results.";
              }
              switch (selectedSort) {
                case 'newest':
                  return "No new tokens have been created recently. Check back later for new launches.";
                case 'curved':
                  return "No tokens are currently close to graduation (80%+ progress). Check back later as tokens progress.";
                case 'graduated':
                  return "No tokens have graduated to DEX yet. Tokens will appear here once they complete the bonding curve phase.";
                case 'top-mc':
                  return "No tokens with significant market cap are available at the moment.";
                default:
                  return "No tokens are available at the moment. Please try again later.";
              }
            })()}
          </p>
          <div className="flex flex-col items-center space-y-3">
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-[#D7FE11] text-black rounded-lg hover:bg-[#5BC000] transition-colors font-medium"
              >
                Clear All Filters
              </button>
            )}
            {selectedSort === 'graduated' && (
              <button
                onClick={async () => {

                  setTokens([]);
                  setLoading(true);
                  setIsUsingAPIFallback(false);
                  clearApiCache();

                  // 直接调用 API 检查数据
                  try {
                    const response = await tokenAPI.getGraduatedTokens({ network: 'sepolia' });

                  } catch (error) {

                  }

                  // 强制重新连接 WebSocket
                  if (connectionId) {
                    websocketService.disconnect(connectionId);
                    setConnectionId(null);
                  }
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm"
              >
                Force Refresh
              </button>
            )}
          </div>
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
              onClick={() => router.push(`/token?address=${token.address}`)}
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
                ${utilsFormatNumber(parseFloat(token.marketCap || '0'))}
              </div>
              
              {/* ATH */}
              <div className="col-span-1 flex items-center text-white text-sm">
                ${formatPrice(parseFloat(token.ath || '0'))}
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
                <AnimatedVolume
                  value={parseFloat(token.volume24h || '0') * okbPrice}
                  className="text-gray-400"
                  showChangeIndicator={false}
                />
              </div>

              {/* 交易者数 */}
              <div className="col-span-1 flex items-center text-gray-400 text-sm">
                {token.holderCount || '-'}
              </div>

              {/* 24小时变化 */}
              <div className="col-span-1 flex items-center text-sm">
                <AnimatedPercentage
                  value={parseFloat(token.change24h || '0')}
                  className={parseFloat(token.change24h || '0') >= 0 ? 'text-green-400' : 'text-red-400'}
                  showChangeIndicator={true}
                />
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
                      ? 'bg-[#D7FE11] text-black'
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
              className={`group relative bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 hover:border-[#D7FE11]/50 hover:shadow-xl hover:shadow-[#D7FE11]/10 transition-all duration-300 cursor-pointer`}
              onClick={() => {
                router.push(`/token?address=${token.address}`);
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
                    ? 'bg-[#D7FE11] text-black shadow-lg'
                    : 'bg-black/20 backdrop-blur-sm text-gray-400 hover:text-white hover:bg-black/40'
                } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Star className={`h-4 w-4 ${favorites.has(token.address) ? 'fill-current' : ''} ${isFavoriteLoading ? 'animate-pulse' : ''}`} />
              </button>

              {/* 代币信息区域 */}
              <div className="flex items-start space-x-4 mb-6">
                {/* Logo - 左侧 */}
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1B1B1B] to-[#232323] flex items-center justify-center shadow-lg">
                  {token.imageUrl ? (
                    <Image
                      src={(() => {
                        // 处理图片 URL
                        if (token.imageUrl.startsWith('/media/')) {
                          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.boboom.fun';
                          return `${backendUrl}${token.imageUrl}`;
                        }
                        return token.imageUrl;
                      })()}
                      alt={`${token.name} logo`}
                      width={64}
                      height={64}
                      className="object-contain"
                      style={{ width: '64px', height: '64px' }}
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
                            router.push(`/profile/other?address=${creatorAddress}`);
                          }
                        }}
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#D7FE11]/20 to-[#5BC000]/20 flex items-center justify-center overflow-hidden">
                          {(() => {
                            const creatorInfo = creators[token.creator];
                            if (creatorInfo?.avatar_url && creatorInfo.avatar_url.trim() !== '') {
                              if (creatorInfo.avatar_url.startsWith('/media/')) {
                                return (
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}${creatorInfo.avatar_url}?t=${creatorInfo.updated_at || Date.now()}`}
                                    alt="Creator avatar"
                                    width={20}
                                    height={20}
                                    className="rounded-full object-cover"
                                    style={{ width: '20px', height: '20px' }}
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
                    <div className="text-[#D7FE11] font-bold text-lg mb-1">
                      ${utilsFormatNumber(parseFloat(token.marketCap || '0'))}
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
                        return volumeInUSD < 0.01 ? '0.00' : utilsFormatNumber(volumeInUSD);
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
                    <span className="text-[#D7FE11] font-bold text-sm">{token.graduationProgress.toFixed(1)}%</span>
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
              <div className="absolute inset-0 bg-gradient-to-br from-[#D7FE11]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
