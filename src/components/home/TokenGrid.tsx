"use client";
import { useState, useEffect } from "react";
import { ChevronDown, ToggleLeft, TrendingUp, Clock, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { tokenAPI, favoriteAPI } from "@/services/api";
import { useWalletAuth } from "@/hooks/useWalletAuth";

const sortOptions = [
  { name: "Top MC", value: "top-mc", icon: TrendingUp },
  { name: "Newest", value: "newest", icon: Clock },
  { name: "Curved", value: "curved", icon: Zap }
];

export function TokenGrid() {
  const router = useRouter();
  const { address, isConnected, isClient } = useWalletAuth();
  const [selectedSort, setSelectedSort] = useState("top-mc");
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [okbPrice, setOkbPrice] = useState<number>(177.6); // 默认OKB价格

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
    if (!isClient) return; // 只在客户端运行
    
    const loadTokens = async () => {
      try {
        setLoading(true);
        
        // 根据选择的排序方式构建API参数
        let apiParams: any = {
          limit: 12,
          network: 'sepolia'
        };

        // 根据排序选项设置不同的API参数
        switch (selectedSort) {
          case 'top-mc':
            apiParams.category = 'top_gainers';
            break;
          case 'newest':
            apiParams.category = 'newly_created';
            break;
          case 'curved':
            apiParams.phase = 'CURVE';
            break;
          default:
            break;
        }

        const response = await tokenAPI.getTokens(apiParams);
        
        if (response.success) {
          setTokens(response.data.tokens);
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
  }, [selectedSort, isClient]);

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
              onClick={() => setAnimationEnabled(!animationEnabled)}
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
                  onClick={() => setSelectedSort(option.value)}
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
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-4"></div>
              <div className="h-6 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-700 rounded"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {tokens.map((token, index) => (
            <div
              key={token.address}
              className={`group relative bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 hover:border-[#70E000]/50 hover:shadow-xl hover:shadow-[#70E000]/10 transition-all duration-300 cursor-pointer ${
                favorites.has(token.address) ? 'border-[#70E000] shadow-lg shadow-[#70E000]/20' : ''
              }`}
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
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 创建者信息 */}
                    <div className="flex items-center space-x-3">
                      <button 
                        className="flex items-center space-x-2 hover:bg-[#232323] rounded-lg px-2 py-1 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/profile/${token.creator}`);
                        }}
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center">
                          <span className="text-xs">👤</span>
                        </div>
                        <span className="text-gray-400 text-xs">Creator</span>
                      </button>
                      <span className="text-gray-400 text-xs">•</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(token.createdAt).toLocaleDateString()}
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
                  <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#70E000] to-[#5BC000] h-3 rounded-full transition-all duration-500 shadow-sm"
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
