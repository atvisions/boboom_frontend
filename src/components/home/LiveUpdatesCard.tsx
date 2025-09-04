"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, ArrowDownRight, Sparkles, Landmark } from "lucide-react";
import websocketService from "@/services/websocket";
import { formatDistanceToNow } from "date-fns";

type BuySellItem = { avatar: string; wallet: string; tokenLogo: string; tokenAddr: string; side: "Buy" | "Sell"; amount: string; coinName: string; tokenAmount: string };
type NewTokenItem = { tokenLogo: string; name: string; address: string; createdAgo: string };
type WhaleItem = { tokenLogo: string; name: string; address: string; amount: string };

// 默认数据
const defaultBuys: BuySellItem[] = [
  { avatar: "🧑‍🚀", wallet: "0x3F4E...A7B8", tokenLogo: "/tokens/eth.png", tokenAddr: "0xC02a...6Cc2", side: "Buy", amount: "$12,340", coinName: "ShibaBNB", tokenAmount: "0.04 BNB" },
];

const defaultSells: BuySellItem[] = [
  { avatar: "🧑‍🎨", wallet: "0x9C1D...E5F6", tokenLogo: "/tokens/doge.png", tokenAddr: "0xD0gE...0012", side: "Sell", amount: "$2,980", coinName: "ShibaBNB", tokenAmount: "0.12 BNB" },
];

const defaultNewTokens: NewTokenItem[] = [
  { tokenLogo: "/tokens/usdt.png", name: "GeoToken", address: "0xGE0...1234", createdAgo: "24m ago" },
];

const defaultWhaleTrades: WhaleItem[] = [
  { tokenLogo: "/tokens/bnb.png", name: "Kawaii", address: "0xKaW...9876", amount: "$512,430" },
];

export function LiveUpdatesCard() {
  // WebSocket实时数据状态
  const [buys, setBuys] = useState(defaultBuys);
  const [sells, setSells] = useState(defaultSells);
  const [news, setNews] = useState(defaultNewTokens);
  const [whales, setWhales] = useState(defaultWhaleTrades);
  const [pulse, setPulse] = useState({ buy: false, sell: false, news: false, whale: false });
  const [currentType, setCurrentType] = useState<"buy" | "sell" | "news" | "whale">("buy");
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
        tokenLogo: "/tokens/eth.png", // 默认logo，可以根据代币类型调整
        tokenAddr: formatWallet(transaction.token_address),
        side: transaction.transaction_type === 'buy' ? 'Buy' : 'Sell',
        amount: `$${parseFloat(transaction.okb_amount || '0').toFixed(2)}`,
        coinName: transaction.token_symbol || 'Unknown',
        tokenAmount: `${parseFloat(transaction.token_amount || '0').toFixed(4)} ${transaction.token_symbol || ''}`
      };

      if (item.side === 'Buy') {
        setBuys([item]);
        setCurrentType('buy');
        setPulse({ buy: true, sell: false, news: false, whale: false });
      } else {
        setSells([item]);
        setCurrentType('sell');
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
        tokenLogo: "/tokens/usdt.png", // 默认logo
        name: tokenData.name || 'New Token',
        address: formatWallet(tokenData.address),
        createdAgo: formatDistanceToNow(new Date(tokenData.created_at || Date.now()), { addSuffix: true })
      };

      setNews([item]);
      setCurrentType('news');
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
        tokenLogo: "/tokens/bnb.png", // 默认logo
        name: transaction.token_symbol || 'Whale Token',
        address: formatWallet(transaction.token_address),
        amount: `$${parseFloat(transaction.okb_amount || '0').toFixed(2)}`
      };

      setWhales([item]);
      setCurrentType('whale');
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
        // 如果没有活跃连接，使用模拟数据
        const types: ("buy" | "sell" | "news" | "whale")[] = ["buy", "sell", "news", "whale"];
        const randomType = types[Math.floor(Math.random() * types.length)];
        setCurrentType(randomType);
        
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
    <div className="flex gap-4 py-4">
      {currentType === 'buy' && buys.length > 0 && (
      <a className={`w-1/4 rounded-lg p-3 bg-[#1F6F2E] block cursor-pointer hover:opacity-95 ${pulse.buy ? 'jitter-on' : ''} fade-in`}>
        <div className="flex items-center">
          {/* 左侧圆形logo */}
          <img src={buys[0].tokenLogo} alt="logo" className="w-10 h-10 rounded-full ring-2 ring-white/20 mr-3" />
          {/* 右侧文字区域 */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium truncate">{buys[0].wallet}</span>
              <span className="bg-[#70E000] text-black text-[11px] font-semibold px-3 py-1 rounded-md">Bought</span>
            </div>
            <div className="text-white/90 text-sm mt-1 truncate">{buys[0].tokenAmount} Of {buys[0].coinName}</div>
          </div>
        </div>
      </a>)}

      {currentType === 'sell' && sells.length > 0 && (
      <a className={`w-1/4 rounded-lg p-3 bg-[#6F1F1F] block cursor-pointer hover:opacity-95 ${pulse.sell ? 'jitter-on' : ''} fade-in`}>
        <div className="flex items-center">
          <img src={sells[0].tokenLogo} alt="logo" className="w-10 h-10 rounded-full ring-2 ring-white/20 mr-3" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium truncate">{sells[0].wallet}</span>
              <span className="bg-red-500 text-white text-[11px] font-semibold px-3 py-1 rounded-md">Sold</span>
            </div>
            <div className="text-white/90 text-sm mt-1 truncate">{sells[0].tokenAmount} Of {sells[0].coinName}</div>
          </div>
        </div>
      </a>)}

      {currentType === 'news' && news.length > 0 && (
      <a className={`w-1/4 rounded-lg p-3 bg-[#173B6C] block cursor-pointer hover:opacity-95 ${pulse.news ? 'jitter-on' : ''} fade-in`}>
        <div className="flex items-center">
          <img src={news[0].tokenLogo} alt="logo" className="w-10 h-10 rounded-full ring-2 ring-white/20 mr-3" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium truncate">{news[0].name}</span>
              <span className="bg-blue-500 text-white text-[11px] font-semibold px-3 py-1 rounded-md">New</span>
            </div>
            <div className="text-white/90 text-sm mt-1 truncate">{news[0].address} • {news[0].createdAgo}</div>
          </div>
        </div>
      </a>)}

      {currentType === 'whale' && whales.length > 0 && (
      <a className={`w-1/4 rounded-lg p-3 bg-[#3A216F] block cursor-pointer hover:opacity-95 ${pulse.whale ? 'jitter-on' : ''} fade-in`}>
        <div className="flex items-center">
          <img src={whales[0].tokenLogo} alt="logo" className="w-10 h-10 rounded-full ring-2 ring-white/20 mr-3" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium truncate">{whales[0].name}</span>
              <span className="bg-purple-500 text-white text-[11px] font-semibold px-3 py-1 rounded-md">Whale</span>
            </div>
            <div className="text-white/90 text-sm mt-1 truncate">{whales[0].address} • {whales[0].amount}</div>
          </div>
        </div>
      </a>)}
    </div>
  );
}
