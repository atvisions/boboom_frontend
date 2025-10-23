"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/common/SearchHeader";
import { TokenDetails } from "@/components/token/TokenDetails";
import { TokenMetrics } from "@/components/token/TokenMetrics";
import { TradingPanel } from "@/components/token/TradingPanel";
import { TradesAndHolders } from "@/components/token/Trades";
import { BondingCurveProgress } from "@/components/token/BondingCurveProgress";
import { CandlestickChart } from "@/components/token/CandlestickChart";

import { tokenAPI, userAPI, clearApiCache } from "@/services/api";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { toast } from "@/components/ui/toast-notification";
import websocketService from "@/services/websocket";
import { useTokenFactoryWorking as useTokenFactory } from "@/hooks/useTokenFactoryWorking";
import { NETWORK_CONFIG } from "@/contracts/config-simple";

interface TokenDetailPageClientProps {
  address: string;
}

export default function TokenDetailPageClient({
  address: tokenAddress,
}: TokenDetailPageClientProps) {
  const { address, isAuthenticated, isClient } = useWalletAuth();
  const [token, setToken] = useState<any>(null);
  const [okbPrice, setOkbPrice] = useState<number>(177.6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTokenBalance, setUserTokenBalance] = useState<string>("0"); // 用户代币余额
  const [stats24h, setStats24h] = useState<any>(null); // 24h 统计数据
  const [chartRefreshKey, setChartRefreshKey] = useState<number>(0); // 用于强制刷新图表
  const eventSourceRef = useRef<EventSource | null>(null);

  // 加载OKB价格
  useEffect(() => {
    const loadOKBPrice = async () => {
      try {
        const response = await tokenAPI.getOKBPrice();
        if (response.success) {
          setOkbPrice(parseFloat(response.data.price));
        }
      } catch (error) {
        // 静默处理OKB价格加载失败
      }
    };

    loadOKBPrice();
  }, []);

  // WebSocket推送计数器
  const wsCounterRef = useRef({
    token_detail: 0,
    token_detail_update: 0,
    price_update: 0,
    total: 0,
  });

  // 处理WebSocket代币详情数据
  const handleTokenDetailData = useCallback(
    (data: any) => {
      // 更新推送计数器
      wsCounterRef.current.total += 1;
      if (data.type in wsCounterRef.current) {
        wsCounterRef.current[
          data.type as keyof typeof wsCounterRef.current
        ] += 1;
      }

      // 简化的WebSocket推送日志
      if (data.type === "price_update") {
      }
      if (data.type === "token_detail" || data.type === "token_detail_update") {
        const tokenData = data.data;
        if (tokenData && tokenData.address === tokenAddress) {
          // 仅在ATH为空时记录详细信息
          if (!tokenData.ath && !tokenData.ath_price) {
          }

          // 将后端的snake_case字段映射为前端期望的camelCase
          const mappedToken = {
            ...tokenData,
            // 基本信息字段映射
            imageUrl: tokenData.image_url || tokenData.imageUrl,
            totalSupply: tokenData.total_supply || tokenData.totalSupply,
            currentPrice: tokenData.current_price || tokenData.currentPrice,
            marketCap: tokenData.market_cap || tokenData.marketCap,
            volume24h: tokenData.volume_24h || tokenData.volume24h,
            priceChange24h:
              tokenData.change_24h ||
              tokenData.price_change_24h ||
              tokenData.priceChange24h,
            ath: tokenData.ath || tokenData.ath_price || "0",
            okbCollected: tokenData.okb_collected || tokenData.okbCollected,
            tokensTraded: tokenData.tokens_traded || tokenData.tokensTraded,
            graduationProgress: parseFloat(
              tokenData.graduationProgress ||
                tokenData.graduation_progress ||
                tokenData.bonding_progress ||
                "0"
            ),
            curveTradingActive:
              tokenData.curve_trading_enabled || tokenData.curveTradingActive,
            graduatedAt: tokenData.graduated_at || tokenData.graduatedAt,
            izumiPoolAddress:
              tokenData.izumi_pool_address || tokenData.izumiPoolAddress,
            holderCount: tokenData.holder_count || tokenData.holderCount,
            transactionCount:
              tokenData.transaction_count || tokenData.transactionCount,
            isVerified: tokenData.is_verified || tokenData.isVerified || false,
            isFeatured: tokenData.is_featured || tokenData.isFeatured || false,
            isActive: tokenData.is_active || tokenData.isActive,
            createdAt:
              tokenData.created_at ||
              tokenData.createdAt ||
              new Date().toISOString(),
            updatedAt: tokenData.updated_at || tokenData.updatedAt,
          };

          // 仅在ATH为0时记录警告
          if (!mappedToken.ath || mappedToken.ath === "0") {
          }

          setToken(mappedToken);
          setLoading(false);
          setError(null);
        }
      } else if (data.type === "price_update") {
        const priceData = data.data;
        if (priceData && priceData.address === tokenAddress) {
          // 仅在ATH数据异常时记录
          if (!priceData.ath && !priceData.ath_price) {
          }

          setToken((prevToken: any) => {
            if (!prevToken) return prevToken;

            // 只有当WebSocket消息包含有效的ATH数据时才更新，否则保持原值
            const hasValidAth = priceData.ath || priceData.ath_price;
            const finalAth = hasValidAth
              ? priceData.ath || priceData.ath_price
              : prevToken.ath;

            // 仅在ATH被重置为0时记录警告
            if (prevToken.ath && prevToken.ath !== "0" && finalAth === "0") {
            }

            const updatedToken = {
              ...prevToken,
              currentPrice: priceData.current_price || priceData.currentPrice,
              marketCap: priceData.market_cap || priceData.marketCap,
              volume24h: priceData.volume_24h || priceData.volume24h,
              priceChange24h:
                priceData.change_24h ||
                priceData.price_change_24h ||
                priceData.priceChange24h,
              ath: finalAth,
              high24h:
                priceData.high_24h || priceData.high24h || prevToken.high24h,
              low24h: priceData.low_24h || priceData.low24h || prevToken.low24h,
            };

            // 仅在ATH异常时记录
            if (!updatedToken.ath || updatedToken.ath === "0") {
            }

            return updatedToken;
          });

          // 同时更新 stats24h 状态，确保所有组件都能获得最新数据
          const updatedStats = {
            currentPrice: priceData.current_price || priceData.currentPrice,
            priceChange24h:
              priceData.change_24h ||
              priceData.price_change_24h ||
              priceData.priceChange24h,
            volume24h: priceData.volume_24h || priceData.volume24h,
            high24h: priceData.high_24h || priceData.high24h,
            low24h: priceData.low_24h || priceData.low24h,
            updatedAt: new Date().toISOString(),
          };

          setStats24h((prevStats: any) => ({
            ...prevStats,
            ...updatedStats,
          }));
        }
      }
    },
    [tokenAddress]
  );

  // 初始化WebSocket连接和备用API加载
  useEffect(() => {
    if (!isClient || !tokenAddress) return;

    // 清除浏览器缓存
    if (typeof window !== "undefined") {
      // 清除可能的localStorage缓存
      const cacheKeys = Object.keys(localStorage).filter(
        (key) => key.includes("token_") || key.includes(tokenAddress)
      );
      cacheKeys.forEach((key) => localStorage.removeItem(key));
    }

    // 连接WebSocket获取实时代币详情
    const connectionId = websocketService.connect(
      `tokens/${tokenAddress}/`,
      handleTokenDetailData
    );

    // 备用API加载（如果WebSocket连接失败）
    const loadTokenDetails = async () => {
      try {
        // 清除相关缓存
        clearApiCache("token_details");
        clearApiCache("token_24h_stats");

        setLoading(true);
        const [detailResponse, statsResponse] = await Promise.all([
          tokenAPI.getTokenDetails(tokenAddress, NETWORK_CONFIG.NETWORK_NAME),
          tokenAPI.getToken24hStats(tokenAddress, NETWORK_CONFIG.NETWORK_NAME),
        ]);

        if (detailResponse.success) {
          const tokenData = detailResponse.data;
          const statsData = statsResponse.success
            ? statsResponse.data
            : { high24h: "0", low24h: "0" };

          // 仅在API返回的ATH数据异常时记录
          if (!tokenData.ath && !tokenData.ath_price) {
          }

          // 保存 24h 统计数据
          setStats24h(statsData);

          // 将后端的snake_case字段映射为前端期望的camelCase
          const mappedToken = {
            ...tokenData,
            // 基本信息字段映射
            imageUrl: tokenData.image_url || tokenData.imageUrl,
            totalSupply: tokenData.total_supply || tokenData.totalSupply,
            currentPrice: tokenData.current_price || tokenData.currentPrice,
            marketCap: tokenData.market_cap || tokenData.marketCap,
            volume24h: tokenData.volume_24h || tokenData.volume24h,
            priceChange24h:
              tokenData.change_24h ||
              tokenData.price_change_24h ||
              tokenData.priceChange24h,
            ath: tokenData.ath || tokenData.ath_price || "0",
            // 24h统计数据
            high24h: statsData.high24h || tokenData.high24h || "0",
            low24h: statsData.low24h || tokenData.low24h || "0",
            okbCollected: tokenData.okb_collected || tokenData.okbCollected,
            tokensTraded: tokenData.tokens_traded || tokenData.tokensTraded,
            graduationProgress: parseFloat(
              tokenData.graduationProgress ||
                tokenData.graduation_progress ||
                tokenData.bonding_progress ||
                "0"
            ),
            curveTradingActive:
              tokenData.curve_trading_enabled || tokenData.curveTradingActive,
            graduatedAt: tokenData.graduated_at || tokenData.graduatedAt,
            izumiPoolAddress:
              tokenData.izumi_pool_address || tokenData.izumiPoolAddress,
            holderCount: tokenData.holder_count || tokenData.holderCount,
            transactionCount:
              tokenData.transaction_count || tokenData.transactionCount,
            isVerified: tokenData.is_verified || tokenData.isVerified || false,
            isFeatured: tokenData.is_featured || tokenData.isFeatured || false,
            isActive: tokenData.is_active || tokenData.isActive,
            createdAt:
              tokenData.created_at ||
              tokenData.createdAt ||
              new Date().toISOString(),
            updatedAt: tokenData.updated_at || tokenData.updatedAt,
          };

          setToken(mappedToken);
        } else {
          setError("Failed to load token details");
        }
      } catch (err) {
        // 静默处理代币详情加载失败
        setError("Failed to load token details");
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
          return;
        }

        if (checkCount < maxChecks) {
          setTimeout(checkConnection, 2000);
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
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#70E000] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading token details...</p>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error || "Token not found"}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-[#70E000] text-black rounded-lg hover:bg-[#5BC000] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
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
          <TokenMetrics
            token={token}
            okbPrice={okbPrice}
            showCurrentPrice={true}
            stats24h={stats24h}
          />

          {/* 图表区域 */}
          <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl">
            <div className="p-3 md:p-6">
              <CandlestickChart
                tokenAddress={tokenAddress}
                stats24h={stats24h}
              />
            </div>
          </div>

          {/* Trades和Holders组件（包含Overview Tab） */}
          <TradesAndHolders
            tokenAddress={tokenAddress}
            token={token}
            okbPrice={okbPrice}
          />
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
  );
}
