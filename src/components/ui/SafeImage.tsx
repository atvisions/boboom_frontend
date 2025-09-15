'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackText?: string;
  style?: React.CSSProperties;
  unoptimized?: boolean;
}

export function SafeImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  fallbackText,
  style,
  unoptimized = true 
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 如果没有src或者加载失败，显示fallback
  if (!src || hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-[#1B1B1B] to-[#232323] ${className}`}
        style={{ width, height, ...style }}
      >
        <span className="text-white font-bold text-lg">
          {fallbackText || '??'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height, ...style }}>
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1B1B1B] to-[#232323] animate-pulse"
        >
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        style={{ width: 'auto', height: 'auto', maxWidth: width, maxHeight: height }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        unoptimized={unoptimized}
      />
    </div>
  );
}
