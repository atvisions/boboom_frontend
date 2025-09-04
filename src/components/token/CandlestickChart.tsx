'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { tokenAPI } from '@/services/api';

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
  const [stats24h, setStats24h] = useState<any>(null);
  const [candlestickData, setCandlestickData] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [okbPrice, setOkbPrice] = useState<number>(177.6); // 默认OKB价格

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

  // 加载24小时统计数据
  useEffect(() => {
    const load24hStats = async () => {
      try {
        setLoading(true);
        const response = await tokenAPI.getToken24hStats(tokenAddress, 'sepolia');
        if (response.success) {
          setStats24h(response.data);
        }
      } catch (error) {
        console.error('Failed to load 24h stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tokenAddress) {
      load24hStats();
    }
  }, [tokenAddress]);

  // 加载蜡烛图数据
  useEffect(() => {
    const loadCandlestickData = async () => {
      try {
        // 根据timeframe确定interval
        const intervalMap: { [key: string]: string } = {
          '1h': '1h',
          '4h': '4h', 
          '1d': '1d',
          '1w': '1d', // 暂时用1d代替
          '1m': '1m'  // 修正：1m应该映射到1m
        };
        
        const interval = intervalMap[timeframe] || '4h';
        const response = await tokenAPI.getTokenPriceHistory(tokenAddress, {
          interval: interval as any,
          limit: 100,
          network: 'sepolia'
        });
        
        if (response.success && response.data.candles) {
          // 转换数据格式为ApexCharts需要的格式，并根据货币进行转换
          const candles = response.data.candles.map((candle: any) => {
            let open, high, low, close;
            
            if (currency === 'OKB') {
              // 转换为OKB价格
              open = candle.open / okbPrice;
              high = candle.high / okbPrice;
              low = candle.low / okbPrice;
              close = candle.close / okbPrice;
            } else {
              // USD价格
              open = candle.open;
              high = candle.high;
              low = candle.low;
              close = candle.close;
            }
            
            return {
              x: new Date(candle.timestamp),
              y: [open, high, low, close]
            };
          });
          
          const volumes = response.data.candles.map((candle: any) => ({
            x: new Date(candle.timestamp),
            y: candle.volume || 0
          }));
          
          setCandlestickData(candles);
          setVolumeData(volumes);
        }
      } catch (error) {
        console.error('Failed to load candlestick data:', error);
        // 如果API调用失败，使用模拟数据作为备用
        setCandlestickData(generateMockCandlestickData());
        setVolumeData(generateMockVolumeData());
      }
    };

    if (tokenAddress) {
      loadCandlestickData();
    }
  }, [tokenAddress, timeframe, currency, okbPrice]);

  // 生成模拟K线数据（作为备用）
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

  // 如果没有真实数据，使用模拟数据作为备用
  const fallbackCandlestickData = generateMockCandlestickData();
  const fallbackVolumeData = generateMockVolumeData();

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
          const symbol = currency === 'OKB' ? 'OKB' : '$';
          // 根据价格大小动态调整小数位数
          if (value >= 1) {
            return symbol + value.toFixed(2);
          } else if (value >= 0.01) {
            return symbol + value.toFixed(4);
          } else if (value >= 0.0001) {
            return symbol + value.toFixed(6);
          } else {
            return symbol + value.toFixed(8);
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
        const symbol = currency === 'OKB' ? 'OKB' : '$';
        
        return `
          <div class="custom-tooltip" style="background: rgba(0,0,0,0.9); padding: 8px; border-radius: 4px; border: 1px solid #70E000;">
            <div style="color: #9CA3AF; font-size: 11px; margin-bottom: 4px;">${new Date(data.x).toLocaleTimeString()}</div>
            <div style="color: white; font-size: 12px; margin: 2px 0;">
              <span style="color: #9CA3AF;">O:</span> ${symbol}${open.toFixed(6)}
            </div>
            <div style="color: white; font-size: 12px; margin: 2px 0;">
              <span style="color: #9CA3AF;">H:</span> ${symbol}${high.toFixed(6)}
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
                data: candlestickData.length > 0 ? candlestickData : fallbackCandlestickData
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
                  data: volumeData.length > 0 ? volumeData : fallbackVolumeData
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
          <div className="text-white font-bold text-sm">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
            ) : (
              `$${parseFloat(stats24h?.currentPrice || '0').toFixed(8)}`
            )}
          </div>
        </div>
        
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">24h High</div>
          <div className="text-white font-bold text-sm">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
            ) : (
              `$${parseFloat(stats24h?.high24h || '0').toFixed(8)}`
            )}
          </div>
        </div>
        
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">24h Low</div>
          <div className="text-white font-bold text-sm">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
            ) : (
              `$${parseFloat(stats24h?.low24h || '0').toFixed(8)}`
            )}
          </div>
        </div>
        
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">24h Change</div>
          {loading ? (
            <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
          ) : (
            <div className={`font-bold text-sm flex items-center ${
              parseFloat(stats24h?.priceChange24h || '0') >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {parseFloat(stats24h?.priceChange24h || '0') >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {parseFloat(stats24h?.priceChange24h || '0') >= 0 ? '+' : ''}{parseFloat(stats24h?.priceChange24h || '0').toFixed(2)}%
            </div>
          )}
        </div>
        
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">24h Volume</div>
          <div className="text-white font-bold text-sm">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
            ) : (
              (() => {
                const volume = parseFloat(stats24h?.volume24h || '0');
                if (volume >= 1000000) {
                  return `$${(volume / 1000000).toFixed(1)}M`;
                } else if (volume >= 1000) {
                  return `$${(volume / 1000).toFixed(1)}K`;
                } else {
                  return `$${volume.toFixed(2)}`;
                }
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
