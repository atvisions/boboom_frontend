"use client";
import { ArrowDownRight, ArrowUpRight, Sparkles, Bell } from "lucide-react";

export function TopHighlights() {
  const cards = [
    {
      title: "最新买入",
      color: "#1F6F2E",
      ring: "#70E000",
      icon: ArrowUpRight,
      text: "地址 0x3F4E...A7B8 以 $12,340 买入 ETH",
    },
    {
      title: "最新卖出",
      color: "#6F1F1F",
      ring: "#F04444",
      icon: ArrowDownRight,
      text: "地址 0x7A8B...C9D2 卖出 12,000 WOW",
    },
    {
      title: "新代币 / 毕业代币",
      color: "#173B6C",
      ring: "#3B82F6",
      icon: Sparkles,
      text: "新代币 GEO 上线，PEPE 毕业至流动池",
    },
    {
      title: "大额交易 / 市值突破提醒",
      color: "#3A216F",
      ring: "#8B5CF6",
      icon: Bell,
      text: "KWT 单笔 > $500k；DOGE 市值突破 $20B",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className="rounded-xl p-4 border"
            style={{ backgroundColor: c.color, borderColor: c.ring }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Icon className="h-5 w-5 text-white" />
                <span className="font-semibold">{c.title}</span>
              </div>
            </div>
            <div className="text-white/80 text-sm">{c.text}</div>
          </div>
        );
      })}
    </div>
  );
}


