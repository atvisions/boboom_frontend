"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { TokenRow } from "./TokenRow";
import { Token } from "@/types/token";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

// 分别获取不同分类的代币
async function fetchTokensByCategory(category: string): Promise<Token[]> {
  const url = new URL(`${API_BASE}/api/tokens/`);
  url.searchParams.set('category', category);
  url.searchParams.set('show_inactive', 'false');
  url.searchParams.set('limit', '8');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  });
  if (!response.ok) throw new Error(`Failed to fetch tokens: ${response.status}`);
  const data = await response.json();
  if (data && data.success && data.data && Array.isArray(data.data.tokens)) {
    return data.data.tokens as Token[];
  }
  return [];
}

// 旧的fetchTokens函数保持兼容性
async function fetchTokens(): Promise<Token[]> {
  const url = new URL(`${API_BASE}/api/tokens/`);
  url.searchParams.set('show_inactive', 'false');
  url.searchParams.set('limit', '100');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  });
  if (!response.ok) throw new Error(`Failed to fetch tokens: ${response.status}`);
  const data = await response.json();
  if (data && data.success && data.data && Array.isArray(data.data.tokens)) {
    return data.data.tokens as Token[];
  }
  if (Array.isArray(data)) return data as Token[];
  return [];
}

function parseNumber(value?: string | number): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/[$,]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function MiniTokenCard({ token }: { token: Token }) {
  const progress = Math.min(Math.max(token.graduationProgress || 0, 0), 100);
  const change = Number(token.priceChange24h || 0);
  const marketCap = parseNumber(token.marketCap);
  return (
    <Link href={`/token/${token.address}`} className="block">
      <div className="flex items-center justify-between rounded-xl bg-[#17182D] px-4 py-3 hover:bg-[#1f2038] transition-colors cursor-pointer">
        <div className="flex items-center gap-4 min-w-0">
          <img src={token.imageUrl} alt={token.name} className="h-10 w-10 rounded-lg object-cover bg-white/10"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://avatar.vercel.sh/${token.address}.png?size=32`; }} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base font-semibold text-white truncate max-w-[160px]">{token.name}</span>
              <span className="text-xs text-gray-400">{token.creator.slice(0,4)}...{token.creator.slice(-4)}</span>
            </div>
            <div className="w-28 h-2 bg-white/10 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-gradient-to-r from-primary to-primary/70" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</div>
          <div className="text-xs text-gray-400">${marketCap.toLocaleString()}</div>
        </div>
      </div>
    </Link>
  );
}

export function LatestSection() {
  const queryClient = useQueryClient();

  // 分别获取三个分类的数据
  const { data: newlyCreated = [], isLoading: loadingNewly } = useQuery({
    queryKey: ['tokens', 'newly_created'],
    queryFn: () => fetchTokensByCategory('newly_created'),
    staleTime: 10 * 1000, // 10秒后认为数据过期
    refetchInterval: 10 * 1000, // 每10秒刷新一次
  });

  const { data: lastTraded = [], isLoading: loadingLast } = useQuery({
    queryKey: ['tokens', 'last_traded'],
    queryFn: () => fetchTokensByCategory('last_traded'),
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000,
  });

  const { data: topGainers = [], isLoading: loadingTop } = useQuery({
    queryKey: ['tokens', 'top_gainers'],
    queryFn: () => fetchTokensByCategory('top_gainers'),
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000,
  });

  // SSE实时更新
  useEffect(() => {
    const categories = ['newly_created', 'last_traded', 'top_gainers'];
    const eventSources: EventSource[] = [];
    
    categories.forEach(category => {
      const eventSource = new EventSource(`${API_BASE}/api/tokens/stream/?category=${category}&limit=8`);
      eventSources.push(eventSource);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.success && data.data && data.data.tokens) {
            queryClient.setQueryData(['tokens', category], data.data.tokens);
          }
        } catch (error) {
          console.error('SSE parse error:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
      };
    });

    // 清理函数
    return () => {
      eventSources.forEach(es => es.close());
    };
  }, [queryClient]);

  const isLoading = loadingNewly || loadingLast || loadingTop;

  return (
    <section id="latest" className="pt-8 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Newly Created</h3>
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
            {!isLoading && newlyCreated.map(t => (
              <MiniTokenCard key={t.address} token={t} />
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Last Traded</h3>
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
            {!isLoading && lastTraded.map(t => (
              <MiniTokenCard key={t.address} token={t} />
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Top Gainers</h3>
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
            {!isLoading && topGainers.map(t => (
              <MiniTokenCard key={t.address} token={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
