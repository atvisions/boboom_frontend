"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/common/Sidebar';
import { SearchHeader } from '@/components/common/SearchHeader';
import { TokenDetails } from '@/components/token/TokenDetails';
import { TradingPanel } from '@/components/token/TradingPanel';
import { TradesAndHolders } from '@/components/token/Trades';
import { BondingCurveProgress } from '@/components/token/BondingCurveProgress';
import { CandlestickChart } from '@/components/token/CandlestickChart';
import { tokenAPI } from '@/services/api';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from '@/components/ui/toast-notification';

export default function TokenDetailPage() {
  const params = useParams();
  const { address, isAuthenticated, isClient } = useWalletAuth();
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tokenAddress = params?.address as string;

  // 加载代币详情
  useEffect(() => {
    if (!isClient || !tokenAddress) return;

    const loadTokenDetails = async () => {
      try {
        setLoading(true);
        const response = await tokenAPI.getTokenDetails(tokenAddress, 'sepolia');
        if (response.success) {
          setToken(response.data);
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

    loadTokenDetails();
  }, [tokenAddress, isClient]);

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
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
              {/* 左侧内容 - 占据4.5列 */}
              <div className="lg:col-span-4 space-y-6">
                {/* 代币基本信息 */}
                <TokenDetails token={token} />
                
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
