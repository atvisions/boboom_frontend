"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Sparkles, Landmark } from "lucide-react";

type BuySellItem = { avatar: string; wallet: string; tokenLogo: string; tokenAddr: string; side: "Buy" | "Sell"; amount: string; coinName: string; tokenAmount: string };
type NewTokenItem = { tokenLogo: string; name: string; address: string; createdAgo: string };
type WhaleItem = { tokenLogo: string; name: string; address: string; amount: string };

const latestBuys: BuySellItem[] = [
  { avatar: "🧑‍🚀", wallet: "0x3F4E...A7B8", tokenLogo: "/tokens/eth.png", tokenAddr: "0xC02a...6Cc2", side: "Buy", amount: "$12,340", coinName: "ShibaBNB", tokenAmount: "0.04 BNB" },
];

const latestSells: BuySellItem[] = [
  { avatar: "🧑‍🎨", wallet: "0x9C1D...E5F6", tokenLogo: "/tokens/doge.png", tokenAddr: "0xD0gE...0012", side: "Sell", amount: "$2,980", coinName: "ShibaBNB", tokenAmount: "0.12 BNB" },
];

const newTokens: NewTokenItem[] = [
  { tokenLogo: "/tokens/usdt.png", name: "GeoToken", address: "0xGE0...1234", createdAgo: "24m ago" },
];

const whaleTrades: WhaleItem[] = [
  { tokenLogo: "/tokens/bnb.png", name: "Kawaii", address: "0xKaW...9876", amount: "$512,430" },
];

export function LiveUpdatesCard() {
  // live mock states
  const [buys, setBuys] = useState(latestBuys);
  const [sells, setSells] = useState(latestSells);
  const [news, setNews] = useState(newTokens);
  const [whales, setWhales] = useState(whaleTrades);
  const [pulse, setPulse] = useState({ buy: false, sell: false, news: false, whale: false });
  const [currentType, setCurrentType] = useState<"buy" | "sell" | "news" | "whale">("buy");

  useEffect(() => {
    const id = setInterval(() => {
      // simple randomizer helpers
      const randWallet = () => `0x${Math.random().toString(16).slice(2,6)}...${Math.random().toString(16).slice(2,6)}`.toUpperCase();
      const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random()*arr.length)];
      const logos = ["/tokens/btc.png","/tokens/eth.png","/tokens/usdt.png","/tokens/bnb.png","/tokens/doge.png"]; 
      const addresses = ["0xC02a...6Cc2","0xBtc0...0001","0xKaW...9876","0xGE0...1234","0xD0gE...0012"]; 
      const avatars = ["🧑‍🚀","👨‍💻","🧑‍🎨","🤖","🐶"]; 
      const coinNames = ["ShibaBNB","RocketInu","GeoToken","Kawaii","MoonDog"];
      const tokenAmounts = ["0.04 BNB","0.12 BNB","0.30 ETH","1.2 BNB","0.65 ETH"];

      setBuys([{ avatar: pick(avatars), wallet: randWallet(), tokenLogo: pick(logos), tokenAddr: pick(addresses), side: "Buy", amount: `$${(1000+Math.floor(Math.random()*10000)).toLocaleString()}` , coinName: pick(coinNames), tokenAmount: pick(tokenAmounts)}]);
      setSells([{ avatar: pick(avatars), wallet: randWallet(), tokenLogo: pick(logos), tokenAddr: pick(addresses), side: "Sell", amount: `$${(500+Math.floor(Math.random()*8000)).toLocaleString()}` , coinName: pick(coinNames), tokenAmount: pick(tokenAmounts)}]);
      setNews([{ tokenLogo: pick(logos), name: "NewToken", address: randWallet(), createdAgo: `${Math.floor(Math.random()*59)+1}m ago` }]);
      setWhales([{ tokenLogo: pick(logos), name: "WhaleToken", address: pick(addresses), amount: `$${(100000+Math.floor(Math.random()*900000)).toLocaleString()}` }]);

      // randomly choose one type to show & animate
      const types: ("buy" | "sell" | "news" | "whale")[] = ["buy","sell","news","whale"];
      const t = pick(types) as "buy" | "sell" | "news" | "whale";
      setCurrentType(t);
      // set jitter vars and toggle class
      const rand = (min:number,max:number)=> (Math.random()*(max-min)+min).toFixed(2)+"px";
      document.documentElement.style.setProperty('--jx', rand(-20,20));
      setPulse({ buy: t === "buy", sell: t === "sell", news: t === "news", whale: t === "whale" });
      setTimeout(() => setPulse({ buy: false, sell: false, news: false, whale: false }), 400);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex gap-4 py-4">
      {currentType === 'buy' && (
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

      {currentType === 'sell' && (
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

      {currentType === 'news' && (
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

      {currentType === 'whale' && (
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
