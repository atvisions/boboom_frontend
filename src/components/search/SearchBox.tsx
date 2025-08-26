"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Token } from "@/types/token";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// 搜索API函数
async function searchTokens(query: string, limit: number = 5): Promise<Token[]> {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/tokens/?search=${encodeURIComponent(query)}&limit=${limit}`
    );
    const data = await response.json();
    
    if (data.success && data.data?.tokens) {
      return data.data.tokens;
    }
    return [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

interface SearchResultItemProps {
  token: Token;
  onSelect: () => void;
}

function SearchResultItem({ token, onSelect }: SearchResultItemProps) {
  const avatarSrc = token.imageUrl || `https://avatar.vercel.sh/${token.address}.png?size=32`;
  
  return (
    <Link
      href={`/token/${token.address}`}
      onClick={onSelect}
      className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer"
    >
      <img
        src={avatarSrc}
        alt={token.name}
        className="w-8 h-8 rounded-full bg-white/10"
        onError={(e) => {
          e.currentTarget.src = `https://avatar.vercel.sh/${token.address}.png?size=32`;
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white truncate">{token.name}</span>
          <span className="text-xs text-gray-400">${token.symbol}</span>
        </div>
        <div className="text-xs text-gray-500 truncate">
          {token.address.slice(0, 8)}...{token.address.slice(-6)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-white">
          ${Number(token.currentPrice).toFixed(6)}
        </div>
        <div className="text-xs text-gray-400">
          {token.phase === 'CREATED' ? 'On Curve' : token.phase}
        </div>
      </div>
    </Link>
  );
}

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 搜索查询
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['searchTokens', query],
    queryFn: () => searchTokens(query, 8),
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000, // 30秒缓存
  });

  // 处理搜索结果显示
  const showResults = isOpen && (query.trim().length > 0) && (isLoading || searchResults.length > 0);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
  }, []);

  // 处理焦点
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // 延迟关闭，让点击结果项有时间执行
    setTimeout(() => setIsOpen(false), 200);
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && query.trim()) {
      // Enter键跳转到搜索结果页面
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [query, router]);

  // 处理结果项选择
  const handleResultSelect = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* 搜索输入框 */}
      <div className={`relative flex items-center transition-all duration-200 ${
        isFocused ? 'ring-2 ring-blue-500/50' : ''
      }`}>
        <div className="absolute left-3 z-10">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search tokens..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-all duration-200"
        />
        {isLoading && (
          <div className="absolute right-3">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 搜索结果下拉框 */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="inline-block w-6 h-6 border-2 border-gray-400 border-t-blue-400 rounded-full animate-spin mb-2" />
              <div>Searching...</div>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="p-3 border-b border-white/10">
                <div className="text-sm text-gray-400">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </div>
              </div>
              {searchResults.map((token) => (
                <SearchResultItem
                  key={token.address}
                  token={token}
                  onSelect={handleResultSelect}
                />
              ))}
              {query.trim() && (
                <div className="p-3 border-t border-white/10">
                  <Link
                    href={`/search?q=${encodeURIComponent(query.trim())}`}
                    onClick={handleResultSelect}
                    className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View all results for "{query}"
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-gray-400">
              <div className="mb-2">No tokens found</div>
              <div className="text-xs">
                Try searching by name, symbol, or address
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
