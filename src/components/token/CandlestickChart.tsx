'use client';

import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CandlestickChartProps {
  tokenAddress: string;
}

export function CandlestickChart({ tokenAddress }: CandlestickChartProps) {
  // 生成模拟数据
  const generateMockData = () => {
    const labels = [];
    const data = [];
    const volumeData = [];
    
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      labels.push(time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }));
      
      // 生成模拟价格数据
      const basePrice = 0.00027339;
      const variation = (Math.random() - 0.5) * 0.0001;
      data.push(basePrice + variation);
      
      // 生成模拟交易量数据
      volumeData.push(Math.random() * 1000000);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Price',
          data,
          borderColor: '#70E000',
          backgroundColor: 'rgba(112, 224, 0, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Volume',
          data: volumeData,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: false,
          yAxisID: 'y1',
        }
      ]
    };
  };

  const [chartData, setChartData] = useState<any>(() => generateMockData());
  const [timeframe, setTimeframe] = useState('4h');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [priceType, setPriceType] = useState<'price' | 'mcap'>('mcap');
  const [currency, setCurrency] = useState<'USD' | 'OKB'>('USD');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTimeDropdown && !(event.target as Element).closest('.time-dropdown')) {
        setShowTimeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTimeDropdown]);

  // 当时间框架改变时，重新生成模拟数据
  useEffect(() => {
    setChartData(generateMockData());
  }, [timeframe]);

  // 图表配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#70E000',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label === 'Price') {
              return `${label}: $${value.toFixed(6)}`;
            } else {
              return `${label}: ${value.toLocaleString()}`;
            }
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
          maxTicksLimit: 8,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
          callback: function(value: any) {
            return '$' + value.toFixed(6);
          }
        },
      },
      y1: {
        type: 'linear' as const,
        display: false,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#9CA3AF',
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* 图表标题和控制按钮 */}
      <div className="bg-[#1a1a1a] rounded-lg p-4">
        <div className="flex items-center justify-between">
          {/* 左侧标题 */}
          <h3 className="text-lg font-bold text-white">
            {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)} • {timeframe} • {priceType === 'mcap' ? 'MCap' : 'Price'}
          </h3>
          
          {/* 右侧控制按钮 */}
          <div className="flex items-center space-x-2">
            {/* 时间框架快捷按钮 */}
            <div className="flex items-center space-x-1 mr-2">
              {['1H', '4H', '1D', '1W', '1M'].map((tf) => (
                <Button
                  key={tf}
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeframe(tf.toLowerCase())}
                  className={`border-gray-600 ${
                    timeframe === tf.toLowerCase() 
                      ? 'text-white bg-gray-600' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf}
                </Button>
              ))}
            </div>
            
            {/* 高级时间选择器 */}
            <div className="relative time-dropdown">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                className="border-gray-600 text-gray-400 hover:text-white"
              >
                <Clock className="h-4 w-4 mr-1" />
                More
              </Button>
              
              {showTimeDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-[#1a1a1a] border border-gray-600 rounded-lg p-2 shadow-lg z-10 min-w-32">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 font-medium px-2 py-1">SECONDS</div>
                    {['1s', '15s', '30s'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          setTimeframe(tf.toLowerCase());
                          setShowTimeDropdown(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-700 ${
                          timeframe === tf.toLowerCase() ? 'text-white bg-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                    
                    <div className="text-xs text-gray-500 font-medium px-2 py-1 mt-2">MINUTES</div>
                    {['1m', '5m', '15m', '30m'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          setTimeframe(tf.toLowerCase());
                          setShowTimeDropdown(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-700 ${
                          timeframe === tf.toLowerCase() ? 'text-white bg-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                    
                    <div className="text-xs text-gray-500 font-medium px-2 py-1 mt-2">HOURS</div>
                    {['1h', '6h', '12h', '24h'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          setTimeframe(tf.toLowerCase());
                          setShowTimeDropdown(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-700 ${
                          timeframe === tf.toLowerCase() ? 'text-white bg-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 货币切换按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrency(currency === 'USD' ? 'OKB' : 'USD')}
              className={`border-gray-600 ${
                currency === 'USD' ? 'text-white bg-gray-600' : 'text-gray-400 hover:text-white'
              }`}
            >
              {currency === 'USD' ? 'USD' : 'OKB'}
            </Button>
          </div>
        </div>
      </div>

      {/* 主图表区域 */}
      <div className="bg-[#1a1a1a] rounded-lg p-6">
        <div className="h-96">
          {chartData ? (
            chartType === 'line' ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#70E000] mx-auto mb-4"></div>
                <p className="text-gray-400">Generating chart data...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 24小时统计数据 */}
      <div className="grid grid-cols-5 gap-4">
        {/* 当前价格卡片 */}
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">Current Price</div>
          <div className="text-white font-bold text-sm">$0.00054864</div>
        </div>
        
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">24h High</div>
          <div className="text-white font-bold text-sm">$0.00083990</div>
        </div>
        
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">24h Low</div>
          <div className="text-white font-bold text-sm">$0.00027339</div>
        </div>
        
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">24h Change</div>
          <div className="text-red-500 font-bold text-sm flex items-center">
            <TrendingDown className="h-3 w-3 mr-1" />
            -56.91%
          </div>
        </div>
        
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">24h Volume</div>
          <div className="text-white font-bold text-sm">$2.7M</div>
        </div>
      </div>
    </div>
  );
}
