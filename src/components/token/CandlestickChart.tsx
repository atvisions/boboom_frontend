'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock, RotateCcw } from 'lucide-react';
import { tokenAPI } from '@/services/api';
import { connectToTokenCandles } from '@/services/websocket';
import { formatPrice } from '@/lib/utils';
import websocketService from '@/services/websocket';
import { ChartErrorBoundary, ChartErrorFallback } from '@/components/ui/ChartErrorBoundary';

// Dynamic import ApexCharts to avoid SSR issues
const Chart = dynamic(
  () => import('react-apexcharts').catch(() => {
    // If import fails, return an empty component
    return { default: () => <div className="text-center text-gray-500 py-8">Chart failed to load, please refresh the page</div> };
  }),
  {
    ssr: false,
    loading: () => <div className="text-center text-gray-500 py-8">Loading chart...</div>
  }
);

interface CandlestickChartProps {
  tokenAddress: string;
  stats24h?: any; // 接收父组件传递的24小时统计数据
}

// 数据验证函数
function validateChartData(data: any[]): boolean {
  if (!Array.isArray(data)) {

    return false;
  }
  if (data.length === 0) return true; // 空数组是有效的
  if (data.length > 10000) {

    return false;
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item || typeof item !== 'object') {

      return false;
    }
    if (typeof item.x !== 'number') {

      return false;
    }
    if (!Array.isArray(item.y) || item.y.length !== 4) {

      return false;
    }
    for (let j = 0; j < item.y.length; j++) {
      const val = item.y[j];
      if (typeof val !== 'number' || !isFinite(val) || val <= 0) {

        return false;
      }
    }
  }

  return true;
}

function validateVolumeData(data: any[]): boolean {
  if (!Array.isArray(data)) {

    return false;
  }
  if (data.length === 0) return true; // 空数组是有效的
  if (data.length > 10000) {

    return false;
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item || typeof item !== 'object') {

      return false;
    }
    if (typeof item.x !== 'number') {

      return false;
    }
    if (typeof item.y !== 'number' || !isFinite(item.y) || item.y < 0) {

      return false;
    }
  }

  return true;
}

// 清理数据函数：确保所有数据都使用正确的索引格式
function cleanChartData(data: any[]): any[] {
  return data.map((item, index) => ({
    x: index,
    y: item.y,
    timestamp: item.timestamp
  }));
}

function cleanVolumeData(data: any[]): any[] {
  return data.map((item, index) => ({
    x: index,
    y: item.y,
    timestamp: item.timestamp
  }));
}

