"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TokenRow } from "./TokenRow";
import { Token } from "@/types/token";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

type FilterType = 'latest' | 'trending' | 'graduating' | 'graduated';

interface FilterOption {
  key: FilterType;
  label: string;
  icon: string;
}

const filterOptions: FilterOption[] = [
  { key: 'latest', label: 'Latest', icon: '🆕' },
  { key: 'trending', label: 'Trending', icon: '🔥' },
  { key: 'graduating', label: 'Graduating Soon', icon: '🚀' },
  { key: 'graduated', label: 'Graduated', icon: '🎓' },
];

async function fetchFilteredTokens(filter: FilterType): Promise<Token[]> {
  const url = new URL(`${API_BASE}/api/tokens/`);
  url.searchParams.set('show_inactive', 'false');
  url.searchParams.set('limit', '20');
  
  switch (filter) {
    case 'trending':
      url.searchParams.set('trending', 'true');
      break;
    case 'graduating':
      url.searchParams.set('graduating_soon', 'true');
      break;
    case 'graduated':
      url.searchParams.set('phase', 'GRADUATED');
      break;
    case 'latest':
    default:
      // 最新发布：按创建时间排序
      break;
  }
  
  console.log(`Fetching ${filter} tokens from URL:`, url.toString());
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log(`${filter} response status:`, response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${filter} API Error Response:`, errorText);
      throw new Error(`Failed to fetch ${filter} tokens: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`${filter} API response:`, data);
    
    let tokens: Token[] = [];
    if (data && data.success && data.data && Array.isArray(data.data.tokens)) {
      tokens = data.data.tokens;
    } else if (Array.isArray(data)) {
      tokens = data;
    } else {
      console.warn(`Unexpected ${filter} API response format:`, data);
      return [];
    }
    
    // 后端已经处理了筛选逻辑，不需要前端再次过滤
    
    console.log(`Found ${filter} tokens:`, tokens.length);
    return tokens;
    
  } catch (error) {
    console.error(`Failed to fetch ${filter} tokens:`, error);
    throw error;
  }
}

function LoadingRows({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center p-6 rounded-2xl transition-all duration-300 shadow-lg animate-pulse" style={{backgroundColor: '#17182D'}}>
          {/* 左侧：Logo + 名称 + 价格 */}
          <div className="flex items-center gap-4 w-80 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-white/10" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white/10" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 bg-white/10 rounded w-24" />
                <div className="h-4 bg-white/10 rounded w-12" />
              </div>
              <div className="h-4 bg-white/10 rounded w-32" />
              <div className="h-3 bg-white/10 rounded w-20" />
            </div>
          </div>
          
          {/* 中间：介绍和阶段 */}
          <div className="flex-1 px-6 min-w-0 space-y-2">
            <div className="h-3 bg-white/10 rounded w-full" />
            <div className="h-3 bg-white/10 rounded w-3/4" />
            <div className="flex items-center gap-3">
              <div className="h-6 bg-white/10 rounded-full w-20" />
              <div className="w-48">
                <div className="h-2 bg-gray-700 rounded-full">
                  <div className="h-2 bg-white/10 rounded-full w-1/3" />
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧：统计数据并列显示 */}
          <div className="flex items-center gap-8">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="text-right space-y-1">
                <div className="h-3 bg-white/10 rounded w-16 ml-auto" />
                <div className="h-4 bg-white/10 rounded w-12 ml-auto" />
              </div>
            ))}
          </div>
          
          {/* 最右侧：创建人和社交图标 */}
          <div className="flex flex-col items-end gap-3 ml-6 w-32">
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 justify-end">
                <div className="h-3 bg-white/10 rounded w-16" />
                <div className="w-5 h-5 rounded-full bg-white/10" />
              </div>
              <div className="h-3 bg-white/10 rounded w-12 ml-auto" />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, k) => (
                <div key={k} className="w-6 h-6 rounded-lg bg-white/10" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-red-400 mb-2">Failed to load tokens</div>
      <div className="text-sm text-gray-500">{message}</div>
    </div>
  );
}

function EmptyState({ filter }: { filter: FilterType }) {
  const getEmptyMessage = () => {
    switch (filter) {
      case 'trending':
        return 'No trending tokens found';
      case 'graduating':
        return 'No tokens graduating soon';
      case 'graduated':
        return 'No graduated tokens yet';
      case 'latest':
      default:
        return 'No tokens found';
    }
  };

  return (
    <div className="text-center py-8">
      <div className="text-gray-400 mb-2">{getEmptyMessage()}</div>
      <div className="text-sm text-gray-500">Check back later!</div>
    </div>
  );
}

export function LatestSection() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('latest');
  
  const { data: tokens = [], isLoading, error } = useQuery({
    queryKey: ['tokens', 'filtered', activeFilter],
    queryFn: () => fetchFilteredTokens(activeFilter),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const activeOption = filterOptions.find(opt => opt.key === activeFilter) || filterOptions[0];

  return (
    <section id="latest" className="space-y-6">
      {/* 头部：标题和筛选按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{activeOption.icon}</span>
          <h2 className="text-2xl font-bold text-white">{activeOption.label}</h2>
        </div>
        
        {/* 筛选按钮 */}
        <div className="flex items-center gap-2 p-1 rounded-2xl" style={{backgroundColor: '#17182D'}}>
          {filterOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setActiveFilter(option.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeFilter === option.key
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 代币列表 */}
      <div className="space-y-3">
        {isLoading && <LoadingRows count={6} />}
        
        {error && (
          <ErrorMessage message={error instanceof Error ? error.message : 'Unknown error'} />
        )}
        
        {!isLoading && !error && tokens.length === 0 && <EmptyState filter={activeFilter} />}
        
        {!isLoading && !error && tokens.map((token) => (
          <TokenRow key={token.address} token={token} />
        ))}
      </div>
      
      {/* 查看更多 */}
      {!isLoading && !error && tokens.length > 0 && (
        <div className="text-center pt-4">
          <button className="px-6 py-2 rounded-full border border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition-colors">
            View More ({tokens.length}+)
          </button>
        </div>
      )}
    </section>
  );
}
