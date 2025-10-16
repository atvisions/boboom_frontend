"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Clock, RotateCcw } from "lucide-react";
import { tokenAPI } from "@/services/api";
import { connectToTokenCandles } from "@/services/websocket";
import { formatPrice } from "@/lib/utils";
import websocketService from "@/services/websocket";
import { init, dispose, LineType } from "klinecharts";

interface CandlestickChartProps {
  tokenAddress: string;
  stats24h?: any; // 接收父组件传递的24小时统计数据
}

export function CandlestickChart({
  tokenAddress,
  stats24h,
}: CandlestickChartProps) {
  const [timeframe, setTimeframe] = useState("1h");
  const [currency, setCurrency] = useState<"USD" | "OKB">("USD");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [localStats24h, setLocalStats24h] = useState<any>(null); // 本地备用状态
  const [candlestickData, setCandlestickData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [okbPrice, setOkbPrice] = useState<number>(177.6); // 默认OKB价格
  const wsConnectionIdRef = useRef<string | null>(null);
  const chartRef = useRef<any>(null);

  // 优先使用父组件传递的stats24h，否则使用本地状态
  const currentStats24h = stats24h || localStats24h;

  // 后端支持的 interval 映射（新的事件驱动K线系统支持的时间间隔）
  const getBackendInterval = (tf: string): string => {
    // 直接支持的时间间隔，不转换大小写
    const supportedIntervals = [
      "1m",
      "5m",
      "15m",
      "30m",
      "1h",
      "4h",
      "1d",
      "7d",
      "1month",
      "1y",
      "all",
    ];
    if (supportedIntervals.includes(tf)) return tf;

    // 兼容其他可能的映射
    const fallbackMap: Record<string, string> = {
      "2h": "1h",
      "6h": "4h",
      "12h": "4h",
      "24h": "1d",
      "1w": "7d",
      "1M": "1month", // 兼容旧的大写M格式
      "1mth": "1month",
      "1year": "1y",
    };
    return fallbackMap[tf] || fallbackMap[tf.toLowerCase()] || "1h";
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
        const response = await tokenAPI.getToken24hStats(
          tokenAddress,
          "sepolia"
        );
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
  const loadCandlestickData = async (skipCache: boolean = false) => {
    try {
      // 只在需要时清除缓存（例如用户手动刷新）
      if (skipCache) {
        const { cacheAPI } = await import("@/services/api");
        cacheAPI.clear("token_price_history");
      }

      const interval = getBackendInterval(timeframe);
      const response = await tokenAPI.getTokenPriceHistory(tokenAddress, {
        interval: interval as any,
        limit: 200,
        network: "sepolia",
        continuous: false, // 关闭连续模式，只显示有交易的K线
      });

      if (
        response.success &&
        response.data.candles &&
        response.data.candles.length > 0
      ) {
        // 转换数据格式为ApexCharts需要的格式，并根据货币进行转换
        // 首先按时间排序，确保K线从旧到新的正确顺序

        const sortedCandles =
          response.data.candles?.map((item) => {
            return {
              // close: 0.000004916585405247,
              // high: 0.000004842417790972,
              // is_complete: false,
              // low: 0.000004842417790921,
              // open: 0.000004842417790921,
              // timestamp: "2025-10-14T02:52:00+00:00",
              // total_okb_volume: 2.1,
              // total_token_volume: 80124437.1618393,
              // trade_count: 3,
              // volume: 2.1,
              timestamp: new Date(item.timestamp).valueOf(),
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close,
              volume: item.volume,
            };
          })?.sort((a: any, b: any) => a.timestamp - b.timestamp) || [];

        setCandlestickData(sortedCandles);
      } else {
        // API成功但没有数据，显示空图表
        setCandlestickData([]);
      }
    } catch (error) {
      // 静默处理API失败，显示空图表
      setCandlestickData([]);
    }
  };

  // 加载蜡烛图数据（REST 作为初始快照，仅在 tokenAddress 或 timeframe 变化时加载）
  useEffect(() => {
    if (tokenAddress) {
      // 首次加载或切换 token/timeframe 时才重新请求
      loadCandlestickData();
    }
  }, [tokenAddress, timeframe]); // 移除 currency 和 okbPrice 依赖，避免重复请求

  // 重置图表缩放的函数
  const resetChartZoom = () => {
    // 通过重新加载数据来重置图表显示范围，并清除缓存
    if (tokenAddress) {
      loadCandlestickData(true); // 传入 true 清除缓存
    }
  };

  // 时间间隔切换时，图表会自动根据新的options重新渲染
  // 不需要手动重置缩放，ApexCharts会处理

  // 接入 WebSocket 实时 K 线
  // 依赖 currency 和 okbPrice 是必要的，因为需要重新转换数据
  // WebSocket 重连时会收到 candles_snapshot，不会造成额外的 REST API 请求
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
        if (
          data?.type === "price_update" &&
          data.data?.address === tokenAddress
        ) {
          const priceData = data.data;

          // 只有在没有父组件传递stats24h时才更新本地状态
          if (!stats24h) {
            setLocalStats24h((prevStats: any) => {
              const newStats = {
                ...prevStats,
                currentPrice: priceData.current_price || priceData.currentPrice,
                high24h:
                  priceData.high_24h || priceData.high24h || prevStats?.high24h,
                low24h:
                  priceData.low_24h || priceData.low24h || prevStats?.low24h,
                priceChange24h:
                  priceData.change_24h ||
                  priceData.price_change_24h ||
                  priceData.priceChange24h,
                volume24h: priceData.volume_24h || priceData.volume24h,
                updatedAt: new Date().toISOString(),
              };
              return newStats;
            });
          }
        }
        // 处理K线数据
        else if (data?.type === "candles_snapshot" && data.data?.candles) {
          const transformed = data.data.candles.map((candle: any) => {
            const factor = currency === "OKB" ? 1 / okbPrice : 1;
            return {
              open: (candle.open || 0) * factor,
              high: (candle.high || 0) * factor,
              low: (candle.low || 0) * factor,
              close: (candle.close || 0) * factor,
              volume: (candle.volume || 0) * factor,
              timestamp: new Date(candle.timestamp).valueOf(), // 保存时间戳用于tooltip
            };
          });
          // 清理数据确保正确的索引格式
          setCandlestickData(transformed);
        } else if (data?.type === "candles_update" && data.data?.candles) {
          const updates = data.data.candles as any[];
          const factor = currency === "OKB" ? 1 / okbPrice : 1;
          // 合并更新：按 timestamp 覆盖或追加
          setCandlestickData((prev) => {
            const next = [...prev];
            updates.forEach((c) => {
              // 安全地提取价格数据，确保不会出现0值
              const open = parseFloat(c.open || c.open_price) || null;
              const high = parseFloat(c.high || c.high_price) || null;
              const low = parseFloat(c.low || c.low_price) || null;
              const close = parseFloat(c.close || c.close_price) || null;
              const volume = parseFloat(c.volume || c.total_okb_volume) || null;
              // 验证价格数据的有效性
              if (
                !open ||
                !high ||
                !low ||
                !close ||
                open <= 0 ||
                high <= 0 ||
                low <= 0 ||
                close <= 0 ||
                !isFinite(open) ||
                !isFinite(high) ||
                !isFinite(low) ||
                !isFinite(close)
              ) {
                return; // 跳过这个无效的更新
              }

              const newItem = {
                open: open * factor,
                high: high * factor,
                low: low * factor,
                close: close * factor,
                volume: volume * factor,
                timestamp: new Date(c.timestamp).valueOf(), // 保存时间戳用于tooltip
              };
              next.push(newItem);
            });
            return next;
          });
        }
      } catch (e) {}
    };

    const connId = connectToTokenCandles(
      tokenAddress,
      interval,
      handleMessage,
      200
    );
    wsConnectionIdRef.current = connId;

    return () => {
      // 组件卸载时断开WebSocket连接
      if (wsConnectionIdRef.current) {
        websocketService.disconnect(wsConnectionIdRef.current);
        wsConnectionIdRef.current = null;
      }
    };
  }, [tokenAddress, timeframe, currency, okbPrice]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showTimeDropdown &&
        !(event.target as Element).closest(".time-dropdown")
      ) {
        setShowTimeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTimeDropdown]);

  useEffect(() => {
    const chart = init("chart");
    chartRef.current = chart;
    // 去掉虚线：将网格与十字线样式改为实线

    // ✅ 设置价格与成交量精度
    chart.setPrecision({ price: 8, volume: 4 });
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    const tooltipTextSize = isMobile ? 8 : 12;
    const axisTextSize = isMobile ? 8 : 12;

    chart.setStyles({
      crosshair: {
        horizontal: { text: { size: tooltipTextSize } },
        vertical: { text: { size: tooltipTextSize } },
      },
      // 蜡烛图左上角的 tooltip（Time/Open/High/Low/Close）
      candle: {
        tooltip: {
          text: { size: tooltipTextSize, color: "rgba(255, 255, 255,0.4)" },
        },
      },
      indicator: {
        tooltip: {
          text: { size: tooltipTextSize, color: "rgba(255,255,255,0.6)" },
        },
      },
      separator: {
        size: 1,
        color: "#444",
        fill: true,
        activeBackgroundColor: "#666",
      },
      xAxis: {
        show: true,
        axisLine: {
          color: "#444",
        },
        tickLine: {
          color: "#444",
        },
        tickText: { size: axisTextSize, color: "#aaa" },
      },
      yAxis: {
        show: true,
        axisLine: {
          color: "#444",
        },
        tickLine: {
          color: "#444",
        },
        tickText: { size: axisTextSize, color: "#aaa" },
      },
      grid: {
        show: false,
        // horizontal: {
        //   style: LineType.Dashed,
        //   size: 1,
        //   color: "#444",
        //   dashedValue: [],
        // },
        // vertical: {
        //   style: LineType.Dashed,
        //   size: 1,
        //   color: "#444",
        //   dashedValue: [],
        // },
      },
    });
    // 初始不灌入示例数据，等待真实数据

    // 新增成交量指标，独立面板
    chart.createIndicator("VOL", false, { height: 100 });

    return () => {
      dispose("chart");
      chartRef.current = null;
    };
  }, []);

  // 同步真实数据到 klinecharts
  useEffect(() => {
    if (!chartRef.current) return;
    try {
      chartRef.current.applyNewData(candlestickData);
    } catch {}
  }, [candlestickData]);

  return (
    <div className="space-y-6">
      {/* 图表标题和控制按钮 */}
      <div className="">
        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-3">
          {/* 左侧标题 */}
          <h3 className="text-lg font-bold text-white ">
            {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)} • {timeframe}
          </h3>

          {/* 右侧控制按钮 */}
          <div className="flex space-x-2 items-start md:items-center flex-col md:flex-row gap-3">
            {/* 时间框架快捷按钮 - 显示5个主要时间间隔 */}
            <div className="flex items-center space-x-1 mr-2">
              {["1m", "5m", "1h", "4h", "all"].map((tf) => (
                <Button
                  key={tf}
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  className={`border-gray-600 ${
                    timeframe === tf
                      ? "text-white bg-gray-600"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tf === "all" ? "ALL" : tf.toUpperCase()}
                </Button>
              ))}
            </div>

            <div className="flex items-center space-x-1 !ml-0">
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
                      <div className="text-xs text-gray-500 font-medium px-2 py-1">
                        MINUTES
                      </div>
                      {["1m", "5m", "15m", "30m"].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => {
                            setTimeframe(tf); // 保持原始大小写
                            setShowTimeDropdown(false);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-700 ${
                            timeframe === tf
                              ? "text-white bg-gray-600"
                              : "text-gray-400"
                          }`}
                        >
                          {tf}
                        </button>
                      ))}

                      <div className="text-xs text-gray-500 font-medium px-2 py-1 mt-2">
                        HOURS
                      </div> 
                      {["1h", "4h"].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => {
                            setTimeframe(tf); // 保持原始大小写
                            setShowTimeDropdown(false);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-700 ${
                            timeframe === tf
                              ? "text-white bg-gray-600"
                              : "text-gray-400"
                          }`}
                        >
                          {tf}
                        </button>
                      ))}

                      <div className="text-xs text-gray-500 font-medium px-2 py-1 mt-2">
                        DAYS & MORE
                      </div>
                      {["1d", "7d", "1month", "1y", "all"].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => {
                            setTimeframe(tf); // 保持原始大小写，不要toLowerCase()
                            setShowTimeDropdown(false);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-700 ${
                            timeframe === tf
                              ? "text-white bg-gray-600"
                              : "text-gray-400"
                          }`}
                        >
                          {tf === "1month"
                            ? "1 Month"
                            : tf === "1y"
                            ? "1 Year"
                            : tf === "all"
                            ? "All Time"
                            : tf}
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
                onClick={() => setCurrency(currency === "USD" ? "OKB" : "USD")}
                className={`border-gray-600 ${
                  currency === "USD"
                    ? "text-white bg-gray-600"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {currency === "USD" ? "USD" : "OKB"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主图表区域 */}
      <div className="mt-4">
        <div className="w-full aspect-square md:aspect-[5/3]">
          <div id="chart" className="w-full h-full"></div>
        </div>
      </div>

      {/* 24小时统计数据 */}
      <div className="grid grid-cols-3 gap-2 md:gap-4  md:grid-cols-5">
        {/* 当前价格卡片 */}
        <div className="bg-[#0E0E0E] rounded-lg p-2 md:p-4">
          <div className="text-gray-400 mb-1 text-[10px] md:text-xs">Current Price</div>
          <div className="text-white font-bold text-[10px] md:text-sm">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
            ) : (
              (() => {
                const price = currentStats24h?.currentPrice || "0";
                // Displaying price
                return `$${formatPrice(price)}`;
              })()
            )}
          </div>
        </div>

        <div className="bg-[#0E0E0E] rounded-lg p-2 md:p-4">
          <div className="text-gray-400 mb-1 text-[10px] md:text-xs">24h High</div>
          <div className="text-white font-bold text-[10px] md:text-sm">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
            ) : (
              `$${formatPrice(currentStats24h?.high24h || "0")}`
            )}
          </div>
        </div>

        <div className="bg-[#0E0E0E] rounded-lg p-2 md:p-4">
          <div className="text-gray-400 mb-1 text-[10px] md:text-xs">24h Low</div>
          <div className="text-white font-bold text-[10px] md:text-sm">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
            ) : (
              `$${formatPrice(currentStats24h?.low24h || "0")}`
            )}
          </div>
        </div>

        <div className="bg-[#0E0E0E] rounded-lg p-2 md:p-4">
          <div className="text-gray-400 mb-1 text-[10px] md:text-xs">24h Change</div>
          {loading ? (
            <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
          ) : (
            <div
              className={`font-bold text-[10px] md:text-sm flex items-center ${
                parseFloat(currentStats24h?.priceChange24h || "0") >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {parseFloat(currentStats24h?.priceChange24h || "0") >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {parseFloat(currentStats24h?.priceChange24h || "0") >= 0
                ? "+"
                : ""}
              {parseFloat(currentStats24h?.priceChange24h || "0").toFixed(2)}%
            </div>
          )}
        </div>

        <div className="bg-[#0E0E0E] rounded-lg p-2 md:p-4">
          <div className="text-gray-400 mb-1 text-[10px] md:text-xs">24h Volume</div>
          <div className="text-white font-bold text-[10px] md:text-sm">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
            ) : (
              (() => {
                const volumeOKB = parseFloat(currentStats24h?.volume24h || "0");
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
