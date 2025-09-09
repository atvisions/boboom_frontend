"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, TrendingUp, TrendingDown, Zap } from "lucide-react";
import websocketService from "@/services/websocket";
import { formatDistanceToNow } from "date-fns";

type BuySellItem = { avatar: string; wallet: string; tokenLogo: string; tokenAddr: string; side: "Buy" | "Sell"; amount: string; coinName: string; tokenAmount: string };
type NewTokenItem = { tokenLogo: string; name: string; address: string; createdAgo: string };
type WhaleItem = { tokenLogo: string; name: string; address: string; amount: string };

// 默认数据
const defaultBuys: BuySellItem[] = [
  { avatar: "🧑‍🚀", wallet: "0x3F4E...A7B8", tokenLogo: "", tokenAddr: "0xC02a...6Cc2", side: "Buy", amount: "$12,340", coinName: "ShibaBNB", tokenAmount: "0.04 BNB" },
];

const defaultSells: BuySellItem[] = [
  { avatar: "🧑‍🎨", wallet: "0x9C1D...E5F6", tokenLogo: "", tokenAddr: "0xD0gE...0012", side: "Sell", amount: "$2,980", coinName: "ShibaBNB", tokenAmount: "0.12 BNB" },
];

const defaultNewTokens: NewTokenItem[] = [
  { tokenLogo: "", name: "GeoToken", address: "0xGE0...1234", createdAgo: "24m ago" },
];

const defaultWhaleTrades: WhaleItem[] = [
  { tokenLogo: "", name: "Kawaii", address: "0xKaW...9876", amount: "$512,430" },
];

