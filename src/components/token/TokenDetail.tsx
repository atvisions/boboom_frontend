'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  ExternalLink, 
  Twitter, 
  MessageCircle,
  Globe,
  Copy,
  Star,
  GraduationCap,
  Coins,
  BarChart3,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Heart,
  Share2,
  MoreHorizontal
} from 'lucide-react';
import { notifySuccess, notifyInfo } from '@/lib/notify';
import { useToggleFavorite, useFavoriteStatus } from '@/hooks/useFavorites';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';

// Dynamic import for chart to avoid SSR issues
const ReactEChartsCandles = dynamic(() => import('@/components/charts/ReactEChartsCandles'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center">Loading chart...</div>
});

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  phase: string;
  currentPrice: string;
  marketCap: string;
  volume24h: string;
  priceChange24h: number;
  okbCollected: string;
  tokensTraded: string;
  graduationProgress: number;
  holderCount: number;
  transactionCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  network: string;
  creator: {
    address: string;
    username: string;
    display_name: string;
    is_verified: boolean;
  };
  website?: string;
  twitter?: string;
  telegram?: string;
}

interface CandlestickData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trade_count: number;
  total_okb_volume: number;
  total_token_volume: number;
}

interface RealtimeData {
  currentPrice: string;
  priceChange24h: string;
  marketCap: string;
  fdv: string;
  ath: string;
  athDrop: string;
  volume24h: string;
  holderCount: number;
  transactionCount: number;
  okbCollected: string;
  graduationProgress: number;
  canGraduate: boolean;
  updatedAt: string;
}

interface Transaction {
  hash: string;
  type: 'buy' | 'sell';
  amount: string;
  price: string;
  timestamp: string;
  from: string;
  to: string;
}

interface Holder {
  address: string;
  balance: string;
  percentage: number | string;
  rank: number;
}

