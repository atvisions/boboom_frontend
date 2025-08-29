"use client";
import { useState } from "react";
import { useFeaturedTokens } from "@/hooks/useTokens";
import { FeaturedCard } from "./FeaturedCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function LoadingFeaturedCards({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-6 animate-pulse shadow-lg bg-card border border-border">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/10" />
              <div className="space-y-2">
                <div className="h-6 bg-white/10 rounded w-32" />
                <div className="h-4 bg-white/10 rounded w-24" />
                <div className="h-4 bg-white/10 rounded w-36" />
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/10" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1">
                <div className="h-3 bg-white/10 rounded w-16" />
                <div className="h-4 bg-white/10 rounded w-12" />
              </div>
            ))}
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="h-6 bg-white/10 rounded-full w-12" />
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-white/10 h-2 rounded-full w-1/3" />
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-4 bg-white/10 rounded w-16" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="h-8 bg-white/10 rounded-full w-20" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, k) => (
                <div key={k} className="w-8 h-8 rounded-lg bg-white/10" />
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
    <div className="col-span-full text-center py-8">
      <div className="text-red-400 mb-2">Failed to load featured tokens</div>
      <div className="text-sm text-gray-500">{message}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full text-center py-8">
      <div className="text-gray-400 mb-2">No featured tokens found</div>
      <div className="text-sm text-gray-500">Check back later for featured projects!</div>
    </div>
  );
}

export function FeaturedSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { data: tokens = [], isLoading, error } = useFeaturedTokens();
  
  const itemsPerSlide = 3;
  const totalSlides = Math.ceil(tokens.length / itemsPerSlide);
  
  const getCurrentTokens = () => {
    const start = currentSlide * itemsPerSlide;
    return tokens.slice(start, start + itemsPerSlide);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <section id="featured" className="pt-8 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="space-y-6">
      {/* 头部 */}
          <div className="flex items-end justify-between">
            <div>
              <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-border/50">
                Featured
              </Badge>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Featured Tokens</h2>
            </div>
            <Button variant="outline" size="sm" className="border-border/50">
              <span>View more</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </div>
          <Separator className="bg-border/40" />

      {/* 代币卡片 */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && <LoadingFeaturedCards count={3} />}
          
          {error && (
            <ErrorMessage message={error instanceof Error ? error.message : 'Unknown error'} />
          )}
          
          {!isLoading && !error && tokens.length === 0 && <EmptyState />}
          
          {!isLoading && !error && getCurrentTokens().map((token) => (
            <FeaturedCard key={token.address} token={token} />
          ))}
        </div>

        {/* 导航按钮 */}
        {!isLoading && !error && totalSlides > 1 && (
          <>
            <Button
              onClick={prevSlide}
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-background/80 hover:bg-background backdrop-blur text-muted-foreground hover:text-primary border-0 shadow-none dark:border-transparent"
              aria-label="Previous slide"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
            
            <Button
              onClick={nextSlide}
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-background/80 hover:bg-background backdrop-blur text-muted-foreground hover:text-primary border-0 shadow-none dark:border-transparent"
              aria-label="Next slide"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </>
        )}
      </div>

      {/* 分页指示器 */}
      {!isLoading && !error && totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide 
                  ? 'bg-primary' 
                  : 'bg-muted hover:bg-muted-foreground'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
        </div>
      </div>
    </section>
  );
}
