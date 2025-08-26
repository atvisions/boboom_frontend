"use client";
import { useTokens, useFeaturedTokens, useTrendingTokens, useLatestTokens, useGraduatingTokens, useGraduatedTokens } from "@/hooks/useTokens";
import { TokenCard } from "./TokenCard";
import { TokenRow } from "./TokenRow";

interface TokenListProps {
  phase?: 'featured' | 'trending' | 'latest' | 'graduating' | 'graduated' | 'CREATED' | 'GRADUATING' | 'GRADUATED';
  title: string;
  limit?: number;
  layout?: 'grid' | 'row'; // 新增布局选项
}

function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-white/10 rounded w-24" />
                <div className="h-4 bg-white/10 rounded w-16" />
              </div>
              <div className="h-3 bg-white/10 rounded w-16" />
              <div className="h-3 bg-white/10 rounded w-full" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-8 bg-white/10 rounded" />
                <div className="h-8 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-white/3 animate-pulse">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/10" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white/10" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-6 bg-white/10 rounded w-32" />
                <div className="w-6 h-6 rounded-full bg-white/10" />
              </div>
              <div className="h-4 bg-white/10 rounded w-48" />
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 px-6">
            <div className="h-4 bg-white/10 rounded w-20" />
            <div className="h-6 bg-white/10 rounded-full w-12" />
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="space-y-1">
              <div className="h-4 bg-white/10 rounded w-20" />
              <div className="h-5 bg-white/10 rounded w-24" />
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10" />
              <div className="w-8 h-8 rounded-lg bg-white/10" />
              <div className="w-8 h-8 rounded-lg bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="col-span-full text-center py-8">
      <div className="text-red-400 mb-2">Failed to load tokens</div>
      <div className="text-sm text-gray-500">{message}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full text-center py-8">
      <div className="text-gray-400 mb-2">No tokens found</div>
      <div className="text-sm text-gray-500">Be the first to create a token!</div>
    </div>
  );
}

export function TokenList({ phase, title, limit = 6, layout = 'grid' }: TokenListProps) {
  const getQuery = () => {
    switch (phase) {
      case 'featured':
        return useFeaturedTokens();
      case 'trending':
        return useTrendingTokens();
      case 'latest':
        return useLatestTokens();
      case 'graduating':
        return useGraduatingTokens();
      case 'graduated':
        return useGraduatedTokens();
      case 'CREATED':
      case 'GRADUATING':
      case 'GRADUATED':
        return useTokens(phase);
      default:
        return useLatestTokens();
    }
  };
  
  const { 
    data: tokens, 
    isLoading, 
    error 
  } = getQuery();

  const displayTokens = Array.isArray(tokens) ? tokens.slice(0, limit) : [];

  return (
    <section id={phase === 'latest' ? 'latest' : phase === 'trending' ? 'trending' : phase === 'graduating' ? 'graduating' : phase === 'graduated' ? 'graduated' : phase || 'tokens'} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        {Array.isArray(tokens) && tokens.length > limit && (
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            View All ({tokens.length})
          </button>
        )}
      </div>
      
      {layout === 'row' ? (
        <div className="space-y-3">
          {isLoading && <LoadingRows count={limit} />}
          
          {error && (
            <ErrorMessage message={error instanceof Error ? error.message : 'Unknown error'} />
          )}
          
          {!isLoading && !error && displayTokens.length === 0 && <EmptyState />}
          
          {!isLoading && !error && displayTokens.map((token) => (
            <TokenRow key={token.id} token={token} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading && <LoadingCards count={limit} />}
          
          {error && (
            <ErrorMessage message={error instanceof Error ? error.message : 'Unknown error'} />
          )}
          
          {!isLoading && !error && displayTokens.length === 0 && <EmptyState />}
          
          {!isLoading && !error && displayTokens.map((token) => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
      )}
    </section>
  );
}
