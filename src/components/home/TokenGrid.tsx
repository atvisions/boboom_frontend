"use client";
import { useState, useEffect } from "react";
import { ChevronDown, ToggleLeft, TrendingUp, Clock, Zap, Star, Shield, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { tokenAPI, favoriteAPI } from "@/services/api";
import { useWalletAuth } from "@/hooks/useWalletAuth";

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
  { name: "Top MC", value: "top-mc", icon: TrendingUp }
];

export function TokenGrid() {
  const router = useRouter();
  const { address, isConnected, isClient } = useWalletAuth();
  
  // 状态初始化
  const [selectedSort, setSelectedSort] = useState("top-mc");
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 在客户端渲染后从localStorage读取持久化设置
  useEffect(() => {
    if (isClient) {
      const savedSort = localStorage.getItem('tokenGridSort');
      console.log('Loading from localStorage:', savedSort);
      if (savedSort) {
        setSelectedSort(savedSort);
        console.log('Set selectedSort to:', savedSort);
      }
      
      const savedAnimation = localStorage.getItem('tokenGridAnimation');
      if (savedAnimation !== null) {
        setAnimationEnabled(savedAnimation !== 'false');
      }
      
      setIsInitialized(true);
    }
  }, [isClient]);
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

  // 加载代币数据
  useEffect(() => {
    if (!isClient || !isInitialized) return; // 等待客户端渲染和初始化完成
    
    const loadTokens = async () => {
      try {
        setLoading(true);
        console.log('Loading tokens with sort:', selectedSort);
        
        // 根据选择的排序方式构建API参数
        let apiParams: any = {
          limit: (selectedSort === 'curved' || selectedSort === 'top-mc') ? 50 : 12, // curved和top-mc选项获取更多代币
          network: 'sepolia'
        };

        // 根据排序选项设置不同的API参数
        switch (selectedSort) {
          case 'top-mc':
            // 获取所有代币，然后在前端按市值排序
            break;
          case 'newest':
            apiParams.category = 'newly_created';
            break;
          case 'curved':
            // 获取所有代币，然后在前端过滤进度80%以上的
            break;
          default:
            break;
        }

        console.log('API params:', apiParams);
        const response = await tokenAPI.getTokens(apiParams);
        
        if (response.success) {
          let filteredTokens = response.data.tokens;
          
          // 根据排序选项处理数据
          if (selectedSort === 'curved') {
            // 过滤进度80%以上的代币
            console.log('Total tokens received:', response.data.tokens.length);
            console.log('Progress distribution:', response.data.tokens.map((t: any) => t.graduationProgress).sort((a: number, b: number) => a - b));
            filteredTokens = response.data.tokens.filter((token: any) => 
              token.graduationProgress >= 80
            );
            console.log('Filtered tokens with progress >= 80%:', filteredTokens.length);
          } else if (selectedSort === 'top-mc') {
            // 按市值排序（从高到低）
            filteredTokens = response.data.tokens.sort((a: any, b: any) => {
              const marketCapA = parseFloat(a.marketCap || '0');
              const marketCapB = parseFloat(b.marketCap || '0');
              return marketCapB - marketCapA; // 降序排列
            });
            console.log('Sorted tokens by market cap (top 12):', filteredTokens.slice(0, 12).map((t: any) => ({ name: t.name, marketCap: t.marketCap })));
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
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
                const creatorResponse = await fetch(`${backendUrl}/api/users/${creatorAddress.toLowerCase()}/`);
                if (creatorResponse.ok) {
                  const creatorData = await creatorResponse.json();
                  newCreators[creatorAddress] = creatorData;
                }
              } catch (error) {
                console.error('Failed to load creator info for:', creatorAddress, error);
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
      }
    };

    loadTokens();
  }, [selectedSort, isClient, isInitialized]);

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

  // 保存动画设置到localStorage
  const handleAnimationToggle = () => {
    const newValue = !animationEnabled;
    setAnimationEnabled(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tokenGridAnimation', newValue.toString());
    }
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
        <div className="flex items-center space-x-6">
          {/* Animation 开关 */}
          <div className="flex items-center space-x-3 bg-[#1a1a1a] rounded-xl px-4 py-2">
            <span className="text-sm text-gray-300 font-medium">Animation</span>
            <button
              onClick={handleAnimationToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#70E000] focus:ring-offset-2 focus:ring-offset-[#0E0E0E] ${
                animationEnabled ? 'bg-[#70E000] shadow-lg' : 'bg-[#232323]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 shadow-sm ${
                  animationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

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
        </div>
      </div>

      {/* 代币网格 - 响应式布局 */}
      {loading ? (
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
      ) : (
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
                  {token.imageUrl ? (
                    <Image 
                      src={token.imageUrl} 
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
                    <Image 
                      src={`/tokens/${token.symbol.toLowerCase()}.svg`}
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
                            if (creatorInfo?.avatar_url) {
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
                                  if (creatorInfo.avatar_url.includes('\\u')) {
                                    return <span className="text-xs">{JSON.parse(`"${creatorInfo.avatar_url}"`)}</span>;
                                  }
                                  if (creatorInfo.avatar_url.startsWith('\\u')) {
                                    return <span className="text-xs">{String.fromCodePoint(parseInt(creatorInfo.avatar_url.slice(2), 16))}</span>;
                                  }
                                  return <span className="text-xs">{creatorInfo.avatar_url}</span>;
                                } catch (e) {
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
                      ${(parseFloat(token.volume24h) * okbPrice).toFixed(2)}
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
