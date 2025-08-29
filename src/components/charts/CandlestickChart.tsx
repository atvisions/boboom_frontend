'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, ISeriesApi, Time } from 'lightweight-charts';

interface CandlePoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface VolumePoint {
  time: Time;
  value: number;
  color?: string;
}

interface CandlestickChartProps {
  data: Array<{
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  symbol: string;
  interval?: '1m' | '5m' | '1h' | '1d';
  latestPrice?: string; // from SSE for live updates
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, symbol, interval = '1m', latestPrice }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const candlesRef = useRef<CandlePoint[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0B0C1C' },
        textColor: '#A4A7B7',
      },
      autoSize: true,
      rightPriceScale: { borderVisible: true, borderColor: 'rgba(255,255,255,0.12)' },
      leftPriceScale: { visible: false },
      timeScale: { borderVisible: true, borderColor: 'rgba(255,255,255,0.12)', timeVisible: true, secondsVisible: false, fixLeftEdge: true, fixRightEdge: false },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.08)' },
        horzLines: { color: 'rgba(255,255,255,0.10)' },
      },
      crosshair: { mode: 0 },
      localization: { locale: 'en-US' },
    });

    // English tick format per interval
    const fmt = (t: number) => {
      const d = new Date(t * 1000);
      const hh = d.getUTCHours().toString().padStart(2, '0');
      const mm = d.getUTCMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    };
    chart.applyOptions({
      timeScale: {
        tickMarkFormatter: (time) => {
          const sec = typeof time === 'object' ? (time as any).timestamp : (time as number);
          return fmt(sec);
        }
      }
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444', borderDownColor: '#ef4444', borderUpColor: '#22c55e',
      wickDownColor: '#ef4444', wickUpColor: '#22c55e', priceLineVisible: false,
    });
    // Give main candles more vertical room
    candleSeries.priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: 0.32 } });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'left',
      color: 'rgba(148, 163, 184, 0.6)',
      lastValueVisible: false,
    });
    // Pin volume bars to bottom to avoid scattered dots in the candle area
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.68, bottom: 0.02 } });

    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const ro = new ResizeObserver(() => chart.applyOptions({ width: containerRef.current!.clientWidth }));
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const candles: CandlePoint[] = data.map((d) => ({
      time: (Math.floor(new Date(d.timestamp).getTime() / 1000) as unknown) as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumes: VolumePoint[] = data.map((d, i) => ({
      time: (Math.floor(new Date(d.timestamp).getTime() / 1000) as unknown) as Time,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'
    }));

    candleSeriesRef.current.setData(candles);
    volumeSeriesRef.current.setData(volumes);
    candlesRef.current = candles;
  }, [data]);

  // Live update last candle using latestPrice and interval bucket
  useEffect(() => {
    if (!latestPrice || !candleSeriesRef.current) return;
    const price = parseFloat(latestPrice);
    if (Number.isNaN(price)) return;

    const bucketSeconds = interval === '1d' ? 86400 : interval === '1h' ? 3600 : interval === '5m' ? 300 : 60;
    const nowSec = Math.floor(Date.now() / 1000);
    const bucketTime = (Math.floor(nowSec / bucketSeconds) * bucketSeconds) as unknown as Time;

    const last = candlesRef.current[candlesRef.current.length - 1];
    const lastTime = last ? (last.time as unknown as number) : undefined;
    const newTime = bucketTime as unknown as number;

    // Guard: ignore out-of-order (older) buckets
    if (lastTime !== undefined && newTime < lastTime) return;

    if (last && lastTime === newTime) {
      // update existing candle
      last.close = price;
      last.high = Math.max(last.high, price);
      last.low = Math.min(last.low, price);
      candleSeriesRef.current.update(last);
    } else {
      const newCandle: CandlePoint = { time: bucketTime, open: price, high: price, low: price, close: price };
      candlesRef.current.push(newCandle);
      candleSeriesRef.current.update(newCandle);
    }
  }, [latestPrice, interval]);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-white font-semibold">{symbol} / OKB</div>
      </div>
      <div ref={containerRef} className="h-96 w-full rounded-lg border border-white/10" />
    </div>
  );
};

export default CandlestickChart;
