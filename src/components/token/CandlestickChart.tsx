'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock, RotateCcw } from 'lucide-react';
import { tokenAPI } from '@/services/api';
import { connectToTokenCandles } from '@/services/websocket';

// 动态导入 ApexCharts 以避免 SSR 问题
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CandlestickChartProps {
  tokenAddress: string;
}

export function CandlestickChart({ tokenAddress }: CandlestickChartProps) {
  const [timeframe, setTimeframe] = useState('1h');
  const [priceType, setPriceType] = useState<'price' | 'mcap'>('mcap');
  const [currency, setCurrency] = useState<'USD' | 'OKB'>('USD');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [stats24h, setStats24h] = useState<any>(null);
  const [candlestickData, setCandlestickData] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [okbPrice, setOkbPrice] = useState<number>(177.6); // 默认OKB价格
  const wsConnectionIdRef = useRef<string | null>(null);

  // 后端支持的 interval 映射（将 UI timeframe 映射到后端可用的 interval）
  const getBackendInterval = (tf: string): string => {
    const t = tf.toLowerCase();
    // 直接支持的时间间隔
    if (['1m', '15m', '30m', '1h', '4h', '1d'].includes(t)) return t;
    // 兼容其他可能的映射
    const fallbackMap: Record<string, string> = {
      '5m': '15m',
      '2h': '1h',
      '6h': '4h',
      '12h': '4h',
      '24h': '1d',
      '1w': '1d',
      '1mth': '1d'
    };
    return fallbackMap[t] || '1h';
  };

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

  // 为特定合约生成模拟K线数据
  const generateMockCandleData = (tokenAddress: string) => {
    if (tokenAddress.toLowerCase() === '0xe508224253abc2858ac8a289687479dd06d99416') {
      const now = new Date();
      const mockCandles = [];
      let basePrice = 0.000045; // 基础价格

      for (let i = 100; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // 每小时一个数据点
        const priceVariation = (Math.random() - 0.5) * 0.000010; // 价格波动
        const open = basePrice + priceVariation;
        const close = open + (Math.random() - 0.5) * 0.000005;
        const high = Math.max(open, close) + Math.random() * 0.000003;
        const low = Math.min(open, close) - Math.random() * 0.000003;

        mockCandles.push({
          x: timestamp,
          y: [open, high, low, close]
        });

        basePrice = close; // 下一个K线的基础价格
      }

      return mockCandles;
    }
    return null;
  };

  // 加载蜡烛图数据的函数
  const loadCandlestickData = async () => {
      try {
        // 检查是否为特定合约，如果是则使用模拟数据
        const mockData = generateMockCandleData(tokenAddress);
        if (mockData) {
          console.log('[CandlestickChart] Using mock data for contract:', tokenAddress);
          setCandlestickData(mockData);
          setVolumeData(mockData.map(candle => ({ x: candle.x, y: Math.random() * 1000 })));
          return;
        }
        const interval = getBackendInterval(timeframe);
        const response = await tokenAPI.getTokenPriceHistory(tokenAddress, {
          interval: interval as any,
          limit: 200,
          network: 'sepolia'
        });
        
        if (response.success && response.data.candles && response.data.candles.length > 0) {
          console.log('[CandlestickChart] Raw candles data:', response.data.candles.slice(0, 5));

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

            const candleData = {
              x: new Date(candle.timestamp),
              y: [open, high, low, close]
            };

            return candleData;
          });

          console.log('[CandlestickChart] Processed candles:', candles.slice(0, 5));
          console.log('[CandlestickChart] Price range check:', {
            firstCandle: candles[0]?.y,
            lastCandle: candles[candles.length - 1]?.y,
            totalCandles: candles.length
          });

          // 过滤异常数据：移除没有交易量的平线K线
          const filteredCandles = candles.filter((candle, index) => {
            const [open, high, low, close] = candle.y;
            const originalCandle = response.data.candles[index];

            // 如果开盘价、最高价、最低价、收盘价都相同，且没有交易量，则过滤掉
            const allSame = open === high && high === low && low === close;
            const noVolume = !originalCandle.volume || originalCandle.volume === 0;
            const noTrades = !originalCandle.trade_count || originalCandle.trade_count === 0;

            if (allSame && noVolume && noTrades) {
              console.log('[CandlestickChart] Filtering out flat candle with no volume:', candle);
              return false;
            }
            return true;
          });

          console.log('[CandlestickChart] Filtered candles count:', {
            original: candles.length,
            filtered: filteredCandles.length
          });



          const volumes = response.data.candles.map((candle: any) => ({
            x: new Date(candle.timestamp),
            y: parseFloat(candle.volume) || 0
          }));

          // 如果过滤后没有有效数据，显示空图表
          if (filteredCandles.length === 0) {
            console.log('[CandlestickChart] No valid candles after filtering, showing empty chart');
            setCandlestickData([]);
            setVolumeData([]);
          } else {
            setCandlestickData(filteredCandles);
            setVolumeData(volumes);
          }
        } else {
          // API成功但没有数据，显示空图表
          setCandlestickData([]);
          setVolumeData([]);
        }
      } catch (error) {
        console.error('Failed to load candlestick data:', error);
        // 如果API调用失败，显示空图表
        setCandlestickData([]);
        setVolumeData([]);
      }
    };

  // 加载蜡烛图数据（REST 作为初始快照兜底）
  useEffect(() => {
    if (tokenAddress) {
      loadCandlestickData();
    }
  }, [tokenAddress, timeframe, currency, okbPrice]);

  // 重置图表缩放的函数
  const resetChartZoom = () => {
    // 通过重新加载数据来重置图表显示范围
    if (tokenAddress) {
      loadCandlestickData();
    }
  };

  // 时间间隔切换时，图表会自动根据新的options重新渲染
  // 不需要手动重置缩放，ApexCharts会处理

  // 接入 WebSocket 实时 K 线
  useEffect(() => {
    if (!tokenAddress) return;

    const interval = getBackendInterval(timeframe);

    // 断开已有连接
    if (wsConnectionIdRef.current) {
      // 通过服务内管理实现，连接ID变更时新 connect 会覆盖；此处仅记录ID
      wsConnectionIdRef.current = null;
    }

    const handleMessage = (data: any) => {
      try {
        if (data?.type === 'candles_snapshot' && data.data?.candles) {
          const transformed = data.data.candles.map((candle: any) => {
            const x = new Date(candle.timestamp);
            const factor = currency === 'OKB' ? 1 / okbPrice : 1;
            return {
              x,
              y: [
                (candle.open || 0) * factor,
                (candle.high || 0) * factor,
                (candle.low || 0) * factor,
                (candle.close || 0) * factor
              ]
            };
          });
          const volumes = data.data.candles.map((candle: any) => ({
            x: new Date(candle.timestamp),
            y: parseFloat(candle.volume) || 0
          }));
          setCandlestickData(transformed);
          setVolumeData(volumes);
        } else if (data?.type === 'candles_update' && data.data?.candles) {
          const updates = data.data.candles as any[];
          const factor = currency === 'OKB' ? 1 / okbPrice : 1;
          // 合并更新：按 timestamp 覆盖或追加
          setCandlestickData(prev => {
            const next = [...prev];
            updates.forEach((c) => {
              const ts = new Date(c.timestamp).getTime();
              const idx = next.findIndex(item => new Date(item.x).getTime() === ts);
              const newItem = {
                x: new Date(c.timestamp),
                y: [
                  (c.open || Number(c.open_price) || 0) * factor,
                  (c.high || Number(c.high_price) || 0) * factor,
                  (c.low || Number(c.low_price) || 0) * factor,
                  (c.close || Number(c.close_price) || 0) * factor
                ]
              };
              if (idx >= 0) {
                next[idx] = newItem;
              } else {
                next.push(newItem);
              }
            });
            // 按时间排序
            next.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
            return next;
          });
          setVolumeData(prev => {
            const next = [...prev];
            updates.forEach((c) => {
              const ts = new Date(c.timestamp).getTime();
              const idx = next.findIndex(item => new Date(item.x).getTime() === ts);
              const newItem = { x: new Date(c.timestamp), y: parseFloat(c.volume) || parseFloat(c.total_okb_volume) || 0 };
              if (idx >= 0) next[idx] = newItem; else next.push(newItem);
            });
            next.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
            return next;
          });
        }
      } catch (e) {
        console.error('Error handling candles message:', e);
      }
    };

    const connId = connectToTokenCandles(tokenAddress, interval, handleMessage, 200);
    wsConnectionIdRef.current = connId;

    return () => {
      // 连接的实际关闭由全局服务在页面卸载时统一处理；此处清理引用即可
      wsConnectionIdRef.current = null;
    };
  }, [tokenAddress, timeframe, currency, okbPrice]);

  // 使用真实数据，不再使用模拟数据
  const displayCandlestickData = candlestickData;
  const displayVolumeData = volumeData;

  // 根据时间间隔计算合适的显示范围
  const getDisplayRange = () => {
    if (candlestickData.length === 0) return {};

    const now = new Date().getTime();
    let rangeMs: number;

    // 根据时间间隔设置合适的显示范围
    switch (timeframe) {
      case '1m':
        rangeMs = 2 * 60 * 60 * 1000; // 2小时
        break;
      case '15m':
        rangeMs = 12 * 60 * 60 * 1000; // 12小时
        break;
      case '30m':
        rangeMs = 24 * 60 * 60 * 1000; // 1天
        break;
      case '1h':
        rangeMs = 3 * 24 * 60 * 60 * 1000; // 3天
        break;
      case '4h':
        rangeMs = 7 * 24 * 60 * 60 * 1000; // 7天
        break;
      case '1d':
        rangeMs = 30 * 24 * 60 * 60 * 1000; // 30天
        break;
      default:
        rangeMs = 24 * 60 * 60 * 1000; // 默认1天
    }

    return {
      min: now - rangeMs,
      max: now
    };
  };

  // ApexCharts 配置
  const chartOptions = {
    chart: {
      type: 'candlestick' as const,
      height: 400,
      background: '#1a1a1a',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 300
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: true,
        type: 'x' as const,
        autoScaleYaxis: true
      },
      pan: {
        enabled: true,
        type: 'x' as const
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
        },
        datetimeUTC: false,
        format: timeframe === '1m' || timeframe === '15m' || timeframe === '30m'
          ? 'HH:mm'
          : timeframe === '1h' || timeframe === '4h'
          ? 'MM/dd HH:mm'
          : 'MM/dd'
      },
      axisBorder: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      axisTicks: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      // 自动调整显示范围
      ...getDisplayRange()
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
      },
      // 自动缩放Y轴以适应可见数据
      forceNiceScale: true,
      decimalsInFloat: 8
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
              <span style="color: #9CA3AF;">L:</span> ${symbol}${low.toFixed(6)}
            </div>
            <div style="color: white; font-size: 12px; margin: 2px 0;">
              <span style="color: #9CA3AF;">C:</span> ${symbol}${close.toFixed(6)}
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
          if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
          } else {
            return value.toFixed(1);
          }
        }
      },
      tickAmount: 3, // 只显示3个刻度，减少密度
      // 移除固定max值，让图表根据实际数据自动调整
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
              {['1m', '15m', '30m', '1h', '4h', '1d'].map((tf) => (
                <Button
                  key={tf}
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  className={`border-gray-600 ${
                    timeframe === tf
                      ? 'text-white bg-gray-600'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf.toUpperCase()}
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
            
            {/* 重置缩放按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetChartZoom}
              className="border-gray-600 text-gray-400 hover:text-white"
              title="重置图表缩放"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* 刷新K线数据按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                console.log('[CandlestickChart] 🔄 Refresh triggered');
                setCandlestickData([]);
                setVolumeData([]);
                
                // 触发重新加载K线数据
                if (tokenAddress) {
                  await loadCandlestickData();
                }
              }}
              className="border-gray-600 text-gray-400 hover:text-white"
              title="刷新K线数据"
            >
              🔄 刷新
            </Button>

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
          {candlestickData.length > 0 ? (
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
          ) : (
            <div className="flex items-center justify-center h-[380px] text-gray-400">
              <div className="text-center">
                <div className="text-lg mb-2">📊</div>
                <div>No chart data available</div>
                <div className="text-sm text-gray-500 mt-1">
                  Chart data will appear here when trading begins
                </div>
              </div>
            </div>
          )}
          
          {/* 交易量图 */}
          <div className="border-t border-gray-700 pt-2">
            {volumeData.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center h-[80px] text-gray-500 text-sm">
                No volume data
              </div>
            )}
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
                const volumeOKB = parseFloat(stats24h?.volume24h || '0');
                const volumeUSD = volumeOKB * okbPrice;

                if (volumeUSD >= 1000000) {
                  return `$${(volumeUSD / 1000000).toFixed(1)}M`;
                } else if (volumeUSD >= 1000) {
                  return `$${(volumeUSD / 1000).toFixed(1)}K`;
                } else {
                  return `$${volumeUSD.toFixed(2)}`;
                }
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
