"use client";
import { useState } from "react";
import { ChevronDown, ToggleLeft, TrendingUp, Clock, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";

const tokens = [
  {
    id: 1,
    name: "Bitcoin",
    symbol: "BTC",
    logoSrc: "/tokens/btc.png",
    creatorAvatar: "👨‍💻",
    creatorName: "crypto_dev",
    createdAgo: "24m ago",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    progress: 35,
    marketCap: "$125M",
    volume: "$11,312",
    transactions: "241"
  },
  {
    id: 2,
    name: "Ethereum",
    symbol: "ETH",
    logoSrc: "/tokens/eth.png",
    creatorAvatar: "🧑‍🚀",
    creatorName: "defi_master",
    createdAgo: "24m ago",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    progress: 67,
    marketCap: "$78,241",
    volume: "$2,156,892",
    transactions: "456"
  },
  {
    id: 3,
    name: "Tether",
    symbol: "USDT",
    logoSrc: "/tokens/usdt.png",
    creatorAvatar: "🧑‍🎨",
    creatorName: "nft_artist",
    createdAgo: "1h ago",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    progress: 42,
    marketCap: "$23,567",
    volume: "$892,134",
    transactions: "189"
  },
  {
    id: 4,
    name: "BNB",
    symbol: "BNB",
    logoSrc: "/tokens/bnb.png",
    creatorAvatar: "🤖",
    creatorName: "ai_trader",
    createdAgo: "12m ago",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    progress: 78,
    marketCap: "$67,423",
    volume: "$1,567,892",
    transactions: "324"
  },
  {
    id: 5,
    name: "Dogecoin",
    symbol: "DOGE",
    logoSrc: "/tokens/doge.png",
    creatorAvatar: "🐶",
    creatorName: "meme_king",
    createdAgo: "5m ago",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    progress: 92,
    marketCap: "$134,789",
    volume: "$3,245,167",
    transactions: "567"
  },
  {
    id: 6,
    name: "SpaceToken",
    symbol: "SToks",
    logoSrc: "/tokens/btc.png",
    creatorAvatar: "👨‍🚀",
    creatorName: "space_explorer",
    createdAgo: "2h ago",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    progress: 58,
    marketCap: "$98,456",
    volume: "$2,789,345",
    transactions: "398"
  },
  {
    id: 7,
    name: "PirateToken",
    symbol: "PToks",
    logoSrc: "/tokens/eth.png",
    creatorAvatar: "🏴‍☠️",
    creatorName: "crypto_pirate",
    createdAgo: "18m ago",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    progress: 45,
    marketCap: "$56,789",
    volume: "$1,234,567",
    transactions: "276"
  },
  {
    id: 8,
    name: "NinjaToken",
    symbol: "NToks",
    logoSrc: "/tokens/usdt.png",
    creatorAvatar: "🥷",
    creatorName: "stealth_trader",
    createdAgo: "9m ago",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    progress: 83,
    marketCap: "$112,345",
    volume: "$2,987,654",
    transactions: "445"
  },
  {
    id: 9,
    name: "DragonToken",
    symbol: "DToks",
    logoSrc: "/tokens/bnb.png",
    creatorAvatar: "🐉",
    creatorName: "mythical_dev",
    createdAgo: "3h ago",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    progress: 61,
    marketCap: "$87,234",
    volume: "$1,876,543",
    transactions: "312"
  }
];

const sortOptions = [
  { name: "Top MC", value: "top-mc", icon: TrendingUp },
  { name: "Newest", value: "newest", icon: Clock },
  { name: "Curved", value: "curved", icon: Zap }
];

export function TokenGrid() {
  const [selectedSort, setSelectedSort] = useState("top-mc");
  const [animationEnabled, setAnimationEnabled] = useState(true);
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {tokens.map((token, index) => (
          <div
            key={token.id}
            className={`group relative bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 hover:border-[#70E000]/50 hover:shadow-xl hover:shadow-[#70E000]/10 transition-all duration-300 cursor-pointer ${
              favorites.has(token.id) ? 'border-[#70E000] shadow-lg shadow-[#70E000]/20' : ''
            }`}
            onClick={() => {
              // TODO: 跳转到代币详情页面
              console.log('Navigate to token details:', token.symbol);
            }}
          >
            {/* 收藏按钮 - 右上角 */}
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

            {/* 代币信息区域 */}
            <div className="flex items-start space-x-4 mb-6">
              {/* Logo - 左侧 */}
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1B1B1B] to-[#232323] flex items-center justify-center shadow-lg">
                <Image src={token.logoSrc} alt={`${token.name} logo`} width={64} height={64} className="w-16 h-16 object-contain" />
              </div>
              
              {/* 名称和创建者信息 - 右侧内容 */}
              <div className="flex-1 min-w-0">
                {/* 名称和符号 */}
                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold text-white">{token.name}</h3>
                    <span className="text-gray-400 text-sm font-medium">({token.symbol})</span>
                  </div>
                  
                  {/* 创建者信息 */}
                  <div className="flex items-center space-x-3">
                    <button 
                      className="flex items-center space-x-2 hover:bg-[#232323] rounded-lg px-2 py-1 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: 跳转到创建者页面
                        console.log('Navigate to creator profile:', token.creatorName);
                      }}
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center">
                        <span className="text-xs">{token.creatorAvatar}</span>
                      </div>
                      <span className="text-gray-400 text-xs">{token.creatorName}</span>
                    </button>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-gray-400 text-xs">{token.createdAgo}</span>
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
                    {token.marketCap}
                  </div>
                  <div className="text-gray-400 text-xs">
                    Market Cap
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold text-lg mb-1">
                    {token.volume}
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
                  <span className="text-[#70E000] font-bold text-sm">{token.progress}%</span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#70E000] to-[#5BC000] h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${token.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 悬停效果 */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#70E000]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
