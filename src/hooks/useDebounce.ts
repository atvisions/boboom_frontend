import { useState, useCallback } from 'react';

/**
 * 防重复点击的hook
 * @param delay 延迟时间（毫秒），默认1000ms
 * @returns [isLoading, debouncedFunction] - 加载状态和防抖函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 1000
): [boolean, T] {
  const [isLoading, setIsLoading] = useState(false);

  const debouncedFunction = useCallback(
    async (...args: Parameters<T>) => {
      if (isLoading) return;
      
      setIsLoading(true);
      try {
        await callback(...args);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, delay);
      }
    },
    [callback, delay, isLoading]
  ) as T;

  return [isLoading, debouncedFunction];
}

/**
 * 防重复点击的简单hook
 * @param delay 延迟时间（毫秒），默认1000ms
 * @returns [isLoading, setLoading] - 加载状态和设置函数
 */
export function useLoadingState(delay: number = 1000): [boolean, (loading: boolean) => void] {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setTimeout(() => {
        setIsLoading(false);
      }, delay);
    }
  }, [delay]);

  return [isLoading, setLoading];
}
