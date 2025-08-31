'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

// 动态导入 ApexCharts 以避免 SSR 问题
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CandlestickChartProps {
  tokenAddress: string;
}

export function CandlestickChart({ tokenAddress }: CandlestickChartProps) {
  const [timeframe, setTimeframe] = useState('4h');
  const [priceType, setPriceType] = useState<'price' | 'mcap'>('mcap');
  const [currency, setCurrency] = useState<'USD' | 'OKB'>('USD');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // 生成模拟K线数据
  const generateMockCandlestickData = () => {
    const data = [];
    const now = Date.now();
    const basePrice = 0.00027339;
    
    for (let i = 23; i >= 0; i--) {
      const time = now - i * 60 * 60 * 1000;
      const variation = (Math.random() - 0.5) * 0.0001; // 减少波动范围
      const open = basePrice + variation;
      const high = open + Math.random() * 0.00005; // 减少最高价波动
      const low = open - Math.random() * 0.00005; // 减少最低价波动
      const close = open + (Math.random() - 0.5) * 0.00008; // 减少收盘价波动
      
      data.push({
        x: new Date(time),
        y: [open, high, low, close]
      });
    }
    return data;
  };

  // 生成模拟交易量数据
  const generateMockVolumeData = () => {
    const data = [];
    const now = Date.now();
    
    // 减少数据点，每2小时一个数据点，避免过于密集
    for (let i = 11; i >= 0; i--) {
      const time = now - i * 2 * 60 * 60 * 1000;
      const volume = Math.random() * 1000000 + 100000;
      
      data.push({
        x: new Date(time),
        y: volume
      });
    }
    return data;
  };

  const candlestickData = generateMockCandlestickData();
  const volumeData = generateMockVolumeData();

  // ApexCharts 配置
  const chartOptions = {
    chart: {
      type: 'candlestick' as const,
      height: 400,
      background: '#1a1a1a',
      animations: {
        enabled: false
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: true
      }
    },
    title: {
      text: '',
      align: 'left' as const
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        style: {
          colors: '#9CA3AF'
        }
      },
      axisBorder: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      axisTicks: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        style: {
          colors: '#9CA3AF'
        },
        formatter: function(value: number) {
          // 根据价格大小动态调整小数位数
          if (value >= 1) {
            return '$' + value.toFixed(2);
          } else if (value >= 0.01) {
            return '$' + value.toFixed(4);
          } else if (value >= 0.0001) {
            return '$' + value.toFixed(6);
          } else {
            return '$' + value.toFixed(8);
          }
        }
      }
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      style: {
        fontSize: '12px'
      },
      custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        const [open, high, low, close] = data.y;
        
        return `
          <div class="custom-tooltip" style="background: rgba(0,0,0,0.9); padding: 8px; border-radius: 4px; border: 1px solid #70E000;">
            <div style="color: #9CA3AF; font-size: 11px; margin-bottom: 4px;">${new Date(data.x).toLocaleTimeString()}</div>
            <div style="color: white; font-size: 12px; margin: 2px 0;">
              <span style="color: #9CA3AF;">O:</span> $${open.toFixed(6)}
            </div>
            <div style="color: white; font-size: 12px; margin: 2px 0;">
              <span style="color: #9CA3AF;">H:</span> $${high.toFixed(6)}
            </div>
            <div style="color: white; font-size: 12px; margin: 2px 0;">
              <span style="color: #9CA3AF;">L:</span> $${low.toFixed(6)}
            </div>
            <div style="color: white; font-size: 12px; margin: 2px 0;">
              <span style="color: #9CA3AF;">C:</span> $${close.toFixed(6)}
            </div>
          </div>
        `;
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#70E000',
          downward: '#EF4444'
        },
        wick: {
          useFillColor: true
        }
      }
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      strokeDashArray: 3
    },
    theme: {
      mode: 'dark' as const
    }
  };

  // 交易量图表配置
  const volumeOptions = {
    chart: {
      type: 'bar' as const,
      height: 80, // 减少高度，让图表更紧凑
      background: '#1a1a1a',
      animations: {
        enabled: false
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        show: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9CA3AF',
          fontSize: '10px'
        },
        formatter: function(value: number) {
          return (value / 1000000).toFixed(1) + 'M';
        }
      },
      tickAmount: 3, // 只显示3个刻度，减少密度
      max: 1200000 // 设置最大值，让图表更清晰
    },
    plotOptions: {
      bar: {
        colors: {
          ranges: [
            {
              from: -Infinity,
              to: 0,
              color: '#EF4444'
            }
          ]
        }
      }
    },
    dataLabels: {
      enabled: false // 禁用数据标签，避免数字堆叠
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      strokeDashArray: 3
    },
    theme: {
      mode: 'dark' as const
    }
  };

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
        <div className="space-y-2">
          {/* K线图 */}
          <Chart
            options={chartOptions}
            series={[
              {
                name: 'Price',
                data: candlestickData
              }
            ]}
            type="candlestick"
            height={380}
          />
          
          {/* 交易量图 */}
          <div className="border-t border-gray-700 pt-2">
            <Chart
              options={volumeOptions}
              series={[
                {
                  name: 'Volume',
                  data: volumeData
                }
              ]}
              type="bar"
              height={80}
            />
          </div>
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
