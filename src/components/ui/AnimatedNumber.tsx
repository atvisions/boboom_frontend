"use client";

import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number; // 动画持续时间（毫秒）
  formatFunction?: (value: number) => string;
  showChangeIndicator?: boolean; // 是否显示变化指示器
  changeColor?: {
    positive: string;
    negative: string;
    neutral: string;
  };
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  prefix = '',
  suffix = '',
  className = '',
  duration = 800,
  formatFunction,
  showChangeIndicator = false,
  changeColor = {
    positive: '#10B981',
    negative: '#EF4444',
    neutral: '#6B7280'
  }
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [changeDirection, setChangeDirection] = useState<'up' | 'down' | 'none'>('none');
  const [showFlash, setShowFlash] = useState(false);
  const previousValueRef = useRef<number>(0);
  const animationRef = useRef<number>();

  // 将输入值转换为数字
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

  useEffect(() => {
    const previousValue = previousValueRef.current;
    
    // 检测变化方向
    if (numericValue > previousValue) {
      setChangeDirection('up');
    } else if (numericValue < previousValue) {
      setChangeDirection('down');
    } else {
      setChangeDirection('none');
    }

    // 如果值发生变化，触发动画
    if (numericValue !== previousValue && previousValue !== 0) {
      setIsAnimating(true);
      setShowFlash(true);
      
      // 闪烁效果
      setTimeout(() => setShowFlash(false), 200);
      
      // 数字滚动动画
      const startValue = displayValue;
      const endValue = numericValue;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeOutCubic;
        
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setDisplayValue(endValue);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // 初始值或无变化
      setDisplayValue(numericValue);
    }
    
    previousValueRef.current = numericValue;
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [numericValue, duration]);

  // 格式化显示值
  const formatDisplayValue = (val: number): string => {
    if (formatFunction) {
      return formatFunction(val);
    }
    
    // 默认格式化逻辑
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    } else if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    } else if (val < 1 && val > 0) {
      return val.toFixed(6);
    } else {
      return val.toFixed(2);
    }
  };

  // 获取变化指示器颜色
  const getChangeColor = () => {
    switch (changeDirection) {
      case 'up':
        return changeColor.positive;
      case 'down':
        return changeColor.negative;
      default:
        return changeColor.neutral;
    }
  };

  return (
    <span 
      className={`inline-flex items-center transition-all duration-300 ${className}`}
      style={{
        color: showChangeIndicator ? getChangeColor() : undefined,
        textShadow: showFlash ? `0 0 8px ${getChangeColor()}` : undefined,
        transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {prefix}
      <span 
        className={`transition-all duration-200 ${
          isAnimating ? 'animate-pulse' : ''
        } ${
          showFlash ? 'brightness-150' : ''
        }`}
        style={{
          background: showFlash ? `linear-gradient(45deg, ${getChangeColor()}20, transparent)` : undefined,
          borderRadius: showFlash ? '4px' : undefined,
          padding: showFlash ? '2px 4px' : undefined,
        }}
      >
        {formatDisplayValue(displayValue)}
      </span>
      {suffix}
      
      {/* 变化指示器 */}
      {showChangeIndicator && changeDirection !== 'none' && (
        <span 
          className={`ml-1 text-xs transition-all duration-500 ${
            isAnimating ? 'opacity-100 scale-100' : 'opacity-70 scale-90'
          }`}
          style={{ color: getChangeColor() }}
        >
          {changeDirection === 'up' ? '↗' : '↘'}
        </span>
      )}
    </span>
  );
};

// 专门用于价格显示的组件
export const AnimatedPrice: React.FC<{
  value: number | string;
  className?: string;
  showChangeIndicator?: boolean;
}> = ({ value, className = '', showChangeIndicator = true }) => {
  return (
    <AnimatedNumber
      value={value}
      prefix="$"
      className={className}
      formatFunction={(val) => {
        if (val < 0.001 && val > 0) {
          return val.toFixed(8);
        } else if (val < 1) {
          return val.toFixed(6);
        } else {
          return val.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 6 
          });
        }
      }}
      showChangeIndicator={showChangeIndicator}
    />
  );
};

// 专门用于百分比显示的组件
export const AnimatedPercentage: React.FC<{
  value: number | string;
  className?: string;
  showChangeIndicator?: boolean;
}> = ({ value, className = '', showChangeIndicator = true }) => {
  return (
    <AnimatedNumber
      value={value}
      suffix="%"
      className={className}
      formatFunction={(val) => {
        return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
      }}
      showChangeIndicator={showChangeIndicator}
    />
  );
};

// 专门用于交易量显示的组件
export const AnimatedVolume: React.FC<{
  value: number | string;
  className?: string;
  showChangeIndicator?: boolean;
}> = ({ value, className = '', showChangeIndicator = false }) => {
  return (
    <AnimatedNumber
      value={value}
      prefix="$"
      className={className}
      formatFunction={(val) => {
        if (val >= 1000000) {
          return (val / 1000000).toFixed(1) + 'M';
        } else if (val >= 1000) {
          return (val / 1000).toFixed(1) + 'K';
        } else {
          return val.toFixed(0);
        }
      }}
      showChangeIndicator={showChangeIndicator}
    />
  );
};
