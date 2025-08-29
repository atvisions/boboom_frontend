"use client";
import { useState } from "react";
import { ChevronDown, ToggleLeft, TrendingUp, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const tokens = [
  {
    id: 1,
    name: "Bitcoin",
    symbol: "BTC",
    logoSrc: "/tokens/btc.png",
    creatorAvatar: "👨‍💻",
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

  return (
    <div>
      {/* 筛选和排序控件 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {/* Animation 开关 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAnimationEnabled(!animationEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#70E000] focus:ring-offset-2 ${
                animationEnabled ? 'bg-[#70E000]' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  animationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-gray-300">Animation</span>
          </div>
        </div>

        {/* 排序按钮 */}
        <div className="flex space-x-2">
          {sortOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Button
                key={option.value}
                variant={selectedSort === option.value ? "default" : "outline"}
                className={
                  selectedSort === option.value
                    ? "bg-[#70E000] text-black hover:bg-[#70E000]/90 border-0"
                    : "bg-[#1B1B1B] text-white hover:bg-gray-700 border-0"
                }
                onClick={() => setSelectedSort(option.value)}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {option.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 代币网格 - 3x3 布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tokens.map((token, index) => (
          <div
            key={token.id}
            className="bg-[#151515] border border-[#232323] rounded-lg p-6 hover:bg-[#1a1a1a] hover:border-[#70E000] transition-colors cursor-pointer"
          >
            {/* 代币信息区域 */}
            <div className="flex items-start space-x-3 mb-4">
              {/* Logo - 最左侧 80x80 */}
              <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-[#1B1B1B] flex items-center justify-center">
                <Image src={token.logoSrc} alt={`${token.name} logo`} width={80} height={80} className="w-20 h-20 object-contain" />
              </div>
              
              {/* 名称和描述 - 右侧内容 */}
              <div className="flex-1 min-w-0">
                {/* 名称和符号 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">{token.name}</h3>
                    <p className="text-gray-400 text-sm">({token.symbol})</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-[10px]">{token.creatorAvatar}</span>
                    </div>
                    <span className="text-white/60 text-xs whitespace-nowrap">{token.createdAgo}</span>
                  </div>
                </div>
                
                {/* 描述 */}
                <p className="text-white/60 text-sm line-clamp-2">
                  {token.description}
                </p>
              </div>
            </div>

            {/* 市值和交易量 - 上方，交易量靠右 */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-[#70E000] font-bold">
                {token.progress}% MC: {token.marketCap}
              </div>
              <div className="text-white/60 text-sm text-right">
                {token.transactions} Txs / {token.volume} 24h VOL
              </div>
            </div>

            {/* 进度条 - 最下方 */}
            <div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-[#70E000] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${token.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
