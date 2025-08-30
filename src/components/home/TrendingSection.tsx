"use client";
import { useState, useEffect } from "react";
import { Flame, Share2, Info, Star, User } from "lucide-react";
import { FaXTwitter, FaTelegram, FaGlobe } from "react-icons/fa6";
import Image from "next/image";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";
import { tokenAPI, favoriteAPI } from "@/services/api";
import { useWalletAuth } from "@/hooks/useWalletAuth";

export function TrendingSection() {
  const { address, isConnected, isClient } = useWalletAuth();
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

  // 加载热门代币数据
  useEffect(() => {
    if (!isClient) return; // 只在客户端运行
    
    const loadTrendingTokens = async () => {
      try {
        setLoading(true);
        const response = await tokenAPI.getTokens({
          trending: true,
          limit: 4,
          network: 'sepolia'
        });
        
        if (response.success) {
          setTokens(response.data.tokens);
        } else {
          setError('Failed to load trending tokens');
        }
      } catch (err) {
        console.error('Error loading trending tokens:', err);
        setError('Failed to load trending tokens');
      } finally {
        setLoading(false);
      }
    };

    loadTrendingTokens();
  }, [isClient]);

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
              <div className="absolute inset-0 bg-gray-700"></div>
              <div className="relative p-6 flex flex-col items-center text-center h-full justify-center">
                <div className="w-[140px] h-[140px] rounded-2xl bg-gray-600 mb-4"></div>
                <div className="h-8 bg-gray-600 rounded mb-4 w-32"></div>
                <div className="space-y-3 mb-4 w-full">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-600 rounded w-24"></div>
                    <div className="h-4 bg-gray-600 rounded w-20"></div>
                  </div>
                  <div className="w-[300px] h-[18px] bg-gray-600 rounded-full mx-auto"></div>
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
              className="relative rounded-lg overflow-hidden group w-full max-w-[350px] h-[343px] mx-auto bg-transparent"
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
                onClick={() => toggleFavorite(token.address, token.name)}
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
                              {/* 代币Logo - 正方形圆角，无背景色 */}
              <div className="w-[140px] h-[140px] rounded-2xl flex items-center justify-center mb-4">
                <div className="text-6xl font-bold text-white">{token.symbol.slice(0, 2)}</div>
              </div>

                {/* 代币名称 */}
                <h3 className="text-2xl font-bold text-white mb-4">{token.name}</h3>

                {/* 市场数据 */}
                <div className="space-y-3 mb-4 w-full">
                  {/* 市值和交易量 - 进度条上方，一行显示 */}
                  <div className="flex justify-between items-center">
                    <div className="text-[#70E000] font-bold">
                      {token.graduationProgress.toFixed(1)}% MC: ${parseFloat(token.marketCap).toFixed(4)}
                    </div>
                    <div className="text-gray-300 text-sm text-right">
                      ${(parseFloat(token.volume24h) * okbPrice).toFixed(2)} 24h VOL
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="w-[300px] h-[18px] bg-black/90 rounded-full mx-auto">
                    <div 
                      className="bg-[#70E000] h-[18px] rounded-full transition-all duration-300"
                      style={{ width: `${token.graduationProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* 创建者信息和社交媒体图标 - 左右分布 */}
                <div className="flex items-center justify-between w-full">
                  {/* 创建者信息 - 靠左 */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                    <span className="text-gray-300 text-sm font-mono">
                      {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
                    </span>
                  </div>

                  {/* 社交媒体图标 - 靠右 */}
                  <div className="flex space-x-2">
                    <a 
                      href="#"
                      className="p-1.5 rounded-full hover:bg-[#70E000] transition-colors"
                    >
                      <FaXTwitter className="h-4 w-4 text-white" />
                    </a>
                    <a 
                      href="#"
                      className="p-1.5 rounded-full hover:bg-[#70E000] transition-colors"
                    >
                      <FaTelegram className="h-4 w-4 text-white" />
                    </a>
                    <a 
                      href="#"
                      className="p-1.5 rounded-full hover:bg-[#70E000] transition-colors"
                    >
                      <FaGlobe className="h-4 w-4 text-white" />
                    </a>
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
