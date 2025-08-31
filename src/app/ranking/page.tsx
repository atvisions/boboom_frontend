"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/common/SearchHeader";
import { Trophy, TrendingUp, TrendingDown, Star, Medal, Crown, Zap, Users, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useRouter } from "next/navigation";
import { tokenAPI, userAPI, favoriteAPI } from "@/services/api";
import { useWalletAuth } from "@/hooks/useWalletAuth";

const rankingTabs = [
  { id: "tokens", label: "Token Rankings", icon: Trophy },
  { id: "creators", label: "Creator Rankings", icon: Users }
];

const tokenSortOptions = [
  { name: "Market Cap", value: "market-cap", icon: TrendingUp },
  { name: "Volume", value: "volume", icon: Zap },
  { name: "Favorites", value: "favorites", icon: Star }
];

const creatorSortOptions = [
  { name: "Followers", value: "followers", icon: Users },
  { name: "Holdings", value: "holdings", icon: TrendingUp }
];

export default function RankingPage() {
  const router = useRouter();
  const { address, isConnected, isClient } = useWalletAuth();
  const [activeTab, setActiveTab] = useState("tokens");
  const [tokenSort, setTokenSort] = useState("market-cap");
  const [creatorSort, setCreatorSort] = useState("followers");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // 数据状态
  const [tokens, setTokens] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [okbPrice, setOkbPrice] = useState<number>(177.6);
  const [creatorInfo, setCreatorInfo] = useState<{[key: string]: any}>({}); // 存储创作者详细信息

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

  // 加载排行榜数据
  useEffect(() => {
    if (!isClient) return;
    
    const loadRankingData = async () => {
      try {
        setLoading(true);
        
        if (activeTab === "tokens") {
          // 加载代币排行榜数据
          const response = await tokenAPI.getTokens({
            limit: 50,
            network: 'sepolia'
          });
          
          if (response.success) {
            let sortedTokens = response.data.tokens;
            
            // 根据排序选项排序
            switch (tokenSort) {
              case 'market-cap':
                sortedTokens = sortedTokens.sort((a: any, b: any) => 
                  parseFloat(b.marketCap || '0') - parseFloat(a.marketCap || '0')
                );
                break;
              case 'volume':
                sortedTokens = sortedTokens.sort((a: any, b: any) => 
                  parseFloat(b.volume24h || '0') - parseFloat(a.volume24h || '0')
                );
                break;
              case 'favorites':
                // 这里需要后端提供收藏数量字段，暂时按市值排序
                sortedTokens = sortedTokens.sort((a: any, b: any) => 
                  parseFloat(b.marketCap || '0') - parseFloat(a.marketCap || '0')
                );
                break;
            }
            
            setTokens(sortedTokens);
            
            // 加载代币创作者信息
            const creatorAddresses = sortedTokens
              .map((token: any) => token.creator)
              .filter((creator: any) => creator && typeof creator === 'string');
            
            const loadCreators = async () => {
              const newCreatorInfo: {[key: string]: any} = {};
              
              for (const creatorAddress of creatorAddresses) {
                try {
                  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
                  const creatorResponse = await fetch(`${backendUrl}/api/users/${creatorAddress.toLowerCase()}/`);
                  if (creatorResponse.ok) {
                    const creatorData = await creatorResponse.json();
                    newCreatorInfo[creatorAddress] = creatorData;
                  }
                } catch (error) {
                  console.error('Failed to load creator info for:', creatorAddress, error);
                }
              }
              
              setCreatorInfo(newCreatorInfo);
            };
            
            loadCreators();
          } else {
            setError('Failed to load token rankings');
          }
        } else if (activeTab === "creators") {
          // 加载创建者排行榜数据 - 使用真实API
          const response = await userAPI.getCreatorsRanking({
            sort_by: creatorSort,
            limit: 50,
            network: 'sepolia'
          });
          
          if (response.success) {
            setCreators(response.data.users);
          } else {
            setError('Failed to load creator rankings');
          }
        }
      } catch (err) {
        console.error('Error loading ranking data:', err);
        setError('Failed to load ranking data');
      } finally {
        setLoading(false);
      }
    };

    loadRankingData();
  }, [activeTab, tokenSort, creatorSort, isClient]);

  // 加载用户收藏状态
  useEffect(() => {
    if (!isClient || !isConnected || !address || tokens.length === 0) return;

    const loadFavoriteStatus = async () => {
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

  const [isFavoriteLoading, setFavoriteLoading] = useState<Set<string>>(new Set());

  const handleFavoriteToggle = async (tokenAddress: string, tokenName: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setFavoriteLoading(prev => new Set(prev).add(tokenAddress));

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
    } finally {
      setFavoriteLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(tokenAddress);
        return newSet;
      });
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-gray-400 font-bold">{rank}</span>;
  };

  return (
    <div className="flex h-screen bg-[#0E0E0E]">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        <SearchHeader />
        
        <div className="flex-1 overflow-y-auto bg-[#0E0E0E]">
          <div className="px-6 py-6 max-w-7xl mx-auto">
            {/* 标题区域 */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-hubot-sans">Rankings</h1>
                <p className="text-gray-400 text-sm">Top performing tokens and creators</p>
              </div>
            </div>

            {/* 标签页导航和排序选项 - 最高层级 */}
            <div className="flex items-center justify-between mb-6">
              {/* 标签页导航 */}
              <div className="flex space-x-1 bg-[#151515] rounded-xl p-1 border border-[#232323]">
                {rankingTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-[#70E000] text-black shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-[#232323]"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* 排序选项 - 右侧 */}
              {activeTab === "tokens" && (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 text-sm font-medium">Sort by:</span>
                  <div className="flex space-x-2 bg-[#1a1a1a] rounded-xl p-1">
                    {tokenSortOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <Button
                          key={option.value}
                          variant={tokenSort === option.value ? "default" : "outline"}
                          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                            tokenSort === option.value
                              ? "bg-[#70E000] text-black hover:bg-[#70E000]/90 shadow-lg"
                              : "bg-transparent text-gray-400 hover:text-white hover:bg-[#232323] border-0"
                          }`}
                          onClick={() => setTokenSort(option.value)}
                        >
                          <IconComponent className="h-4 w-4 mr-2" />
                          {option.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "creators" && (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 text-sm font-medium">Sort by:</span>
                  <div className="flex space-x-2 bg-[#1a1a1a] rounded-xl p-1">
                    {creatorSortOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <Button
                          key={option.value}
                          variant={creatorSort === option.value ? "default" : "outline"}
                          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                            creatorSort === option.value
                              ? "bg-[#70E000] text-black hover:bg-[#70E000]/90 shadow-lg"
                              : "bg-transparent text-gray-400 hover:text-white hover:bg-[#232323] border-0"
                          }`}
                          onClick={() => setCreatorSort(option.value)}
                        >
                          <IconComponent className="h-4 w-4 mr-2" />
                          {option.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 代币排行榜 */}
            {activeTab === "tokens" && (
              <div className="space-y-4">
                {loading ? (
                  // 骨架屏
                  [...Array(10)].map((_, index) => (
                    <div key={index} className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 animate-pulse">
                      <div className="flex items-center space-x-6">
                        <div className="w-12 h-12 bg-gray-700 rounded-2xl"></div>
                        <div className="w-16 h-16 bg-gray-700 rounded-2xl"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-6 bg-gray-700 rounded w-32"></div>
                          <div className="h-4 bg-gray-700 rounded w-24"></div>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="h-6 bg-gray-700 rounded"></div>
                            <div className="h-6 bg-gray-700 rounded"></div>
                            <div className="h-6 bg-gray-700 rounded"></div>
                            <div className="h-6 bg-gray-700 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
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
                  tokens.map((token, index) => (
                    <div
                      key={token.address}
                      className="group relative bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 hover:border-[#70E000]/50 hover:shadow-xl hover:shadow-[#70E000]/10 transition-all duration-300 cursor-pointer"
                      onClick={() => router.push(`/token/${token.address}`)}
                    >
                      {/* 收藏按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteToggle(token.address, token.name);
                        }}
                        disabled={isFavoriteLoading.has(token.address)}
                        className={`absolute top-4 right-4 z-10 p-2.5 rounded-full transition-all duration-200 ${
                          favorites.has(token.address)
                            ? 'bg-[#70E000] text-black shadow-lg'
                            : 'bg-black/20 backdrop-blur-sm text-gray-400 hover:text-white hover:bg-black/40'
                        } ${isFavoriteLoading.has(token.address) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Star className={`h-4 w-4 ${favorites.has(token.address) ? 'fill-current' : ''} ${isFavoriteLoading.has(token.address) ? 'animate-pulse' : ''}`} />
                      </button>

                      <div className="flex items-center space-x-6">
                        {/* 排名 */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B1B1B] to-[#232323] flex items-center justify-center shadow-lg">
                          {getRankIcon(index + 1)}
                        </div>

                        {/* Logo */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1B1B1B] to-[#232323] flex items-center justify-center shadow-lg">
                          {token.imageUrl ? (
                            <Image 
                              src={token.imageUrl} 
                              alt={`${token.name} logo`} 
                              width={64} 
                              height={64} 
                              className="w-16 h-16 object-contain"
                              unoptimized={true}
                            />
                          ) : (
                            <span className="text-2xl font-bold text-white">{token.symbol.slice(0, 2)}</span>
                          )}
                        </div>

                        {/* 代币信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
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

                          </div>

                          {/* 创建者信息 */}
                          <div className="flex items-center space-x-3 mb-3">
                            <button 
                              className="flex items-center space-x-2 hover:bg-[#232323] rounded-lg px-2 py-1 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/profile/${token.creator}`);
                              }}
                            >
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center overflow-hidden">
                                {(() => {
                                  const creatorData = creatorInfo[token.creator];
                                  if (creatorData?.avatar_url) {
                                    if (creatorData.avatar_url.startsWith('/media/')) {
                                      return (
                                        <Image 
                                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}${creatorData.avatar_url}?t=${creatorData.updated_at || Date.now()}`}
                                          alt="Creator avatar" 
                                          width={20} 
                                          height={20} 
                                          className="w-5 h-5 rounded-full object-cover"
                                          unoptimized={true}
                                        />
                                      );
                                    } else {
                                      try {
                                        if (creatorData.avatar_url.includes('\\u')) {
                                          return <span className="text-xs">{JSON.parse(`"${creatorData.avatar_url}"`)}</span>;
                                        }
                                        if (creatorData.avatar_url.startsWith('\\u')) {
                                          return <span className="text-xs">{String.fromCodePoint(parseInt(creatorData.avatar_url.slice(2), 16))}</span>;
                                        }
                                        return <span className="text-xs">{creatorData.avatar_url}</span>;
                                      } catch (e) {
                                        return <span className="text-xs">{creatorData.avatar_url}</span>;
                                      }
                                    }
                                  }
                                  return <span className="text-xs">👤</span>;
                                })()}
                              </div>
                              <span className="text-gray-400 text-xs">
                                {(() => {
                                  const creatorData = creatorInfo[token.creator];
                                  if (creatorData?.username) {
                                    return creatorData.username;
                                  }
                                  if (creatorData?.display_name) {
                                    return creatorData.display_name;
                                  }
                                  if (typeof token.creator === 'string') {
                                    return `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}`;
                                  }
                                  return 'Creator';
                                })()}
                              </span>
                            </button>
                          </div>

                          {/* 市场数据 */}
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <div className="text-[#70E000] font-bold text-lg">${parseFloat(token.marketCap || '0').toFixed(2)}</div>
                              <div className="text-gray-400 text-xs">Market Cap</div>
                            </div>
                            <div>
                              <div className="text-white font-semibold text-lg">${(parseFloat(token.volume24h || '0') * okbPrice).toFixed(2)}</div>
                              <div className="text-gray-400 text-xs">24h Volume</div>
                            </div>
                            <div>
                              <div className="text-white font-semibold text-lg">{token.holderCount?.toLocaleString() || '0'}</div>
                              <div className="text-gray-400 text-xs">Holders</div>
                            </div>
                            <div>
                              <div className="text-white font-semibold text-lg">${(parseFloat(token.currentPrice || '0') * okbPrice).toFixed(6)}</div>
                              <div className="text-gray-400 text-xs">Price</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 悬停效果 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#70E000]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 创建者排行榜 */}
            {activeTab === "creators" && (
              <div className="space-y-4">
                {loading ? (
                  // 骨架屏
                  [...Array(10)].map((_, index) => (
                    <div key={index} className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 animate-pulse">
                      <div className="flex items-center space-x-6">
                        <div className="w-12 h-12 bg-gray-700 rounded-2xl"></div>
                        <div className="w-16 h-16 bg-gray-700 rounded-2xl"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-6 bg-gray-700 rounded w-32"></div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="h-6 bg-gray-700 rounded"></div>
                            <div className="h-6 bg-gray-700 rounded"></div>
                            <div className="h-6 bg-gray-700 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
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
                  creators.map((creator, index) => (
                    <div
                      key={creator.address}
                      className="group relative bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 hover:border-[#70E000]/50 hover:shadow-xl hover:shadow-[#70E000]/10 transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        router.push(`/profile/${creator.address}`);
                      }}
                    >
                      <div className="flex items-center space-x-6">
                        {/* 排名 */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B1B1B] to-[#232323] flex items-center justify-center shadow-lg">
                          {getRankIcon(index + 1)}
                        </div>

                        {/* 头像 */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center shadow-lg">
                          {creator.avatar_url ? (
                            creator.avatar_url.startsWith('/media/') ? (
                              <img 
                                src={creator.avatar_url} 
                                alt="Avatar" 
                                className="w-full h-full rounded-2xl object-cover"
                              />
                            ) : (
                              <span className="text-2xl">{creator.avatar_url}</span>
                            )
                          ) : (
                            <span className="text-2xl">👤</span>
                          )}
                        </div>

                        {/* 创建者信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-xl font-bold text-white">{creator.username || 'Anonymous'}</h3>
                              {creator.is_verified && (
                                <div className="relative group/icon">
                                  <div className="flex items-center justify-center cursor-help">
                                    <BadgeCheck className="w-4 h-4 text-[#70E000]" />
                                  </div>
                                  {/* 悬停提示 */}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                    Verified Creator
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 统计数据 */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-[#70E000] font-bold text-lg">{creator.tokens_created || 0}</div>
                              <div className="text-gray-400 text-xs">Tokens Created</div>
                            </div>
                            <div>
                              <div className="text-white font-semibold text-lg">{creator.followers_count || 0}</div>
                              <div className="text-gray-400 text-xs">Followers</div>
                            </div>
                            <div>
                              <div className="text-white font-semibold text-lg">${(creator.total_holdings || 0).toLocaleString()}</div>
                              <div className="text-gray-400 text-xs">Total Holdings</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 悬停效果 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#70E000]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          <div className="pb-8"></div>
        </div>
      </div>
    </div>
  );
}
