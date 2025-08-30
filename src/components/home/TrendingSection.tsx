"use client";
import { useState } from "react";
import { Flame, Share2, Info, Star, User } from "lucide-react";
import { FaXTwitter, FaTelegram, FaGlobe } from "react-icons/fa6";
import Image from "next/image";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";

const trendingTokens = [
  {
    id: 1,
    name: "WowDogecoin",
    logo: "🐕",
    marketCap: "$156.8M",
    volume: "$89,542",
    transactions: "241",
    bondingProgress: 78,
    twitter: "#",
    telegram: "#",
    website: "#",
    creator: {
      avatar: "👨‍💻",
      address: "0x7A8B...C9D2"
    }
  },
  {
    id: 2,
    name: "Shibalnu",
    logo: "🦊",
    marketCap: "$89.4M",
    volume: "$72,831",
    transactions: "456",
    bondingProgress: 65,
    twitter: "#",
    telegram: "#",
    website: "#",
    creator: {
      avatar: "👩‍🎨",
      address: "0x3F4E...A7B8"
    }
  },
  {
    id: 3,
    name: "PepeBNB",
    logo: "🐸",
    marketCap: "$124.7M",
    volume: "$95,127",
    transactions: "567",
    bondingProgress: 92,
    twitter: "#",
    telegram: "#",
    website: "#",
    creator: {
      avatar: "🧑‍🔬",
      address: "0x9C1D...E5F6"
    }
  },
  {
    id: 4,
    name: "MoonToken",
    logo: "🌙",
    marketCap: "$98.2M",
    volume: "$67,345",
    transactions: "398",
    bondingProgress: 85,
    twitter: "#",
    telegram: "#",
    website: "#",
    creator: {
      avatar: "👨‍🚀",
      address: "0x2B8C...F1A3"
    }
  }
];

export function TrendingSection() {
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
    <div className="mb-8 px-6">
      {/* 标题 */}
      <div className="flex items-center space-x-2 mb-6">
        <Flame className="h-6 w-6 text-orange-500" />
        <h2 className="text-2xl font-bold text-white font-hubot-sans">Trending Now</h2>
      </div>

      {/* 热门代币卡片 - 响应式布局，考虑侧边栏宽度，最多显示4个 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {trendingTokens.map((token) => (
          <div
            key={token.id}
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
              onClick={() => toggleFavorite(token.id, token.name)}
              disabled={isFavoriteLoading}
              className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${
                favorites.has(token.id)
                  ? 'bg-[#70E000] text-black'
                  : 'bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white'
              } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Star 
                className={`h-5 w-5 ${favorites.has(token.id) ? 'fill-current' : ''} ${isFavoriteLoading ? 'animate-pulse' : ''}`}
              />
            </button>

            {/* 内容 */}
            <div className="relative p-6 flex flex-col items-center text-center h-full justify-center">
              {/* 代币Logo - 正方形圆角，无背景色 */}
              <div className="w-[140px] h-[140px] rounded-2xl flex items-center justify-center mb-4">
                <div className="text-6xl">{token.logo}</div>
              </div>

              {/* 代币名称 */}
              <h3 className="text-2xl font-bold text-white mb-4">{token.name}</h3>

              {/* 市场数据 */}
              <div className="space-y-3 mb-4 w-full">
                {/* 市值和交易量 - 进度条上方，一行显示 */}
                <div className="flex justify-between items-center">
                  <div className="text-[#70E000] font-bold">
                    {token.bondingProgress}% MC: {token.marketCap}
                  </div>
                  <div className="text-gray-300 text-sm text-right">
                    {token.volume} 24h VOL
                  </div>
                </div>

                {/* 进度条 */}
                <div className="w-[300px] h-[18px] bg-black/90 rounded-full mx-auto">
                  <div 
                    className="bg-[#70E000] h-[18px] rounded-full transition-all duration-300"
                    style={{ width: `${token.bondingProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* 创建者信息和社交媒体图标 - 左右分布 */}
              <div className="flex items-center justify-between w-full">
                {/* 创建者信息 - 靠左 */}
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-sm">{token.creator.avatar}</span>
                  </div>
                  <span className="text-gray-300 text-sm font-mono">
                    {token.creator.address}
                  </span>
                </div>

                {/* 社交媒体图标 - 靠右 */}
                <div className="flex space-x-2">
                  <a 
                    href={token.twitter}
                    className="p-1.5 rounded-full hover:bg-[#70E000] transition-colors"
                  >
                    <FaXTwitter className="h-4 w-4 text-white" />
                  </a>
                  <a 
                    href={token.telegram}
                    className="p-1.5 rounded-full hover:bg-[#70E000] transition-colors"
                  >
                    <FaTelegram className="h-4 w-4 text-white" />
                  </a>
                  <a 
                    href={token.website}
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
    </div>
  );
}
