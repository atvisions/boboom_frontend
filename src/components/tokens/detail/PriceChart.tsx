"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PriceHistoryPoint } from '@/types/tokenDetail';
import { TokenDetailService } from '@/services/tokenDetailService';

interface PriceChartProps {
  tokenAddress: string;
  network?: string;
}

interface ChartTimeframe {
  key: string;
  label: string;
  interval: string;
}

const timeframes: ChartTimeframe[] = [
  { key: '1h', label: '1H', interval: '1h' },
  { key: '4h', label: '4H', interval: '4h' },
  { key: '1d', label: '1D', interval: '1d' },
  { key: '1w', label: '1W', interval: '1w' },
];

export function PriceChart({ tokenAddress, network = 'sepolia' }: PriceChartProps) {
  const [priceData, setPriceData] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState('1d');

  useEffect(() => {
    fetchPriceHistory();
  }, [tokenAddress, network, activeTimeframe]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentTimeframe = timeframes.find(t => t.key === activeTimeframe);
      const interval = currentTimeframe?.interval || '1d';
      
      const data = await TokenDetailService.getPriceHistory(tokenAddress, network, interval);
      
      // Convert data format for chart display
      const chartData = data.map(point => ({
        ...point,
        priceNum: parseFloat(point.price),
        marketCapNum: parseFloat(point.marketCap),
        time: new Date(point.timestamp).getTime(),
        displayTime: formatTimeForChart(point.timestamp, interval),
      }));

      setPriceData(chartData);
    } catch (err) {
      console.error('Error fetching price history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load price data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeForChart = (timestamp: string, interval: string): string => {
    const date = new Date(timestamp);
    
    switch (interval) {
      case '1h':
      case '4h':
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      case '1d':
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      case '1w':
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleDateString('zh-CN');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">{data.displayTime}</p>
          <p className="text-white font-semibold">
            Price: {TokenDetailService.formatPrice(data.priceNum)}
          </p>
          <p className="text-gray-400 text-sm">
            Market Cap: ${TokenDetailService.formatNumber(data.marketCapNum)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getPriceChange = (): { change: number; changePercent: number; isPositive: boolean } => {
    if (priceData.length < 2) return { change: 0, changePercent: 0, isPositive: true };
    
    const firstPrice = parseFloat(priceData[0].price);
    const lastPrice = parseFloat(priceData[priceData.length - 1].price);
    const change = lastPrice - firstPrice;
    const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
    
    return {
      change,
      changePercent,
      isPositive: change >= 0
    };
  };

  const priceChange = getPriceChange();

  return (
    <div className="bg-white/5 rounded-xl p-6">
      {/* Header with Price Info */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-2xl font-bold text-white mb-1">
            {TokenDetailService.formatPrice(priceData[priceData.length - 1]?.price || '0')}
          </div>
          <div className={`text-sm ${priceChange.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange.isPositive ? '+' : ''}{priceChange.changePercent.toFixed(2)}% ({priceChange.isPositive ? '+' : ''}{priceChange.change.toFixed(6)})
          </div>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe.key}
              onClick={() => setActiveTimeframe(timeframe.key)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTimeframe === timeframe.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {timeframe.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-red-400 mb-2">📈 Failed to Load</div>
              <div className="text-sm mb-4">{error}</div>
              <button
                onClick={fetchPriceHistory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : priceData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-gray-400 mb-2">📈 No Data</div>
              <div className="text-sm">No price data available for this timeframe</div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="displayTime" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => TokenDetailService.formatPrice(value.toString())}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="priceNum" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