export function CandlestickChart({ tokenAddress, stats24h }: CandlestickChartProps) {
  const [timeframe, setTimeframe] = useState('1h');
  const [priceType, setPriceType] = useState<'price' | 'mcap'>('mcap');
  const [currency, setCurrency] = useState<'USD' | 'OKB'>('USD');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [localStats24h, setLocalStats24h] = useState<any>(null); // 本地备用状态
  const [candlestickData, setCandlestickData] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [okbPrice, setOkbPrice] = useState<number>(177.6); // 默认OKB价格
  const [chartError, setChartError] = useState(false); // 图表加载错误状态
  const wsConnectionIdRef = useRef<string | null>(null);

  // 优先使用父组件传递的stats24h，否则使用本地状态
  const currentStats24h = stats24h || localStats24h;

  // 后端支持的 interval 映射（新的事件驱动K线系统支持的时间间隔）
  const getBackendInterval = (tf: string): string => {
    // 直接支持的时间间隔，不转换大小写
    const supportedIntervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '7d', '1month', '1y', 'all'];
    if (supportedIntervals.includes(tf)) return tf;

    // 兼容其他可能的映射
    const fallbackMap: Record<string, string> = {
      '2h': '1h',
      '6h': '4h',
      '12h': '4h',
      '24h': '1d',
      '1w': '7d',
      '1M': '1month',  // 兼容旧的大写M格式
      '1mth': '1month',
      '1year': '1y'
    };
    return fallbackMap[tf] || fallbackMap[tf.toLowerCase()] || '1h';
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
        // 静默处理OKB价格加载失败
      }
    };

    loadOKBPrice();
  }, []);

  // 加载24小时统计数据（仅在没有父组件传递数据时使用）
  useEffect(() => {
    const load24hStats = async () => {
      try {
        setLoading(true);
        // 添加时间戳参数绕过缓存
        const timestamp = Date.now();
        const response = await tokenAPI.getToken24hStats(tokenAddress, 'sepolia');
        if (response.success) {
          // 24h stats API response
          setLocalStats24h(response.data);
        }
      } catch (error) {
        // 静默处理24h统计数据加载失败
      } finally {
        setLoading(false);
      }
    };

    // 只有在没有父组件传递stats24h时才加载本地数据
    if (tokenAddress && !stats24h) {
      load24hStats();
    } else if (stats24h) {
      setLoading(false);
    }
  }, [tokenAddress, stats24h]);

  // 移除模拟数据生成，现在使用真实的事件驱动K线数据

  // 加载蜡烛图数据的函数 - 使用新的事件驱动K线API
  const loadCandlestickData = async () => {
      try {
        // 清除相关缓存
        const { cacheAPI } = await import('@/services/api');
        cacheAPI.clear('token_price_history');

        const interval = getBackendInterval(timeframe);
        const response = await tokenAPI.getTokenPriceHistory(tokenAddress, {
          interval: interval as any,
          limit: 200,
          network: 'sepolia',
          continuous: false // 关闭连续模式，只显示有交易的K线
        });

        if (response.success && response.data.candles && response.data.candles.length > 0) {

          // 转换数据格式为ApexCharts需要的格式，并根据货币进行转换
          // 首先按时间排序，确保K线从旧到新的正确顺序
          const sortedCandles = response.data.candles
            .filter((candle: any) => {
              // 数据验证：确保所有必需字段存在且为有效数值
              return candle &&
                     candle.open != null && isFinite(candle.open) && candle.open > 0 &&
                     candle.high != null && isFinite(candle.high) && candle.high > 0 &&
                     candle.low != null && isFinite(candle.low) && candle.low > 0 &&
                     candle.close != null && isFinite(candle.close) && candle.close > 0;
            })
            .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // 从旧到新排序

          const candles = sortedCandles
            .map((candle: any, index: number) => {
              let open: number, high: number, low: number, close: number;

              try {
                if (currency === 'OKB' && okbPrice > 0) {
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

                // Validate converted data
                if (!isFinite(open) || !isFinite(high) || !isFinite(low) || !isFinite(close) ||
                    open <= 0 || high <= 0 || low <= 0 || close <= 0) {

                  return null;
                }

                const candleData = {
                  x: index, // 使用索引而不是时间，确保K线连续
                  y: [open, high, low, close],
                  timestamp: candle.timestamp // 保存时间戳用于tooltip显示
                };

                return candleData;
              } catch (error) {

                return null;
              }
            })
            .filter(Boolean); // 移除null值

          // 新的事件驱动系统已经处理了数据过滤，不需要额外过滤
          // 使用相同的排序后的数据确保K线和交易量数据一致
          const volumes = sortedCandles
            .filter((candle: any) => {
              // 验证交易量数据
              return candle && candle.volume != null && isFinite(candle.volume) && candle.volume >= 0;
            })
            .map((candle: any, index: number) => {
              return {
                x: index, // 使用索引保持与K线数据一致
                y: candle.volume || 0
              };
            });

          const isCandleDataValid = validateChartData(candles);
          const isVolumeDataValid = validateVolumeData(volumes);

          if (isCandleDataValid && isVolumeDataValid) {

            // 最后一次安全检查，确保数据不会导致ApexCharts错误
            try {
              if (candles.length > 0 && candles.length < 10000 && volumes.length < 10000) {
                // 清理数据确保正确的索引格式
                const cleanedCandles = cleanChartData(candles);
                const cleanedVolumes = cleanVolumeData(volumes);

                setCandlestickData(cleanedCandles);
                setVolumeData(cleanedVolumes);
              } else {

                setCandlestickData([]);
                setVolumeData([]);
              }
            } catch (error) {

              setCandlestickData([]);
              setVolumeData([]);
            }
          } else {

            setCandlestickData([]);
            setVolumeData([]);
          }
        } else {
          // API成功但没有数据，显示空图表
          setCandlestickData([]);
          setVolumeData([]);
        }
      } catch (error) {

        // 静默处理API失败，显示空图表
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
      websocketService.disconnect(wsConnectionIdRef.current);
      wsConnectionIdRef.current = null;
    }

    const handleMessage = (data: any) => {
      try {
        // 处理价格更新（仅在没有父组件传递stats24h时更新本地状态）
        if (data?.type === 'price_update' && data.data?.address === tokenAddress) {
          const priceData = data.data;

          // 只有在没有父组件传递stats24h时才更新本地状态
          if (!stats24h) {
            setLocalStats24h((prevStats: any) => {
              const newStats = {
                ...prevStats,
                currentPrice: priceData.current_price || priceData.currentPrice,
                high24h: priceData.high_24h || priceData.high24h || prevStats?.high24h,
                low24h: priceData.low_24h || priceData.low24h || prevStats?.low24h,
                priceChange24h: priceData.change_24h || priceData.price_change_24h || priceData.priceChange24h,
                volume24h: priceData.volume_24h || priceData.volume24h,
                updatedAt: new Date().toISOString()
              };
              return newStats;
            });
          }
        }
        // 处理K线数据
        else if (data?.type === 'candles_snapshot' && data.data?.candles) {
          const transformed = data.data.candles.map((candle: any, index: number) => {
            const factor = currency === 'OKB' ? 1 / okbPrice : 1;
            return {
              x: index, // 使用索引保持与API调用一致
              y: [
                (candle.open || 0) * factor,
                (candle.high || 0) * factor,
                (candle.low || 0) * factor,
                (candle.close || 0) * factor
              ],
              timestamp: candle.timestamp // 保存时间戳用于tooltip
            };
          });
          const volumes = data.data.candles.map((candle: any, index: number) => ({
            x: index, // 使用索引保持与K线数据一致
            y: parseFloat(candle.volume) || 0
          }));
          // 清理数据确保正确的索引格式
          setCandlestickData(cleanChartData(transformed));
          setVolumeData(cleanVolumeData(volumes));
        } else if (data?.type === 'candles_update' && data.data?.candles) {
          const updates = data.data.candles as any[];
          const factor = currency === 'OKB' ? 1 / okbPrice : 1;
          // 合并更新：按 timestamp 覆盖或追加
          setCandlestickData(prev => {
            const next = [...prev];
            updates.forEach((c) => {
              const ts = new Date(c.timestamp).getTime();
              const idx = next.findIndex(item => item.timestamp && new Date(item.timestamp).getTime() === ts);

              // 安全地提取价格数据，确保不会出现0值
              const open = parseFloat(c.open || c.open_price) || null;
              const high = parseFloat(c.high || c.high_price) || null;
              const low = parseFloat(c.low || c.low_price) || null;
              const close = parseFloat(c.close || c.close_price) || null;

              // 验证价格数据的有效性
              if (!open || !high || !low || !close ||
                  open <= 0 || high <= 0 || low <= 0 || close <= 0 ||
                  !isFinite(open) || !isFinite(high) || !isFinite(low) || !isFinite(close)) {

                return; // 跳过这个无效的更新
              }

              const newItem = {
                x: idx >= 0 ? idx : next.length, // 使用索引而不是时间戳
                y: [
                  open * factor,
                  high * factor,
                  low * factor,
                  close * factor
                ],
                timestamp: c.timestamp // 保存时间戳用于tooltip
              };
              if (idx >= 0) {
                next[idx] = newItem;
              } else {
                next.push(newItem);
              }
            });
            // 重新分配索引以确保连续性
            next.forEach((item, index) => {
              item.x = index;
            });
            return next;
          });
          setVolumeData(prev => {
            const next = [...prev];
            updates.forEach((c) => {
              const ts = new Date(c.timestamp).getTime();
              const idx = next.findIndex(item => item.timestamp && new Date(item.timestamp).getTime() === ts);

              // 安全地提取交易量数据
              const volume = parseFloat(c.volume) || parseFloat(c.total_okb_volume) || 0;

              // 验证交易量数据的有效性
              if (!isFinite(volume) || volume < 0) {

                return; // 跳过这个无效的更新
              }

              const newItem = {
                x: idx >= 0 ? idx : next.length, // 使用索引而不是时间戳
                y: volume,
                timestamp: c.timestamp // 保存时间戳用于匹配
              };
              if (idx >= 0) next[idx] = newItem; else next.push(newItem);
            });
            // 重新分配索引以确保连续性
            next.forEach((item, index) => {
              item.x = index;
            });
            return next;
          });
        }
      } catch (e) {

      }
    };

    const connId = connectToTokenCandles(tokenAddress, interval, handleMessage, 200);
    wsConnectionIdRef.current = connId;

    return () => {
      // 组件卸载时断开WebSocket连接
      if (wsConnectionIdRef.current) {
        websocketService.disconnect(wsConnectionIdRef.current);
        wsConnectionIdRef.current = null;
      }
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
      type: 'category' as const, // 改为分类轴，确保K线连续显示
      labels: {
        style: {
          colors: '#9CA3AF'
        },
        formatter: function(value: any, timestamp: any, opts: any) {
          // 从candlestickData中获取对应的时间戳
          const index = parseInt(value);
          if (candlestickData && candlestickData[index] && candlestickData[index].timestamp) {
            const date = new Date(candlestickData[index].timestamp);
            if (timeframe === '1m' || timeframe === '15m' || timeframe === '30m') {
              return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            } else if (timeframe === '1h' || timeframe === '4h') {
              return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) + ' ' +
                     date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            } else {
              return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
            }
          }
          return value;
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

          // 使用传统小数格式显示
          if (value === 0) {
            return symbol + '0';
          } else if (value >= 1) {
            return symbol + value.toFixed(2);
          } else if (value >= 0.01) {
            return symbol + value.toFixed(4);
          } else if (value >= 0.001) {
            return symbol + value.toFixed(6);
          } else if (value >= 0.0001) {
            return symbol + value.toFixed(7);
          } else {
            // 对于极小的数值，使用更多小数位
            return symbol + value.toFixed(9);
          }
        }
      },
      // 强制不使用nice scale，保持原始数据范围
      forceNiceScale: false,
      decimalsInFloat: 12,
      // 增加Y轴刻度数量以更好显示价格范围
      tickAmount: 8
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

        // 与Y轴标签保持一致的格式化函数
        const formatPrice = (value: number) => {
          if (value === 0) return '0';
          if (value >= 1) return value.toFixed(2);
          if (value >= 0.01) return value.toFixed(4);
          if (value >= 0.001) return value.toFixed(6);
          if (value >= 0.0001) return value.toFixed(7);
          return value.toFixed(9);
        };

        return `
          <div class="custom-tooltip" style="background: rgba(0,0,0,0.9); padding: 8px; border-radius: 4px; border: 1px solid #70E000;">
            <div style="color: #9CA3AF; font-size: 11px; margin-bottom: 4px;">${data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}</div>
            <div style="color: white; font-size: 12px; margin: 2px 0;">
              <span style="color: #9CA3AF;">O:</span> ${symbol}${formatPrice(open)}
            </div>
            <div style="color: white; font-size: 12px; margin: 2px 0;">
              <span style="color: #9CA3AF;">H:</span> ${symbol}${formatPrice(high)}
            </div>
            <div style="color: white; font-size: 12px; margin: 2px 0;">
              <span style="color: #9CA3AF;">L:</span> ${symbol}${formatPrice(low)}
            </div>
            <div style="color: white; font-size: 12px; margin: 2px 0;">
              <span style="color: #9CA3AF;">C:</span> ${symbol}${formatPrice(close)}
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
      type: 'category' as const, // 与主图表保持一致
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
            {/* 时间框架快捷按钮 - 显示5个主要时间间隔 */}
            <div className="flex items-center space-x-1 mr-2">
              {['1m', '5m', '1h', '4h', 'all'].map((tf) => (
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
                  {tf === 'all' ? 'ALL' : tf.toUpperCase()}
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
                    <div className="text-xs text-gray-500 font-medium px-2 py-1">MINUTES</div>
                    {['1m', '5m', '15m', '30m'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          setTimeframe(tf); // 保持原始大小写
                          setShowTimeDropdown(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-700 ${
                          timeframe === tf ? 'text-white bg-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}

                    <div className="text-xs text-gray-500 font-medium px-2 py-1 mt-2">HOURS</div>
                    {['1h', '4h'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          setTimeframe(tf); // 保持原始大小写
                          setShowTimeDropdown(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-700 ${
                          timeframe === tf ? 'text-white bg-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}

                    <div className="text-xs text-gray-500 font-medium px-2 py-1 mt-2">DAYS & MORE</div>
                    {['1d', '7d', '1month', '1y', 'all'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          setTimeframe(tf); // 保持原始大小写，不要toLowerCase()
                          setShowTimeDropdown(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-700 ${
                          timeframe === tf ? 'text-white bg-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {tf === '1month' ? '1 Month' : tf === '1y' ? '1 Year' : tf === 'all' ? 'All Time' : tf}
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
              title="Reset chart zoom"
            >
              <RotateCcw className="w-4 h-4" />
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
            <ChartErrorBoundary fallback={<ChartErrorFallback />}>
              <div className="chart-container">
                {(() => {
                  try {
                    // Final data validation
                    if (!validateChartData(candlestickData)) {

                      return <ChartErrorFallback />;
                    }

                    return (
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
                    );
                  } catch (error) {

                    return <ChartErrorFallback />;
                  }
                })()}
              </div>
            </ChartErrorBoundary>
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
              <ChartErrorBoundary fallback={
                <div className="flex items-center justify-center h-[80px] text-gray-500 text-sm">
                  Volume chart unavailable
                </div>
              }>
                <div className="volume-chart-container">
                  {(() => {
                    try {
                      // Validate volume data
                      if (!validateVolumeData(volumeData)) {

                        return (
                          <div className="flex items-center justify-center h-[80px] text-gray-500 text-sm">
                            Volume data invalid
                          </div>
                        );
                      }

                      return (
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
                      );
                    } catch (error) {

                      return (
                        <div className="flex items-center justify-center h-[80px] text-gray-500 text-sm">
                          Volume chart error
                        </div>
                      );
                    }
                  })()}
                </div>
              </ChartErrorBoundary>
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
              (() => {
                const price = currentStats24h?.currentPrice || '0';
                // Displaying price
                return `$${formatPrice(price)}`;
              })()
            )}
          </div>
        </div>
        
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">24h High</div>
          <div className="text-white font-bold text-sm">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
            ) : (
              `$${formatPrice(currentStats24h?.high24h || '0')}`
            )}
          </div>
        </div>
        
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">24h Low</div>
          <div className="text-white font-bold text-sm">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
            ) : (
              `$${formatPrice(currentStats24h?.low24h || '0')}`
            )}
          </div>
        </div>
        
        <div className="bg-[#0E0E0E] rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">24h Change</div>
          {loading ? (
            <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
          ) : (
            <div className={`font-bold text-sm flex items-center ${
              parseFloat(currentStats24h?.priceChange24h || '0') >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {parseFloat(currentStats24h?.priceChange24h || '0') >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {parseFloat(currentStats24h?.priceChange24h || '0') >= 0 ? '+' : ''}{parseFloat(currentStats24h?.priceChange24h || '0').toFixed(2)}%
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
                const volumeOKB = parseFloat(currentStats24h?.volume24h || '0');
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