export function TokenDetail() {
  const params = useParams();
  const tokenAddress = params.address as string;
  
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [selectedInterval, setSelectedInterval] = useState('1h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address: userAddress } = useAccount();
  const [isClicking, setIsClicking] = useState(false);
  
  // 收藏相关hooks
  const { data: favoriteStatus, isLoading: favoriteLoading } = useFavoriteStatus(
    tokenAddress,
    'sepolia'
  );
  const toggleFavoriteMutation = useToggleFavorite();

  const isFavorite = favoriteStatus?.is_favorited || false;
  const isDisabled = favoriteLoading || toggleFavoriteMutation.isPending || isClicking;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartLib, setChartLib] = useState<'echarts'>('echarts');
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeReceive, setTradeReceive] = useState('');
  
  const eventSourceRef = useRef<EventSource | null>(null);

  // API base URL for development
  const API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://127.0.0.1:8000/api' 
    : '/api';

  // Fetch token data
  const fetchTokenData = async () => {
    try {
      const response = await fetch(`${API_BASE}/tokens/${tokenAddress}/`);
      const data = await response.json();
      
      if (data.success) {
        setTokenData(data.data);
      } else {
        setError('Failed to load token data');
      }
    } catch (err) {
      setError('Error loading token data');
    }
  };

  // Fetch candlestick data
  const fetchCandlestickData = async (interval: string = '1h') => {
    try {
      const limitByInterval: Record<string, number> = { '1m': 300, '5m': 300, '1h': 500, '1d': 400 };
      const limit = limitByInterval[interval] || 500;
      const response = await fetch(`${API_BASE}/tokens/${tokenAddress}/price-history?interval=${interval}&limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setCandlestickData(data.data.candles);
      }
    } catch (err) {
      console.error('Error fetching candlestick data:', err);
    }
  };

  // Fetch transactions
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(true);
  const fetchTransactions = async (page: number = 1) => {
    try {
      const response = await fetch(`${API_BASE}/tokens/${tokenAddress}/transactions?page=${page}&page_size=10`);
      const data = await response.json();
      
      if (data.success) {
        if (page === 1) setTransactions(data.data);
        else setTransactions(prev => [...prev, ...data.data]);
        setTxHasMore(data.hasMore);
        setTxPage(page);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  // Fetch holders
  const [holdersPage, setHoldersPage] = useState(1);
  const [holdersHasMore, setHoldersHasMore] = useState(true);
  const fetchHolders = async (page: number = 1) => {
    try {
      const response = await fetch(`${API_BASE}/tokens/${tokenAddress}/holders?page=${page}&page_size=10`);
      const data = await response.json();
      
      if (data.success) {
        if (page === 1) setHolders(data.data);
        else setHolders(prev => [...prev, ...data.data]);
        setHoldersHasMore(data.hasMore);
        setHoldersPage(page);
      }
    } catch (err) {
      console.error('Error fetching holders:', err);
    }
  };

  // Setup real-time updates
  const setupRealtimeUpdates = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`${API_BASE}/tokens/${tokenAddress}/realtime`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connected') {
        console.log('Real-time connection established');
      } else if (data.type === 'token_update') {
        setRealtimeData(data.data);
      } else if (data.type === 'error') {
        console.error('Real-time update error:', data.message);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Real-time connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  };

  // Copy address to clipboard
  const copyAddress = () => {
    navigator.clipboard.writeText(tokenAddress);
    notifySuccess('Address copied to clipboard');
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    if (isDisabled) return;
    
    if (!userAddress) {
      notifyInfo('Connect Wallet', 'Please connect your wallet to favorite tokens');
      return;
    }

    setIsClicking(true);
    
    try {
      await toggleFavoriteMutation.mutateAsync({
        tokenAddress: tokenAddress,
        network: 'sepolia',
      });
    } catch (error) {
      // 错误已在 useFavorites hook 中处理
    } finally {
      setTimeout(() => setIsClicking(false), 500);
    }
  };

  useEffect(() => {
    if (tokenAddress) {
      setLoading(true);
      const timeoutId = setTimeout(() => setLoading(false), 5000);
      Promise.allSettled([
        fetchTokenData(),
        fetchCandlestickData(selectedInterval),
        fetchTransactions(),
        fetchHolders(),
      ]).finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
      setupRealtimeUpdates();
      return () => {
        clearTimeout(timeoutId);
      };
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [tokenAddress]);

  useEffect(() => {
    fetchCandlestickData(selectedInterval);
  }, [selectedInterval]);

  // Safe current price (string) for trade calculations
  const currentPrice = realtimeData?.currentPrice || tokenData?.currentPrice || '';

  // Keep hook order consistent: derive receive amount whenever inputs change
  useEffect(() => {
    const receive = calculateTradeReceive(tradeAmount);
    setTradeReceive(receive);
  }, [tradeAmount, tradeMode, currentPrice]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Token not found'}</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num < 0.000001) return `$${num.toExponential(2)}`;
    if (num < 0.01) return `$${num.toFixed(8)}`;
    if (num < 1) return `$${num.toFixed(6)}`;
    return `$${num.toFixed(2)}`;
  };

  const formatMarketCap = (marketCap: string) => {
    const num = parseFloat(marketCap);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPriceChange = (change: string) => {
    const num = parseFloat(change);
    if (isNaN(num)) return '0.00%';
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'CREATED': return 'bg-blue-100 text-blue-800';
      case 'CURVE': return 'bg-green-100 text-green-800';
      case 'GRADUATING': return 'bg-yellow-100 text-yellow-800';
      case 'GRADUATED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1h ago';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
  };

  // Calculate trade receive amount
  function calculateTradeReceive(amount: string): string {
    if (!amount || !currentPrice) return '';
    const numAmount = parseFloat(amount);
    const numPrice = parseFloat(currentPrice);
    if (isNaN(numAmount) || isNaN(numPrice) || numPrice === 0) return '';
    if (tradeMode === 'buy') {
      const tokensReceived = numAmount / numPrice;
      return tokensReceived.toFixed(6);
    } else {
      const okbReceived = numAmount * numPrice;
      return okbReceived.toFixed(6);
    }
  }

  const priceChange24h = realtimeData?.priceChange24h || tokenData.priceChange24h.toString();
  const marketCap = realtimeData?.marketCap || tokenData.marketCap;
  const volume24h = realtimeData?.volume24h || tokenData.volume24h;
  const holderCount = realtimeData?.holderCount || tokenData.holderCount;
  const transactionCount = realtimeData?.transactionCount || tokenData.transactionCount;
  const graduationProgress = realtimeData?.graduationProgress || tokenData.graduationProgress;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4">
            {/* Logo */}
            <div className="relative">
              <img 
                src={tokenData.imageUrl || `https://avatar.vercel.sh/${tokenAddress}.png?size=64`} 
                alt={tokenData.name}
                className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://avatar.vercel.sh/${tokenAddress}.png?size=64`;
                }}
              />
              {tokenData.isVerified && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Token Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-3xl font-bold text-white">{tokenData.name}</h1>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  {tokenData.symbol}
                </Badge>
                {tokenData.isVerified && (
                  <Badge variant="default" className="bg-blue-500 text-white">
                    Verified
                  </Badge>
                )}
              </div>
              
              {/* Contract Address */}
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-gray-400 text-sm">Contract:</span>
                <span className="font-mono text-sm text-white">
                  {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
                </span>
                <Button variant="ghost" size="sm" onClick={copyAddress} className="h-6 w-6 p-0">
                  <Copy className="w-3 h-3" />
                </Button>
                <a 
                  href={`https://sepolia.etherscan.io/address/${tokenAddress}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              {/* Description */}
              {tokenData.description && (
                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                  {tokenData.description}
                </p>
              )}
              
              {/* Creator Info */}
              {tokenData.creator && tokenData.creator.address && (
                <div className="flex items-center space-x-3 mt-3">
                  <span className="text-gray-400 text-sm">Created by:</span>
                  <div className="flex items-center space-x-2">
                    <img 
                      src={`https://avatar.vercel.sh/${tokenData.creator.address}.png?size=32`}
                      alt="Creator"
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/40"
                      onError={(e) => {
                        e.currentTarget.src = `https://avatar.vercel.sh/${tokenData.creator.address}.png?size=32`;
                      }}
                    />
                    <span className="font-mono text-sm text-white">
                      {tokenData.creator.address.slice(0, 6)}...{tokenData.creator.address.slice(-4)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => {
                      navigator.clipboard.writeText(tokenData.creator.address);
                      notifySuccess('Creator address copied to clipboard');
                    }} className="h-6 w-6 p-0">
                      <Copy className="w-3 h-3" />
                    </Button>
                    <a 
                      href={`/profile/${tokenData.creator.address}`}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
              
              {/* Social Links */}
              <div className="flex items-center space-x-3 mt-3">
                {tokenData.website && (
                  <a 
                    href={tokenData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-lg transition-all duration-200"
                    title="Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {tokenData.twitter && (
                  <a 
                    href={tokenData.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-lg transition-all duration-200"
                    title="Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {tokenData.telegram && (
                  <a 
                    href={tokenData.telegram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-lg transition-all duration-200"
                    title="Telegram"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleFavorite}
              disabled={isDisabled}
              className="p-2 h-10 w-10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                !userAddress 
                  ? "Connect wallet first" 
                  : isFavorite 
                    ? "Remove from favorites" 
                    : "Add to favorites"
              }
            >
              {isDisabled ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-yellow-400 rounded-full animate-spin" />
              ) : (
                <Star className={`w-4 h-4 transition-all duration-200 ${
                  isFavorite 
                    ? 'text-yellow-400 fill-current' 
                    : userAddress
                      ? 'text-gray-400 group-hover:text-yellow-400'
                      : 'text-gray-600'
                }`} />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="p-2 h-10 w-10 hover:bg-white/10"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Price and Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#17182D] border-0">
              <CardContent className="px-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-sm">Current Price</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-0.5">
                  {formatPrice(currentPrice)}
                </div>
                <div className={`text-sm font-medium ${parseFloat(priceChange24h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPriceChange(priceChange24h)} (24h)
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#17182D] border-0">
              <CardContent className="px-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-sm">Market Cap</span>
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-0.5">
                  {formatMarketCap(marketCap)}
                </div>
                <div className="text-sm text-gray-400">
                  {holderCount} holders
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#17182D] border-0">
              <CardContent className="px-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-sm">24h Volume</span>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-0.5">
                  {formatVolume(volume24h)}
                </div>
                <div className="text-sm text-gray-400">
                  {transactionCount} transactions
                </div>
              </CardContent>
            </Card>
          </div>



          {/* Chart */}
          <Card className="bg-[#17182D] border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-8 bg-gradient-to-b from-green-400 to-blue-500 rounded-full"></div>
                <CardTitle className="text-white text-lg font-semibold">Price Chart</CardTitle>
              </div>
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                {[
                  {label: '1M', value: '1m'},
                  {label: '5M', value: '5m'},
                  {label: '1H', value: '1h'},
                  {label: '1D', value: '1d'},
                ].map(({label, value}) => (
                  <Button
                    key={value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInterval(value)}
                    className={`text-xs px-3 py-1 rounded-md transition-all duration-200 ${
                      selectedInterval === value 
                        ? 'bg-white/20 text-white shadow-sm' 
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
                <ReactEChartsCandles 
                  data={candlestickData}
                  symbol={tokenData.symbol}
                  interval={selectedInterval as '1m'|'5m'|'1h'|'1d'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card className="bg-[#17182D] border-0 p-4">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex w-full bg-white/5 rounded-lg p-1">
                  <TabsTrigger value="overview" className="flex-1 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-md transition-all">Overview</TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-md transition-all">Activity</TabsTrigger>
                  <TabsTrigger value="holders" className="flex-1 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-md transition-all">Holders</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="px-4 py-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Token Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-400">
                          Network: <span className="text-white">{tokenData.network}</span>
                        </div>
                        <div className="text-gray-400">
                          Phase: <span className="text-white">{tokenData.phase}</span>
                        </div>
                        <div className="text-gray-400">
                          Created: <span className="text-white">{getTimeAgo(tokenData.createdAt)}</span>
                        </div>
                        <div className="text-gray-400">
                          Last Updated: <span className="text-white">{getTimeAgo(tokenData.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
                      <div className="flex space-x-4">
                        {tokenData.website && (
                          <a href={tokenData.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-white">
                            <Globe className="w-4 h-4" />
                            <span>Website</span>
                          </a>
                        )}
                        {tokenData.twitter && (
                          <a href={tokenData.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-white">
                            <Twitter className="w-4 h-4" />
                            <span>Twitter</span>
                          </a>
                        )}
                        {tokenData.telegram && (
                          <a href={tokenData.telegram} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-white">
                            <MessageCircle className="w-4 h-4" />
                            <span>Telegram</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="px-4 py-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                    {transactions.length > 0 ? (
                      transactions.map((tx, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${tx.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                              {tx.type === 'buy' ? (
                                <ArrowUpRight className="w-4 h-4 text-green-400" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4 text-red-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {tx.type === 'buy' ? 'Buy' : 'Sell'} {formatVolume(tx.amount)}
                              </div>
                              <div className="text-gray-400 text-sm">
                                {formatPrice(tx.price)} per token
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white text-sm">{getTimeAgo(tx.timestamp)}</div>
                            <div className="text-gray-400 text-xs">
                              {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-8">No transactions found</div>
                    )}
                    {txHasMore && (
                      <div className="pt-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => fetchTransactions(txPage + 1)}>Load more</Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="holders" className="p-4 py-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Top Holders</h3>
                    {holders.length > 0 ? (
                      holders.map((holder, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-primary text-sm font-medium">#{holder.rank}</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                              </div>
                              <div className="text-gray-400 text-sm">
                                {formatVolume(holder.balance)} tokens
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">{Number(holder.percentage).toFixed(2)}%</div>
                            <div className="text-gray-400 text-sm">of supply</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-8">No holders found</div>
                    )}
                    {holdersHasMore && (
                      <div className="pt-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => fetchHolders(holdersPage + 1)}>Load more</Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Trading Panel - Fixed on Right */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Trading Card */}
            <Card className="bg-[#17182D] border-0">
              <CardHeader>
                <CardTitle className="text-white">Trade {tokenData.symbol}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Buy/Sell Toggle */}
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button 
                    onClick={() => setTradeMode('buy')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      tradeMode === 'buy' 
                        ? 'bg-green-600 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => setTradeMode('sell')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      tradeMode === 'sell' 
                        ? 'bg-red-600 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Amount ({tradeMode === 'buy' ? 'OKB' : tokenData.symbol})
                    </label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      You'll receive ({tradeMode === 'buy' ? tokenData.symbol : 'OKB'})
                    </label>
                    <input
                      type="text"
                      placeholder="0.0"
                      value={tradeReceive}
                      readOnly
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                </div>

                <Button 
                  className={`w-full text-white ${
                    tradeMode === 'buy' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {tradeMode === 'buy' ? 'Buy' : 'Sell'} {tokenData.symbol}
                </Button>

                <div className="pt-4 border-t border-white/10">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price Impact</span>
                      <span className="text-white">0.12%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Slippage</span>
                      <span className="text-white">0.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fee</span>
                      <span className="text-white">1%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Graduation Progress */}
            <Card className="bg-[#17182D] border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <GraduationCap className="w-5 h-5 text-yellow-400" />
                  <span>Graduation Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Progress to Graduation</span>
                    <span className="text-white font-semibold">{graduationProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(graduationProgress, 100)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-gray-400">
                      OKB Collected: <span className="text-white">{parseFloat(tokenData.okbCollected).toFixed(2)} OKB</span>
                    </div>
                    <div className="text-gray-400">
                      Tokens Traded: <span className="text-white">{formatVolume(tokenData.tokensTraded)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

