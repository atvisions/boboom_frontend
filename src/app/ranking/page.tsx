"use client";
import { useState } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/common/SearchHeader";
import { Trophy, TrendingUp, TrendingDown, Star, Medal, Crown, Zap, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";

// 排行榜数据
const rankingData = {
  tokens: [
    {
      id: 1,
      rank: 1,
      name: "Bitcoin",
      symbol: "BTC",
      logoSrc: "/tokens/btc.png",
      creatorName: "crypto_dev",
      creatorAvatar: "👨‍💻",
      creatorAddress: "0x1234567890123456789012345678901234567890",
      marketCap: "$125M",
      volume: "$11,312",
      price: "$45,678",
      priceChange: "+12.5%",
      isPositive: true,
      holders: 12500,
      transactions: 241,
      progress: 95
    },
    {
      id: 2,
      rank: 2,
      name: "Ethereum",
      symbol: "ETH",
      logoSrc: "/tokens/eth.png",
      creatorName: "defi_master",
      creatorAvatar: "🧑‍🚀",
      creatorAddress: "0x2345678901234567890123456789012345678901",
      marketCap: "$89M",
      volume: "$8,456",
      price: "$2,345",
      priceChange: "+8.9%",
      isPositive: true,
      holders: 8900,
      transactions: 456,
      progress: 87
    },
    {
      id: 3,
      rank: 3,
      name: "Tether",
      symbol: "USDT",
      logoSrc: "/tokens/usdt.png",
      creatorName: "nft_artist",
      creatorAvatar: "🧑‍🎨",
      creatorAddress: "0x3456789012345678901234567890123456789012",
      marketCap: "$67M",
      volume: "$5,234",
      price: "$1.00",
      priceChange: "+0.1%",
      isPositive: true,
      holders: 6700,
      transactions: 189,
      progress: 78
    },
    {
      id: 4,
      rank: 4,
      name: "BNB",
      symbol: "BNB",
      logoSrc: "/tokens/bnb.png",
      creatorName: "ai_trader",
      creatorAvatar: "🤖",
      creatorAddress: "0x4567890123456789012345678901234567890123",
      marketCap: "$56M",
      volume: "$4,567",
      price: "$234",
      priceChange: "-2.3%",
      isPositive: false,
      holders: 5600,
      transactions: 324,
      progress: 72
    },
    {
      id: 5,
      rank: 5,
      name: "Dogecoin",
      symbol: "DOGE",
      logoSrc: "/tokens/doge.png",
      creatorName: "meme_king",
      creatorAvatar: "🐶",
      creatorAddress: "0x5678901234567890123456789012345678901234",
      marketCap: "$45M",
      volume: "$3,890",
      price: "$0.089",
      priceChange: "+15.7%",
      isPositive: true,
      holders: 4500,
      transactions: 567,
      progress: 68
    },
    {
      id: 6,
      rank: 6,
      name: "SpaceToken",
      symbol: "SToks",
      logoSrc: "/tokens/btc.png",
      creatorName: "space_explorer",
      creatorAvatar: "👨‍🚀",
      marketCap: "$38M",
      volume: "$2,789",
      price: "$0.156",
      priceChange: "+6.2%",
      isPositive: true,
      holders: 3800,
      transactions: 398,
      progress: 65
    },
    {
      id: 7,
      rank: 7,
      name: "PirateToken",
      symbol: "PToks",
      logoSrc: "/tokens/eth.png",
      creatorName: "crypto_pirate",
      creatorAvatar: "🏴‍☠️",
      marketCap: "$32M",
      volume: "$2,345",
      price: "$0.078",
      priceChange: "-4.1%",
      isPositive: false,
      holders: 3200,
      transactions: 276,
      progress: 58
    },
    {
      id: 8,
      rank: 8,
      name: "NinjaToken",
      symbol: "NToks",
      logoSrc: "/tokens/usdt.png",
      creatorName: "stealth_trader",
      creatorAvatar: "🥷",
      marketCap: "$28M",
      volume: "$1,987",
      price: "$0.234",
      priceChange: "+9.8%",
      isPositive: true,
      holders: 2800,
      transactions: 445,
      progress: 52
    },
    {
      id: 9,
      rank: 9,
      name: "DragonToken",
      symbol: "DToks",
      logoSrc: "/tokens/bnb.png",
      creatorName: "mythical_dev",
      creatorAvatar: "🐉",
      marketCap: "$25M",
      volume: "$1,654",
      price: "$0.345",
      priceChange: "+3.4%",
      isPositive: true,
      holders: 2500,
      transactions: 312,
      progress: 48
    },
    {
      id: 10,
      rank: 10,
      name: "MoonToken",
      symbol: "MOON",
      logoSrc: "/tokens/btc.png",
      creatorName: "lunar_dev",
      creatorAvatar: "🌙",
      marketCap: "$22M",
      volume: "$1,432",
      price: "$0.123",
      priceChange: "-1.2%",
      isPositive: false,
      holders: 2200,
      transactions: 289,
      progress: 45
    }
  ],
  creators: [
    {
      id: 1,
      rank: 1,
      name: "crypto_dev",
      avatar: "👨‍💻",
      address: "0x1234567890123456789012345678901234567890",
      totalTokens: 5,
      totalMarketCap: "$156M",
      followers: 12500,
      verified: true
    },
    {
      id: 2,
      rank: 2,
      name: "defi_master",
      avatar: "🧑‍🚀",
      address: "0x2345678901234567890123456789012345678901",
      totalTokens: 3,
      totalMarketCap: "$98M",
      followers: 8900,
      verified: true
    },
    {
      id: 3,
      rank: 3,
      name: "nft_artist",
      avatar: "🧑‍🎨",
      address: "0x3456789012345678901234567890123456789012",
      totalTokens: 4,
      totalMarketCap: "$78M",
      followers: 6700,
      verified: false
    },
    {
      id: 4,
      rank: 4,
      name: "ai_trader",
      avatar: "🤖",
      address: "0x4567890123456789012345678901234567890123",
      totalTokens: 2,
      totalMarketCap: "$67M",
      followers: 5600,
      verified: true
    },
    {
      id: 5,
      rank: 5,
      name: "meme_king",
      avatar: "🐶",
      address: "0x5678901234567890123456789012345678901234",
      totalTokens: 6,
      totalMarketCap: "$45M",
      followers: 4500,
      verified: false
    }
  ]
};

const rankingTabs = [
  { id: "tokens", label: "Token Rankings", icon: Trophy },
  { id: "creators", label: "Creator Rankings", icon: Users },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "newest", label: "Newest", icon: Clock }
];

