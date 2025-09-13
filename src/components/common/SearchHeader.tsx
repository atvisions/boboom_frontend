"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RainbowKitConnectButton } from "@/components/wallet/RainbowKitConnectButton";
import { tokenAPI } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";

export function SearchHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleCreateToken = () => {
    router.push('/create');
  };

  // 防抖搜索函数
  const [isSearchLoading, debouncedSearch] = useDebounce(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      try {
        setIsSearching(true);
        console.log('🔍 Searching for:', query.trim());

        // 直接调用API，不使用缓存
        const searchParams = new URLSearchParams({
          search: query.trim(),
          limit: '10',
          network: 'sepolia'
        });

        const response = await fetch(`/api/tokens/?${searchParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('🔍 Search response:', data);

        if (data.success) {
          console.log('✅ Found tokens:', data.data.tokens.length);
          setSearchResults(data.data.tokens);
          setShowResults(true);
        } else {
          console.log('❌ Search failed:', data);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('❌ Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    300 // 300ms 防抖
  );

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // 处理搜索结果点击
  const handleResultClick = (token: any) => {
    router.push(`/token/${token.address}`);
    setShowResults(false);
    setSearchQuery("");
  };

  // 清空搜索
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-[#0E0E0E] p-6">
      {/* 搜索栏和按钮 */}
      <div className="flex items-center justify-between">
        {/* 搜索框 */}
        <div className="w-[410px] relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tokens by name, symbol, or full address..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery && setShowResults(true)}
              className="h-[40px] pl-12 pr-10 py-4 bg-[#151515] border-0 text-white placeholder-gray-400 focus:border-0 focus:ring-0 font-light text-base rounded-[15px]"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              </div>
            )}
          </div>

          {/* 搜索结果下拉框 */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-[#333333] rounded-[15px] shadow-lg z-50 max-h-[400px] overflow-y-auto">
              {searchResults.length > 0 ? (
                <>
                  {searchResults.map((token) => (
                    <div
                      key={token.address}
                      onClick={() => handleResultClick(token)}
                      className="flex items-center gap-3 p-4 hover:bg-[#1a1a1a] cursor-pointer border-b border-[#333333] last:border-b-0 transition-colors"
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#333333] flex-shrink-0">
                        {token.imageUrl ? (
                          <Image
                            src={token.imageUrl}
                            alt={token.name}
                            width={40}
                            height={40}
                            className="object-cover rounded-full"
                            style={{ width: '40px', height: '40px' }}
                            onError={(e) => {
                              // 图片加载失败时显示首字母
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                          {token.symbol?.charAt(0) || '?'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">{token.name}</span>
                          <span className="text-gray-400 text-sm">${token.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 truncate">
                            {token.address.slice(0, 6)}...{token.address.slice(-4)}
                          </span>
                          {token.currentPrice && parseFloat(token.currentPrice) > 0 ? (
                            <span className="text-xs text-green-500">${parseFloat(token.currentPrice).toFixed(6)}</span>
                          ) : (
                            <span className="text-xs text-gray-500">$N/A</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : searchQuery && !isSearching ? (
                <div className="p-4 text-center text-gray-400">
                  No tokens found for &quot;{searchQuery}&quot;
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* 按钮组 - 放到最右侧 */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleCreateToken}
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
    </div>
  );
}
