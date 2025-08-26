"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { TokenDetail } from '@/types/tokenDetail';
import { TokenDetailService } from '@/services/tokenDetailService';
import { PriceChart } from '@/components/tokens/detail/PriceChart';
import { TransactionHistory } from '@/components/tokens/detail/TransactionHistory';
import { HoldersList } from '@/components/tokens/detail/HoldersList';
import { TradingPanel } from '@/components/tokens/detail/TradingPanel';
import { GraduationProgress } from '@/components/tokens/detail/GraduationProgress';
import { useToggleFavorite, useFavoriteStatus } from '@/hooks/useFavorites';
import { useAccount } from 'wagmi';
import { useToast } from '@/contexts/ToastContext';

interface TokenDetailPageProps {
  params: { address: string };
}

export default function TokenDetailPage({ params }: TokenDetailPageProps) {
  const [token, setToken] = useState<TokenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [okbPrice, setOkbPrice] = useState<number>(169); // Default fallback price
  
  // 收藏相关hooks
  const { address: userAddress } = useAccount();
  const { data: favoriteStatus, isLoading: favoriteLoading } = useFavoriteStatus(
    params.address,
    'sepolia'
  );
  const toggleFavoriteMutation = useToggleFavorite();
  
  const isFavorited = favoriteStatus?.is_favorited || false;
  const isDisabled = favoriteLoading || toggleFavoriteMutation.isPending;
  const { showToast } = useToast();
  
  // 动态数据状态
  const [marketCapChange, setMarketCapChange] = useState<{ change: string; percentage: string }>({ change: '+$0', percentage: '+0.00%' });
  const [ath, setAth] = useState<string>('$0');
  const [priceChanges, setPriceChanges] = useState<{ fiveMin: string; oneHour: string; sixHour: string }>({
    fiveMin: '0.00%',
    oneHour: '0.00%',
    sixHour: '0.00%'
  });

  useEffect(() => {
    fetchTokenDetail();
    fetchOkbPrice();
    fetchTokenMetrics();
  }, [params.address]);

  const fetchOkbPrice = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/tokens/okb-price/`);
      const data = await response.json();
      if (data.success) {
        setOkbPrice(parseFloat(data.data.price));
      }
    } catch (error) {
      console.warn('Failed to fetch OKB price, using fallback:', error);
    }
  };

  const fetchTokenMetrics = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/tokens/${params.address}/metrics/?network=sepolia&t=${Date.now()}`, {
        cache: 'no-cache'
      });
      const data = await response.json();
      console.log('Token metrics response:', data);
      if (data.success && data.data) {
        setMarketCapChange(data.data.market_cap_change || { change: '+$0', percentage: '+0.00%' });
        setAth(data.data.ath || '$0');
        setPriceChanges({
          fiveMin: data.data.price_changes?.five_min || '0.00%',
          oneHour: data.data.price_changes?.one_hour || '0.00%',
          sixHour: data.data.price_changes?.six_hour || '0.00%'
        });
      }
    } catch (error) {
      console.warn('Failed to fetch token metrics, using fallback:', error);
      setMarketCapChange({ change: '+$0', percentage: '+0.00%' });
      setAth('$0');
      setPriceChanges({
        fiveMin: '0.00%',
        oneHour: '0.00%',
        sixHour: '0.00%'
      });
    }
  };

  const fetchTokenDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TokenDetailService.getTokenDetail(params.address);
      setToken(data);
    } catch (err) {
      console.error('Error fetching token detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to load token details');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionComplete = () => {
    fetchTokenDetail();
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(token.address);
      showToast('Contract address copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy address', 'error');
    }
  };

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDisabled) {
      return;
    }
    
    if (!userAddress) {
      showToast('Please connect your wallet to favorite tokens', 'info');
      return;
    }
    
    try {
      await toggleFavoriteMutation.mutateAsync({
        tokenAddress: params.address,
        network: 'sepolia',
      });
    } catch (error) {
      // 错误已在 useFavorites hook 中处理
    }
  }, [isDisabled, userAddress, toggleFavoriteMutation, params.address, showToast]);

  // Format market cap properly - use backend calculated value
  const formatMarketCap = (marketCap: string) => {
    const mcap = parseFloat(marketCap);
    if (mcap > 0) {
      return TokenDetailService.formatNumber(mcap);
    }
    return '0';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B1A]">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-white/10 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-6 bg-white/10 rounded mb-2 w-48"></div>
                <div className="h-4 bg-white/10 rounded w-32"></div>
              </div>
            </div>
            
            {/* Main layout skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/5 rounded-xl p-6 h-64"></div>
                <div className="bg-white/5 rounded-xl p-6 h-96"></div>
              </div>
              <div className="bg-white/5 rounded-xl p-6 h-[600px]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0B1A]">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">Failed to Load</h1>
            <p className="text-gray-400 mb-6">{error || 'Token not found'}</p>
            <button
              onClick={fetchTokenDetail}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0A0B1A]">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Token Not Found</h1>
            <p className="text-gray-400">Please check the token address</p>
          </div>
        </div>
      </div>
    );
  }

  const { text: phaseText, color: phaseColor } = TokenDetailService.getPhaseText(token.phase);
  const marketCap = formatMarketCap(token.market_cap);

  return (
    <div className="min-h-screen bg-[#0A0B1A]">
      <div className="container mx-auto px-4 py-8">
        {/* Header - Optimized Layout with Contract Address & Favorite */}
        <div className="space-y-6 mb-8">
          {/* Top Row: Token Info & Actions */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Left: Logo, Name, Symbol, Metadata */}
            <div className="flex items-start gap-6 flex-1">
              <img 
                src={token.image_url || `https://avatar.vercel.sh/${token.address}.png?size=64`}
                alt={token.name}
                className="w-16 h-16 rounded-xl bg-white/10 flex-shrink-0 border-2 border-yellow-500/30"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://avatar.vercel.sh/${token.address}.png?size=64`;
                }}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{token.name}</h1>
                  <span className="text-xl text-green-400">{token.symbol}</span>
                  {token.is_verified && (
                    <span className="text-blue-400" title="Verified">✓</span>
                  )}
                  {token.is_featured && (
                    <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                
                {/* Token Description */}
                <div className="text-gray-300 text-sm mb-3 leading-relaxed">
                  {token.description || "No description available for this token."}
                </div>
                
                {/* Metadata Row */}
                <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                  <img 
                    src={`https://avatar.vercel.sh/${token.creator.address}.png?size=16`}
                    alt="Creator"
                    className="w-4 h-4 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://avatar.vercel.sh/${token.creator.address}.png?size=16`;
                    }}
                  />
                  <span>{TokenDetailService.formatAddress(token.creator.address)}</span>
                  <span>🌿</span>
                  <span>{new Date(token.created_at).toLocaleDateString()}</span>
                  <span>↻</span>
                  <span>{token.graduation_progress.toFixed(1)}% bonded</span>
                </div>

                {/* Contract Address */}
                <div className="flex items-center gap-2 mb-3">
                  <button 
                    onClick={handleCopyAddress}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm transition-colors"
                    title="Copy contract address"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {token.address.slice(0, 6)}...{token.address.slice(-4)}
                  </button>
                  
                  {/* External Explorer Link */}
                  <a
                    href={`https://sepolia.etherscan.io/address/${token.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-sm transition-colors"
                    title="View on Etherscan"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Explorer
                  </a>
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-4">
                  {token.website && (
                    <a
                      href={token.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd"/>
                      </svg>
                      Website
                    </a>
                  )}
                  {token.twitter && (
                    <a
                      href={token.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Twitter
                    </a>
                  )}
                  {token.telegram && (
                    <a
                      href={token.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                      </svg>
                      Telegram
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
                Share
              </button>
              <button 
                onClick={handleFavoriteClick}
                disabled={isDisabled}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  !userAddress 
                    ? "Connect wallet first" 
                    : isFavorited 
                      ? "Remove from favorites" 
                      : "Add to favorites"
                }
              >
                {isDisabled ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-yellow-400 rounded-full animate-spin" />
                ) : (
                  <svg 
                    className={`w-4 h-4 transition-all duration-200 ${
                      isFavorited 
                        ? 'text-yellow-400 fill-current' 
                        : userAddress
                          ? 'text-gray-400 group-hover:text-yellow-400'
                          : 'text-gray-600'
                    }`} 
                    viewBox="0 0 24 24" 
                    fill={isFavorited ? "currentColor" : "none"}
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Row: Market Cap & Progress */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 pt-6 border-t border-white/10">
            {/* Left: Market Cap */}
            <div className="flex-1">
              <div className="text-gray-400 text-sm mb-1">Market Cap</div>
              <div className="text-white text-2xl font-bold mb-1">${marketCap}</div>
              <div className="text-green-400 text-sm">
                {marketCapChange?.change || '+$0'} ({marketCapChange?.percentage || '+0.00%'}) 24hr
              </div>
            </div>

            {/* Right: Progress & ATH */}
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(token.graduation_progress, 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-gray-400 text-sm whitespace-nowrap">
                ATH {ath || '$0'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout - Left: Content, Right: Trading Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Token Information */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price Chart */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Price Chart</h3>
              <PriceChart tokenAddress={token.address} />
            </div>

            {/* Stats Cards - 5 Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Vol 24h</div>
                <div className="text-white text-sm font-medium">
                  ${TokenDetailService.formatNumber(parseFloat(token.volume_24h) * okbPrice)}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Price</div>
                <div className="text-white text-sm font-medium">
                  {TokenDetailService.formatPrice(token.current_price)}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">5m</div>
                <div className={`text-sm font-medium ${
                  priceChanges.fiveMin?.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {priceChanges.fiveMin || '0.00%'}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">1h</div>
                <div className={`text-sm font-medium ${
                  priceChanges.oneHour?.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {priceChanges.oneHour || '0.00%'}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">6h</div>
                <div className={`text-sm font-medium ${
                  priceChanges.sixHour?.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {priceChanges.sixHour || '0.00%'}
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Transactions</h3>
              <TransactionHistory tokenAddress={token.address} />
            </div>

            {/* Holders List */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Holders</h3>
              <HoldersList tokenAddress={token.address} />
            </div>
          </div>

          {/* Right Column - Trading Panel and Graduation Progress */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <TradingPanel
                token={token}
                onTransactionComplete={handleTransactionComplete}
              />
              
              {/* Graduation Progress */}
              <GraduationProgress token={token} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}