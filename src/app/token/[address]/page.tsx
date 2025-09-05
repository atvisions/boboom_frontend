"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/common/Sidebar';
import { SearchHeader } from '@/components/common/SearchHeader';
import { TokenDetails } from '@/components/token/TokenDetails';
import { TokenMetrics } from '@/components/token/TokenMetrics';
import { TradingPanel } from '@/components/token/TradingPanel';
import { TradesAndHolders } from '@/components/token/Trades';
import { BondingCurveProgress } from '@/components/token/BondingCurveProgress';
import { CandlestickChart } from '@/components/token/CandlestickChart';

import { tokenAPI, userAPI } from '@/services/api';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from '@/components/ui/toast-notification';
import websocketService from '@/services/websocket';
import { useTokenFactory } from '@/hooks/useTokenFactory';

export default function TokenDetailPage() {
  const params = useParams();
  const { address, isAuthenticated, isClient } = useWalletAuth();
  const [token, setToken] = useState<any>(null);
  const [okbPrice, setOkbPrice] = useState<number>(177.6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTokenBalance, setUserTokenBalance] = useState<string>('0'); // 用户代币余额
  const [stats24h, setStats24h] = useState<any>(null); // 24h 统计数据
  const eventSourceRef = useRef<EventSource | null>(null);

  const tokenAddress = params?.address as string;

  // 加载OKB价格
  useEffect(() => {
    const loadOKBPrice = async () => {
      try {
        const response = await tokenAPI.getOKBPrice();
        if (response.success) {
          setOkbPrice(parseFloat(response.data.price));
        }
      } catch (error) {
        console.error('Failed to load OKB price:', error);
      }
    };

    loadOKBPrice();
  }, []);

  // 处理WebSocket代币详情数据
  const handleTokenDetailData = useCallback((data: any) => {
    console.log('[TokenDetailPage] Received WebSocket data:', data);
    console.log('[TokenDetailPage] Data type:', data.type);
    console.log('[TokenDetailPage] Token address from data:', data.data?.address);
    console.log('[TokenDetailPage] Current token address:', tokenAddress);
    
    if (data.type === 'token_detail' || data.type === 'token_detail_update') {
      const tokenData = data.data;
      if (tokenData && tokenData.address === tokenAddress) {
        console.log('[TokenDetailPage] Processing token data:', tokenData);
        console.log('[TokenDetailPage] Token name:', tokenData.name);
        console.log('[TokenDetailPage] Token symbol:', tokenData.symbol);
        // 将后端的snake_case字段映射为前端期望的camelCase
        const mappedToken = {
          ...tokenData,
          // 基本信息字段映射
          imageUrl: tokenData.image_url || tokenData.imageUrl,
          totalSupply: tokenData.total_supply || tokenData.totalSupply,
          currentPrice: tokenData.current_price || tokenData.currentPrice,
          marketCap: tokenData.market_cap || tokenData.marketCap,
          volume24h: tokenData.volume_24h || tokenData.volume24h,
          priceChange24h: tokenData.price_change_24h || tokenData.priceChange24h,
          okbCollected: tokenData.okb_collected || tokenData.okbCollected,
          tokensTraded: tokenData.tokens_traded || tokenData.tokensTraded,
          graduationProgress: parseFloat(tokenData.graduationProgress || tokenData.graduation_progress || tokenData.bonding_progress || '0'),
          curveTradingActive: tokenData.curve_trading_enabled || tokenData.curveTradingActive,
          graduatedAt: tokenData.graduated_at || tokenData.graduatedAt,
          izumiPoolAddress: tokenData.izumi_pool_address || tokenData.izumiPoolAddress,
          holderCount: tokenData.holder_count || tokenData.holderCount,
          transactionCount: tokenData.transaction_count || tokenData.transactionCount,
          isVerified: tokenData.is_verified || tokenData.isVerified || false,
          isFeatured: tokenData.is_featured || tokenData.isFeatured || false,
          isActive: tokenData.is_active || tokenData.isActive,
          createdAt: tokenData.created_at || tokenData.createdAt || new Date().toISOString(),
          updatedAt: tokenData.updated_at || tokenData.updatedAt
        };
        console.log('[TokenDetailPage] Mapped token data:', mappedToken);
        console.log('[TokenDetailPage] graduationProgress after mapping:', mappedToken.graduationProgress, typeof mappedToken.graduationProgress);
        setToken(mappedToken);
        setLoading(false);
        setError(null);
      }
    } else if (data.type === 'price_update') {
      const priceData = data.data;
      if (priceData && priceData.address === tokenAddress) {
        console.log('[TokenDetailPage] Processing price update:', priceData);
        setToken((prevToken: any) => {
          if (!prevToken) return prevToken;
          return {
            ...prevToken,
            currentPrice: priceData.current_price || priceData.currentPrice,
            marketCap: priceData.market_cap || priceData.marketCap,
            volume24h: priceData.volume_24h || priceData.volume24h,
            priceChange24h: priceData.price_change_24h || priceData.priceChange24h,
            high24h: priceData.high_24h || priceData.high24h || prevToken.high24h,
            low24h: priceData.low_24h || priceData.low24h || prevToken.low24h
          };
        });

        // 同时更新 stats24h 状态
        setStats24h((prevStats: any) => ({
          ...prevStats,
          currentPrice: priceData.current_price || priceData.currentPrice,
          priceChange24h: priceData.price_change_24h || priceData.priceChange24h,
          volume24h: priceData.volume_24h || priceData.volume24h,
          high24h: priceData.high_24h || priceData.high24h || prevStats?.high24h,
          low24h: priceData.low_24h || priceData.low24h || prevStats?.low24h,
          updatedAt: new Date().toISOString()
        }));
      }
    }
  }, [tokenAddress]);

  // 初始化WebSocket连接和备用API加载
  useEffect(() => {
    if (!isClient || !tokenAddress) return;

    // 连接WebSocket获取实时代币详情
    const connectionId = websocketService.connect(`tokens/${tokenAddress}/`, handleTokenDetailData);
    
    // 备用API加载（如果WebSocket连接失败）
    const loadTokenDetails = async () => {
      try {
        setLoading(true);
        const [detailResponse, statsResponse] = await Promise.all([
          tokenAPI.getTokenDetails(tokenAddress, 'sepolia'),
          tokenAPI.getToken24hStats(tokenAddress, 'sepolia')
        ]);
        
        if (detailResponse.success) {
          const tokenData = detailResponse.data;
          const statsData = statsResponse.success ? statsResponse.data : { high24h: '0', low24h: '0' };

          // 保存 24h 统计数据
          setStats24h(statsData);
          
          // 将后端的snake_case字段映射为前端期望的camelCase
          setToken({
            ...tokenData,
            // 基本信息字段映射
            imageUrl: tokenData.image_url || tokenData.imageUrl,
            totalSupply: tokenData.total_supply || tokenData.totalSupply,
            currentPrice: tokenData.current_price || tokenData.currentPrice,
            marketCap: tokenData.market_cap || tokenData.marketCap,
            volume24h: tokenData.volume_24h || tokenData.volume24h,
            priceChange24h: tokenData.price_change_24h || tokenData.priceChange24h,
            // 24h统计数据
            high24h: statsData.high24h || tokenData.high24h || '0',
            low24h: statsData.low24h || tokenData.low24h || '0',
            okbCollected: tokenData.okb_collected || tokenData.okbCollected,
            tokensTraded: tokenData.tokens_traded || tokenData.tokensTraded,
            graduationProgress: parseFloat(tokenData.graduationProgress || tokenData.graduation_progress || tokenData.bonding_progress || '0'),
            curveTradingActive: tokenData.curve_trading_enabled || tokenData.curveTradingActive,
            graduatedAt: tokenData.graduated_at || tokenData.graduatedAt,
            izumiPoolAddress: tokenData.izumi_pool_address || tokenData.izumiPoolAddress,
            holderCount: tokenData.holder_count || tokenData.holderCount,
            transactionCount: tokenData.transaction_count || tokenData.transactionCount,
            isVerified: tokenData.is_verified || tokenData.isVerified || false,
            isFeatured: tokenData.is_featured || tokenData.isFeatured || false,
            isActive: tokenData.is_active || tokenData.isActive,
            createdAt: tokenData.created_at || tokenData.createdAt || new Date().toISOString(),
            updatedAt: tokenData.updated_at || tokenData.updatedAt
          });
        } else {
          setError('Failed to load token details');
        }
      } catch (err) {
        console.error('Error loading token details:', err);
        setError('Failed to load token details');
      } finally {
        setLoading(false);
      }
    };

    // 立即加载初始数据，同时尝试WebSocket连接
    loadTokenDetails();
    
    // WebSocket连接状态检查 - 延长等待时间并添加重试机制
    const checkConnectionAndLoad = () => {
      let checkCount = 0;
      const maxChecks = 3;
      
      const checkConnection = () => {
        checkCount++;
        if (websocketService.isConnected(connectionId)) {
          console.log('WebSocket connected successfully');
          return;
        }
        
        if (checkCount < maxChecks) {
          console.log(`WebSocket connection check ${checkCount}/${maxChecks}, retrying...`);
          setTimeout(checkConnection, 2000);
        } else {
          console.log('WebSocket connection failed after multiple attempts, using API only');
        }
      };
      
      setTimeout(checkConnection, 1000); // 首次检查延迟1秒
    };
    
    checkConnectionAndLoad();
    
    // 清理函数
    return () => {
      websocketService.disconnect(connectionId);
    };
  }, [tokenAddress, isClient, handleTokenDetailData]);

  // 移除了SSE相关代码，现在使用WebSocket

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0E0E0E]">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col">
          <SearchHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#70E000] mx-auto mb-4"></div>
              <p className="text-gray-400">Loading token details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex h-screen bg-[#0E0E0E]">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col">
          <SearchHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 text-lg">{error || 'Token not found'}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-6 py-2 bg-[#70E000] text-black rounded-lg hover:bg-[#5BC000] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0E0E0E]">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        <SearchHeader />
        
        <div className="flex-1 overflow-y-auto bg-[#0E0E0E]">
          {/* 主内容区域 - 最大宽度限制 */}
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* 回退按钮 */}
            <div className="flex items-center mb-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
              {/* 左侧内容 - 占据4.5列 */}
              <div className="lg:col-span-4 space-y-6">
                {/* 代币基本信息 */}
                <TokenDetails token={token} />
                
                {/* 代币指标 */}
                <TokenMetrics token={token} okbPrice={okbPrice} showCurrentPrice={true} stats24h={stats24h} />
                
                {/* 图表区域 */}
                <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl">
                  <div className="p-6">
                    <CandlestickChart tokenAddress={tokenAddress} />
                  </div>
                </div>
                
                {/* Trades和Holders组件 */}
                <TradesAndHolders tokenAddress={tokenAddress} />
              </div>
              
              {/* 右侧面板 - 占据1.5列 */}
              <div className="lg:col-span-2">
                <div className="sticky top-6 space-y-6">
                  <TradingPanel token={token} />
          <BondingCurveProgress token={token} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
