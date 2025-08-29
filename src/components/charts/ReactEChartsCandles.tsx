'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

type Interval = '1m' | '5m' | '1h' | '1d';

interface EChartsCandlesProps {
  data: Array<{ timestamp: string; open: number; high: number; low: number; close: number; volume: number; }>;
  symbol: string;
  interval?: Interval;
}

export default function ReactEChartsCandles({ data, symbol, interval = '1m' }: EChartsCandlesProps) {
  const option = useMemo(() => {
    const times = data.map(d => new Date(d.timestamp).getTime());
    const ohlc = data.map(d => [d.open, d.close, d.low, d.high]);
    const volumes = data.map(d => [d.volume, d.close >= d.open ? 1 : -1]);

    const formatTime = (val: number) => {
      const d = new Date(val);
      if (interval === '1d') return `${d.getMonth() + 1}/${d.getDate()}`;
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    };
    const formatNum = (n: number) => {
      if (n === null || n === undefined || isNaN(Number(n))) return '-';
      return Number(n).toFixed(8);
    };

    const lastIdx = times.length - 1;
    const visibleCount = 40;
    const startIdx = Math.max(0, lastIdx - (visibleCount - 1));

    return {
      backgroundColor: '#0B0C1C',
      title: {
        text: `${symbol} / OKB`,
        left: 'center',
        top: 4,
        textStyle: { color: '#A4A7B7', fontSize: 12 }
      },
      textStyle: { color: '#A4A7B7' },
      axisPointer: {
        link: [{ xAxisIndex: [0, 1] }],
        label: {
          formatter: (params: any) => formatTime(Number(params.value))
        }
      },
      grid: [
        { left: 10, right: 10, top: 28, height: '62%', containLabel: true },
        { left: 10, right: 10, top: '74%', height: '20%', containLabel: true }
      ],
      xAxis: [
        { type: 'category', data: times, boundaryGap: true, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
          axisTick: { show: true, alignWithLabel: true },
          axisLabel: { formatter: (val: string) => formatTime(Number(val)), hideOverlap: true, align: 'center' } },
        { type: 'category', gridIndex: 1, data: times, axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false } },
      ],
      yAxis: [
        { 
          scale: true, 
          position: 'right', 
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } }, 
          axisTick: { inside: false },
          axisLabel: { inside: false, margin: 14, color: '#A4A7B7', formatter: (val: number) => formatNum(val) },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } 
        },
        { gridIndex: 1, position: 'right', splitNumber: 2, axisLine: { show: false }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], startValue: startIdx, endValue: lastIdx, throttle: 50 },
        { type: 'slider', xAxisIndex: [0, 1], bottom: 0, startValue: startIdx, endValue: lastIdx }
      ],
      series: [
        { type: 'candlestick', name: symbol, data: ohlc, barWidth: 12, barMinWidth: 8, barCategoryGap: '10%',
          itemStyle: { color: '#22c55e', color0: '#ef4444', borderColor: '#22c55e', borderColor0: '#ef4444' } },
        { type: 'bar', name: 'Volume', xAxisIndex: 1, yAxisIndex: 1, data: volumes.map((v, i) => ({ value: v[0], itemStyle: { color: v[1] === 1 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)' } })) },
      ],
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'cross' },
        formatter: (params: any[]) => {
          if (!params || !params.length) return '';
          const p = params[0];
          const idx = p.dataIndex;
          const d = p.data || [];
          const t = times[idx];
          const open = d[0], close = d[1], low = d[2], high = d[3];
          const timeStr = new Date(t).toLocaleString('en-US', { hour12: false }).replace(',', '');
          return `
            <div>
              <div style="margin-bottom:4px;">${timeStr}</div>
              <div>open:&nbsp;&nbsp;${formatNum(open)}</div>
              <div>close:&nbsp;${formatNum(close)}</div>
              <div>lowest:${formatNum(low)}</div>
              <div>highest:${formatNum(high)}</div>
            </div>
          `;
        }
      },
      animation: false,
    } as any;
  }, [data, symbol, interval]);

  return <ReactECharts option={option} style={{ height: 384, width: '100%' }} />;
}


