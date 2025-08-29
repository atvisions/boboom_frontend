"use client";
import { useQuery } from "@tanstack/react-query";

import { Token } from '@/types/token';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

async function fetchTokens(phase?: string): Promise<Token[]> {
  const url = new URL(`${API_BASE}/api/tokens/`);
  if (phase) {
    url.searchParams.set('phase', phase);
  }
  
  console.log('Fetching tokens from URL:', url.toString());
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to fetch tokens: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 调试：打印 API 响应格式
    console.log('API response for tokens:', { phase, url: url.toString(), data });
    
    // 处理后端 API 的响应格式: { success: true, data: { tokens: [...] } }
    if (data && data.success && data.data && Array.isArray(data.data.tokens)) {
      console.log('Found backend response with', data.data.tokens.length, 'tokens');
      return data.data.tokens;
    } else if (Array.isArray(data)) {
      console.log('Found array with', data.length, 'tokens');
      return data;
    } else if (data && Array.isArray(data.results)) {
      // Django 分页响应格式
      console.log('Found paginated response with', data.results.length, 'tokens');
      return data.results;
    } else if (data && Array.isArray(data.data)) {
      // 其他可能的响应格式
      console.log('Found data array with', data.data.length, 'tokens');
      return data.data;
    } else {
      console.warn('Unexpected API response format:', data);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch tokens:', error);
    throw error;
  }
}

export function useTokens(phase?: string) {
  return useQuery({
    queryKey: ['tokens', phase],
    queryFn: () => fetchTokens(phase),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
}

// 推荐代币（后台标记为 featured）
async function fetchFeaturedTokens(): Promise<Token[]> {
  const url = new URL(`${API_BASE}/api/tokens/`);
  url.searchParams.set('featured', 'true');
  url.searchParams.set('show_inactive', 'false');
  
  console.log('Fetching featured tokens from URL:', url.toString());
  return fetchTokensFromUrl(url, 'featured');
}

// 热门代币（按交易量排序）
async function fetchTrendingTokens(): Promise<Token[]> {
  const url = new URL(`${API_BASE}/api/tokens/`);
  url.searchParams.set('trending', 'true');
  url.searchParams.set('show_inactive', 'false');
  
  console.log('Fetching trending tokens from URL:', url.toString());
  return fetchTokensFromUrl(url, 'trending');
}

// 最新代币（按创建时间排序）
async function fetchLatestTokens(): Promise<Token[]> {
  const url = new URL(`${API_BASE}/api/tokens/`);
  url.searchParams.set('show_inactive', 'false');
  // 默认就是按 created_at 排序
  
  console.log('Fetching latest tokens from URL:', url.toString());
  return fetchTokensFromUrl(url, 'latest');
}

// 即将毕业代币（80%以上进度）
async function fetchGraduatingTokens(): Promise<Token[]> {
  const url = new URL(`${API_BASE}/api/tokens/`);
  url.searchParams.set('phase', 'CREATED');
  url.searchParams.set('show_inactive', 'false');
  
  console.log('Fetching graduating tokens from URL:', url.toString());
  
  try {
    const tokens = await fetchTokensFromUrl(url, 'graduating');
    // 筛选出进度 >= 80% 的代币
    return tokens.filter(token => token.graduationProgress >= 80);
  } catch (error) {
    console.error('Failed to fetch graduating tokens:', error);
    throw error;
  }
}

// 通用的获取函数
async function fetchTokensFromUrl(url: URL, type: string): Promise<Token[]> {
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log(`${type} response status:`, response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${type} API Error Response:`, errorText);
      throw new Error(`Failed to fetch ${type} tokens: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`${type} API response:`, data);
    
    if (data && data.success && data.data && Array.isArray(data.data.tokens)) {
      console.log(`Found ${type} tokens:`, data.data.tokens.length);
      return data.data.tokens;
    } else if (Array.isArray(data)) {
      console.log(`Found ${type} tokens (array):`, data.length);
      return data;
    } else {
      console.warn(`Unexpected ${type} API response format:`, data);
      return [];
    }
  } catch (error) {
    console.error(`Failed to fetch ${type} tokens:`, error);
    throw error;
  }
}

export function useFeaturedTokens() {
  return useQuery({
    queryKey: ['tokens', 'featured'],
    queryFn: fetchFeaturedTokens,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useTrendingTokens() {
  return useQuery({
    queryKey: ['tokens', 'trending'],
    queryFn: fetchTrendingTokens,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useLatestTokens() {
  return useQuery({
    queryKey: ['tokens', 'latest'],
    queryFn: fetchLatestTokens,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useGraduatingTokens() {
  return useQuery({
    queryKey: ['tokens', 'graduating'],
    queryFn: fetchGraduatingTokens,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useGraduatedTokens() {
  return useQuery({
    queryKey: ['tokens', 'graduated'],
    queryFn: () => fetchTokens('GRADUATED'),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
