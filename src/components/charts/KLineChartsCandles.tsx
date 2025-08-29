'use client';

import React, { useEffect, useRef } from 'react';
import { init, dispose, KLineData, utils, Chart } from 'klinecharts';

type Interval = '1m' | '5m' | '1h' | '1d';

interface KLineProps {
  data: Array<{ timestamp: string; open: number; high: number; low: number; close: number; volume: number; }>;
  symbol: string;
  interval?: Interval;
}

export default function KLineChartsCandles({ data, symbol, interval = '1m' }: KLineProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = init(ref.current, { styles: { candle: { type: 'candle_solid', upColor: '#22c55e', downColor: '#ef4444' } } });
    const chart = chartRef.current;
    chart?.createIndicator('VOL', false, { id: 'candle_pane' });
    chart?.applyNewData(toKline(data));
    const resize = () => chart?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); chart && dispose(chart); };
  }, []);

  useEffect(() => {
    chartRef.current?.applyNewData(toKline(data));
  }, [data]);

  return <div className="h-96 w-full rounded-lg border border-white/10" ref={ref} />;
}

function toKline(data: Array<{ timestamp: string; open: number; high: number; low: number; close: number; volume: number; }>): KLineData[] {
  return data.map(d => ({
    timestamp: Math.floor(new Date(d.timestamp).getTime()),
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume,
  }));
}


