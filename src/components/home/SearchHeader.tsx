"use client";
import { useState } from "react";
import { Search, Rocket, Wallet, ArrowUpRight, ArrowDownRight, Sparkles, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RainbowKitConnectButton } from "@/components/wallet/RainbowKitConnectButton";

type BuySellItem = { avatar: string; wallet: string; tokenLogo: string; tokenAddr: string; side: "Buy" | "Sell"; amount: string };
type NewTokenItem = { tokenLogo: string; name: string; address: string; createdAgo: string };
type WhaleItem = { tokenLogo: string; name: string; address: string; amount: string };

const latestBuys: BuySellItem[] = [
  { avatar: "🧑‍🚀", wallet: "0x3F4E...A7B8", tokenLogo: "/tokens/eth.png", tokenAddr: "0xC02a...6Cc2", side: "Buy", amount: "$12,340" },
];

const latestSells: BuySellItem[] = [
  { avatar: "🧑‍🎨", wallet: "0x9C1D...E5F6", tokenLogo: "/tokens/doge.png", tokenAddr: "0xD0gE...0012", side: "Sell", amount: "$2,980" },
];

const newTokens: NewTokenItem[] = [
  { tokenLogo: "/tokens/usdt.png", name: "GeoToken", address: "0xGE0...1234", createdAgo: "24m ago" },
];

const whaleTrades: WhaleItem[] = [
  { tokenLogo: "/tokens/bnb.png", name: "Kawaii", address: "0xKaW...9876", amount: "$512,430" },
];

export function SearchHeader() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-[#0E0E0E] p-6">
      {/* 搜索栏和按钮 */}
      <div className="flex items-center justify-between mb-4">
        {/* 搜索框 */}
        <div className="w-[410px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[40px] pl-12 pr-4 py-4 bg-[#151515] border-0 text-white placeholder-gray-400 focus:border-0 focus:ring-0 font-light text-base rounded-[15px]"
            />
          </div>
        </div>

        {/* 按钮组 - 放到最右侧 */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="h-[40px] px-[34px] py-4 border-2 border-[#70E000] text-[#70E000] hover:bg-[#70E000] hover:text-black font-light rounded-[15px]"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Create Token
          </Button>
          
          <div className="h-[40px]">
            <RainbowKitConnectButton />
          </div>
        </div>
      </div>

      {/* Top 4 summary cards (clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Latest Buys */}
        <a className="rounded-lg p-3 min-w-[200px] bg-[#1F6F2E] block cursor-pointer hover:opacity-95">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm mb-2">
            <ArrowUpRight className="h-4 w-4" />
            <span>Latest Buys</span>
          </div>
          {latestBuys.map((it, i) => (
            <div key={i} className="flex items-center text-xs text-white/90 gap-2 whitespace-nowrap overflow-hidden">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] flex-shrink-0">{it.avatar}</span>
              <span className="truncate">{it.wallet}</span>
              <span className="opacity-60">•</span>
              <img src={it.tokenLogo} alt="logo" className="w-5 h-5 rounded flex-shrink-0" />
              <span className="truncate">{it.tokenAddr}</span>
              <span className="opacity-60">•</span>
              <span className="font-semibold text-white">{it.side}</span>
              <span className="truncate">{it.amount}</span>
            </div>
          ))}
        </a>

        {/* Latest Sells */}
        <a className="rounded-lg p-3 min-w-[200px] bg-[#6F1F1F] block cursor-pointer hover:opacity-95">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm mb-2">
            <ArrowDownRight className="h-4 w-4" />
            <span>Latest Sells</span>
          </div>
          {latestSells.map((it, i) => (
            <div key={i} className="flex items-center text-xs text-white/90 gap-2 whitespace-nowrap overflow-hidden">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] flex-shrink-0">{it.avatar}</span>
              <span className="truncate">{it.wallet}</span>
              <span className="opacity-60">•</span>
              <img src={it.tokenLogo} alt="logo" className="w-5 h-5 rounded flex-shrink-0" />
              <span className="truncate">{it.tokenAddr}</span>
              <span className="opacity-60">•</span>
              <span className="font-semibold text-white">{it.side}</span>
              <span className="truncate">{it.amount}</span>
            </div>
          ))}
        </a>

        {/* New Tokens */}
        <a className="rounded-lg p-3 min-w-[200px] bg-[#173B6C] block cursor-pointer hover:opacity-95">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm mb-2">
            <Sparkles className="h-4 w-4" />
            <span>New Tokens</span>
          </div>
          {newTokens.map((it, i) => (
            <div key={i} className="flex items-center text-xs text-white/90 gap-2 whitespace-nowrap overflow-hidden">
              <img src={it.tokenLogo} alt="logo" className="w-5 h-5 rounded flex-shrink-0" />
              <span className="truncate">{it.name}</span>
              <span className="opacity-60">•</span>
              <span className="truncate">{it.address}</span>
              <span className="opacity-60">•</span>
              <span className="truncate">{it.createdAgo}</span>
            </div>
          ))}
        </a>

        {/* Whale Trades */}
        <a className="rounded-lg p-3 min-w-[200px] bg-[#3A216F] block cursor-pointer hover:opacity-95">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm mb-2">
            <Landmark className="h-4 w-4" />
            <span>Whale Trades</span>
          </div>
          {whaleTrades.map((it, i) => (
            <div key={i} className="flex items-center text-xs text-white/90 gap-2 whitespace-nowrap overflow-hidden">
              <img src={it.tokenLogo} alt="logo" className="w-5 h-5 rounded flex-shrink-0" />
              <span className="truncate">{it.name}</span>
              <span className="opacity-60">•</span>
              <span className="truncate">{it.address}</span>
              <span className="opacity-60">•</span>
              <span className="truncate font-semibold">{it.amount}</span>
            </div>
          ))}
        </a>
      </div>
    </div>
  );
}
