"use client";
import { useState } from "react";
import { useFeaturedTokens } from "@/hooks/useTokens";
import { FeaturedCard } from "./FeaturedCard";

function LoadingFeaturedCards({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 animate-pulse shadow-lg" style={{backgroundColor: '#17182D'}}>
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
    <section id="featured" className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-blue-500 text-sm font-semibold tracking-wider uppercase mb-2">
            PROJECT
          </div>
          <h2 className="text-3xl font-bold text-white">Featured Tokens</h2>
        </div>
        <button className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors">
          <span>View More</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

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
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Previous slide"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Next slide"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
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
                  ? 'bg-blue-500' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