export function LiveUpdatesCard() {
  // WebSocket实时数据状态
  const [buys, setBuys] = useState(defaultBuys);
  const [sells, setSells] = useState(defaultSells);
  const [news, setNews] = useState(defaultNewTokens);
  const [whales, setWhales] = useState(defaultWhaleTrades);
  const [pulse, setPulse] = useState({ buy: false, sell: false, news: false, whale: false });
  const [connectionIds, setConnectionIds] = useState<string[]>([]);

  // 格式化钱包地址
  const formatWallet = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 获取随机头像
  const getRandomAvatar = () => {
    const avatars = ["🧑‍🚀", "👨‍💻", "🧑‍🎨", "🤖", "🐶", "🦄", "🚀", "💎"];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  // 处理交易数据
  const handleTransactionData = useCallback((data: any) => {
    if (data.type === 'transaction') {
      const transaction = data.data;
      const item: BuySellItem = {
        avatar: getRandomAvatar(),
        wallet: formatWallet(transaction.user_address),
        tokenLogo: "", // 不使用默认logo，避免404错误
        tokenAddr: formatWallet(transaction.token_address),
        side: transaction.transaction_type === 'buy' ? 'Buy' : 'Sell',
        amount: `$${parseFloat(transaction.okb_amount || '0').toFixed(2)}`,
        coinName: transaction.token_symbol || 'Unknown',
        tokenAmount: `${parseFloat(transaction.token_amount || '0').toFixed(4)} ${transaction.token_symbol || ''}`
      };

      if (item.side === 'Buy') {
        setBuys([item]);
        setPulse({ buy: true, sell: false, news: false, whale: false });
      } else {
        setSells([item]);
        setPulse({ buy: false, sell: true, news: false, whale: false });
      }

      // 设置动画效果
      const rand = (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(2) + "px";
      document.documentElement.style.setProperty('--jx', rand(-20, 20));
      setTimeout(() => setPulse({ buy: false, sell: false, news: false, whale: false }), 400);
    }
  }, []);

  // 处理新代币数据
  const handleNewTokenData = useCallback((data: any) => {
    if (data.type === 'new_token') {
      const tokenData = data.data;
      const item: NewTokenItem = {
        tokenLogo: "", // 不使用默认logo，避免404错误
        name: tokenData.name || 'New Token',
        address: formatWallet(tokenData.address),
        createdAgo: formatDistanceToNow(new Date(tokenData.created_at || Date.now()), { addSuffix: true })
      };

      setNews([item]);
      setPulse({ buy: false, sell: false, news: true, whale: false });

      // 设置动画效果
      const rand = (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(2) + "px";
      document.documentElement.style.setProperty('--jx', rand(-20, 20));
      setTimeout(() => setPulse({ buy: false, sell: false, news: false, whale: false }), 400);
    }
  }, []);

  // 处理巨鲸交易数据
  const handleWhaleTradeData = useCallback((data: any) => {
    if (data.type === 'whale_transaction') {
      const transaction = data.data;
      const item: WhaleItem = {
        tokenLogo: "", // 不使用默认logo，避免404错误
        name: transaction.token_symbol || 'Whale Token',
        address: formatWallet(transaction.token_address),
        amount: `$${parseFloat(transaction.okb_amount || '0').toFixed(2)}`
      };

      setWhales([item]);
      setPulse({ buy: false, sell: false, news: false, whale: true });

      // 设置动画效果
      const rand = (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(2) + "px";
      document.documentElement.style.setProperty('--jx', rand(-20, 20));
      setTimeout(() => setPulse({ buy: false, sell: false, news: false, whale: false }), 400);
    }
  }, []);

  useEffect(() => {
    // 连接到WebSocket端点
    const transactionConnectionId = websocketService.connect('transactions/', handleTransactionData);
    const newTokenConnectionId = websocketService.connect('tokens/new/', handleNewTokenData);
    const whaleConnectionId = websocketService.connect('transactions/whale/', handleWhaleTradeData);

    setConnectionIds([transactionConnectionId, newTokenConnectionId, whaleConnectionId]);

    // 如果没有实时数据，保持原有的模拟数据更新逻辑作为备用
    const fallbackInterval = setInterval(() => {
      // 检查是否有活跃的WebSocket连接
      const hasActiveConnections = [transactionConnectionId, newTokenConnectionId, whaleConnectionId]
        .some(id => websocketService.isConnected(id));
      
      if (!hasActiveConnections) {
        // 如果没有活跃连接，使用模拟数据更新
        const types: ("buy" | "sell" | "news" | "whale")[] = ["buy", "sell", "news", "whale"];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        const rand = (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(2) + "px";
        document.documentElement.style.setProperty('--jx', rand(-20, 20));
        setPulse({ 
          buy: randomType === "buy", 
          sell: randomType === "sell", 
          news: randomType === "news", 
          whale: randomType === "whale" 
        });
        setTimeout(() => setPulse({ buy: false, sell: false, news: false, whale: false }), 400);
      }
    }, 3000);

    // 清理函数
    return () => {
      clearInterval(fallbackInterval);
      websocketService.disconnect(transactionConnectionId);
      websocketService.disconnect(newTokenConnectionId);
      websocketService.disconnect(whaleConnectionId);
    };
  }, [handleTransactionData, handleNewTokenData, handleWhaleTradeData]);

  return (
    <div className="relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
      
      <div className="flex gap-6 py-6 px-2 overflow-x-auto">
        {/* 买入卡片 */}
        {buys.length > 0 && (
        <div className={`relative w-80 rounded-2xl p-6 bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-green-900/50 backdrop-blur-sm border border-emerald-500/20 cursor-pointer hover:scale-105 transition-all duration-300 ${pulse.buy ? 'jitter-on' : ''} fade-in group flex-shrink-0`}>
          {/* 发光效果 */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* 顶部状态指示器 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-300 text-xs font-medium uppercase tracking-wider">Live Buy</span>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400 animate-bounce" />
          </div>

          <div className="flex items-center space-x-4">
            {/* 左侧头像和代币图标 */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center ring-4 ring-emerald-400/30 shadow-lg">
                <span className="text-2xl">{buys[0].avatar}</span>
              </div>
              {/* 代币图标覆盖层 */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 border-2 border-emerald-400 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{buys[0].coinName?.slice(0, 2) || "??"}</span>
              </div>
            </div>

            {/* 右侧信息区域 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm truncate">{buys[0].wallet}</span>
                <div className="bg-emerald-500 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  BOUGHT
                </div>
              </div>
              <div className="text-emerald-200 text-sm font-medium">{buys[0].tokenAmount}</div>
              <div className="text-white/70 text-xs">{buys[0].coinName}</div>
            </div>
          </div>
        </div>)}

        {/* 卖出卡片 */}
        {sells.length > 0 && (
        <div className={`relative w-80 rounded-2xl p-6 bg-gradient-to-br from-red-900/40 via-red-800/30 to-rose-900/50 backdrop-blur-sm border border-red-500/20 cursor-pointer hover:scale-105 transition-all duration-300 ${pulse.sell ? 'jitter-on' : ''} fade-in group flex-shrink-0`}>
          {/* 发光效果 */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400/20 to-rose-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* 顶部状态指示器 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-red-300 text-xs font-medium uppercase tracking-wider">Live Sell</span>
            </div>
            <TrendingDown className="w-5 h-5 text-red-400 animate-bounce" />
          </div>

          <div className="flex items-center space-x-4">
            {/* 左侧头像和代币图标 */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center ring-4 ring-red-400/30 shadow-lg">
                <span className="text-2xl">{sells[0].avatar}</span>
              </div>
              {/* 代币图标覆盖层 */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 border-2 border-red-400 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{sells[0].coinName?.slice(0, 2) || "??"}</span>
              </div>
            </div>

            {/* 右侧信息区域 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm truncate">{sells[0].wallet}</span>
                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  SOLD
                </div>
              </div>
              <div className="text-red-200 text-sm font-medium">{sells[0].tokenAmount}</div>
              <div className="text-white/70 text-xs">{sells[0].coinName}</div>
            </div>
          </div>
        </div>)}

        {/* 新代币卡片 */}
        {news.length > 0 && (
        <div className={`relative w-80 rounded-2xl p-6 bg-gradient-to-br from-blue-900/40 via-indigo-800/30 to-purple-900/50 backdrop-blur-sm border border-blue-500/20 cursor-pointer hover:scale-105 transition-all duration-300 ${pulse.news ? 'jitter-on' : ''} fade-in group flex-shrink-0`}>
          {/* 发光效果 */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* 顶部状态指示器 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-300 text-xs font-medium uppercase tracking-wider">New Token</span>
            </div>
            <Zap className="w-5 h-5 text-blue-400 animate-bounce" />
          </div>

          <div className="flex items-center space-x-4">
            {/* 左侧图标 */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-4 ring-blue-400/30 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              {/* 新代币标识 */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 border-2 border-blue-400 flex items-center justify-center">
                <span className="text-xs font-bold text-white">NEW</span>
              </div>
            </div>

            {/* 右侧信息区域 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm truncate">{news[0].name}</span>
                <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  LAUNCHED
                </div>
              </div>
              <div className="text-blue-200 text-sm font-medium">{news[0].address}</div>
              <div className="text-white/70 text-xs">{news[0].createdAgo}</div>
            </div>
          </div>
        </div>)}

        {/* 巨鲸交易卡片 */}
        {whales.length > 0 && (
        <div className={`relative w-80 rounded-2xl p-6 bg-gradient-to-br from-purple-900/40 via-violet-800/30 to-fuchsia-900/50 backdrop-blur-sm border border-purple-500/20 cursor-pointer hover:scale-105 transition-all duration-300 ${pulse.whale ? 'jitter-on' : ''} fade-in group flex-shrink-0`}>
          {/* 发光效果 */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-violet-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* 顶部状态指示器 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-purple-300 text-xs font-medium uppercase tracking-wider">Whale Alert</span>
            </div>
            <Zap className="w-5 h-5 text-purple-400 animate-bounce" />
          </div>

          <div className="flex items-center space-x-4">
            {/* 左侧图标 */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center ring-4 ring-purple-400/30 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              {/* 巨鲸标识 */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 border-2 border-purple-400 flex items-center justify-center">
                <span className="text-xs font-bold text-white">🐋</span>
              </div>
            </div>

            {/* 右侧信息区域 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm truncate">{whales[0].name}</span>
                <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  WHALE
                </div>
              </div>
              <div className="text-purple-200 text-sm font-medium">{whales[0].amount}</div>
              <div className="text-white/70 text-xs">{whales[0].address}</div>
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