const sortOptions = [
  { name: "Market Cap", value: "market-cap", icon: TrendingUp },
  { name: "Volume", value: "volume", icon: Zap },
  { name: "Holders", value: "holders", icon: Users }
];

export default function RankingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("tokens");
  const [selectedSort, setSelectedSort] = useState("market-cap");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const [isFavoriteLoading, debouncedToggleFavorite] = useDebounce(
    (tokenId: number, tokenName: string) => {
      const newFavorites = new Set(favorites);
      if (newFavorites.has(tokenId)) {
        newFavorites.delete(tokenId);
        toast.success(toastMessages.favorites.removed(tokenName));
      } else {
        newFavorites.add(tokenId);
        toast.success(toastMessages.favorites.added(tokenName));
      }
      setFavorites(newFavorites);
    },
    1000
  );

  const toggleFavorite = (tokenId: number, tokenName: string) => {
    debouncedToggleFavorite(tokenId, tokenName);
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
          <div className="px-6 py-6">
            {/* 标题区域 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white font-hubot-sans">Rankings</h1>
                  <p className="text-gray-400 text-sm">Top performing tokens and creators</p>
                </div>
              </div>

              {/* 排序选项 */}
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

            {/* 标签页导航 */}
            <div className="flex space-x-1 mb-8 bg-[#151515] rounded-xl p-1 border border-[#232323]">
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

            {/* 代币排行榜 */}
            {activeTab === "tokens" && (
              <div className="space-y-4">
                {rankingData.tokens.map((token) => (
                  <div
                    key={token.id}
                    className="group relative bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 hover:border-[#70E000]/50 hover:shadow-xl hover:shadow-[#70E000]/10 transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      console.log('Navigate to token details:', token.symbol);
                    }}
                  >
                    {/* 收藏按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(token.id, token.name);
                      }}
                      disabled={isFavoriteLoading}
                      className={`absolute top-4 right-4 z-10 p-2.5 rounded-full transition-all duration-200 ${
                        favorites.has(token.id)
                          ? 'bg-[#70E000] text-black shadow-lg'
                          : 'bg-black/20 backdrop-blur-sm text-gray-400 hover:text-white hover:bg-black/40'
                      } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Star className={`h-4 w-4 ${favorites.has(token.id) ? 'fill-current' : ''} ${isFavoriteLoading ? 'animate-pulse' : ''}`} />
                    </button>

                    <div className="flex items-center space-x-6">
                      {/* 排名 */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B1B1B] to-[#232323] flex items-center justify-center shadow-lg">
                        {getRankIcon(token.rank)}
                      </div>

                      {/* Logo */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1B1B1B] to-[#232323] flex items-center justify-center shadow-lg">
                        <Image src={token.logoSrc} alt={`${token.name} logo`} width={64} height={64} className="w-16 h-16 object-contain" />
                      </div>

                      {/* 代币信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-bold text-white">{token.name}</h3>
                            <span className="text-gray-400 text-sm font-medium">({token.symbol})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
                              token.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {token.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              <span className="text-xs font-medium">{token.priceChange}</span>
                            </div>
                          </div>
                        </div>

                        {/* 创建者信息 */}
                        <div className="flex items-center space-x-3 mb-3">
                          <button 
                            className="flex items-center space-x-2 hover:bg-[#232323] rounded-lg px-2 py-1 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/profile/${token.creatorAddress}`);
                            }}
                          >
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center">
                              <span className="text-xs">{token.creatorAvatar}</span>
                            </div>
                            <span className="text-gray-400 text-xs">{token.creatorName}</span>
                          </button>
                        </div>

                        {/* 市场数据 */}
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-[#70E000] font-bold text-lg">{token.marketCap}</div>
                            <div className="text-gray-400 text-xs">Market Cap</div>
                          </div>
                          <div>
                            <div className="text-white font-semibold text-lg">{token.volume}</div>
                            <div className="text-gray-400 text-xs">24h Volume</div>
                          </div>
                          <div>
                            <div className="text-white font-semibold text-lg">{token.holders.toLocaleString()}</div>
                            <div className="text-gray-400 text-xs">Holders</div>
                          </div>
                          <div>
                            <div className="text-white font-semibold text-lg">{token.price}</div>
                            <div className="text-gray-400 text-xs">Price</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 悬停效果 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#70E000]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                  </div>
                ))}
              </div>
            )}

            {/* 创建者排行榜 */}
            {activeTab === "creators" && (
              <div className="space-y-4">
                {rankingData.creators.map((creator) => (
                  <div
                    key={creator.id}
                    className="group relative bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 hover:border-[#70E000]/50 hover:shadow-xl hover:shadow-[#70E000]/10 transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      router.push(`/profile/${creator.address}`);
                    }}
                  >
                    <div className="flex items-center space-x-6">
                      {/* 排名 */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B1B1B] to-[#232323] flex items-center justify-center shadow-lg">
                        {getRankIcon(creator.rank)}
                      </div>

                      {/* 头像 */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#70E000] to-[#5BC000] flex items-center justify-center shadow-lg">
                        <span className="text-2xl">{creator.avatar}</span>
                      </div>

                      {/* 创建者信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-bold text-white">{creator.name}</h3>
                            {creator.verified && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 统计数据 */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-[#70E000] font-bold text-lg">{creator.totalTokens}</div>
                            <div className="text-gray-400 text-xs">Tokens Created</div>
                          </div>
                          <div>
                            <div className="text-white font-semibold text-lg">{creator.totalMarketCap}</div>
                            <div className="text-gray-400 text-xs">Total Market Cap</div>
                          </div>
                          <div>
                            <div className="text-white font-semibold text-lg">{creator.followers.toLocaleString()}</div>
                            <div className="text-gray-400 text-xs">Followers</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 悬停效果 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#70E000]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Trending 和 Newest 标签页可以后续添加 */}
            {(activeTab === "trending" || activeTab === "newest") && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">Coming soon...</div>
              </div>
            )}
          </div>
          
          <div className="pb-8"></div>
        </div>
      </div>
    </div>
  );
}
