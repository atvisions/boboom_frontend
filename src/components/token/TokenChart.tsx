'use client';

import { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { useTokenChartData } from '../../hooks/useTokenChartData';

interface TokenChartProps {
  tokenAddress: string;
}

const chartColors = {
  backgroundColor: '#111827', // gray-900
  lineColor: '#34D399', // green-400
  textColor: '#D1D5DB', // gray-300
  areaTopColor: 'rgba(52, 211, 153, 0.5)',
  areaBottomColor: 'rgba(52, 211, 153, 0.01)',
};

export function TokenChart({ tokenAddress }: TokenChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState('24h');
  const { data: chartData, isLoading, error } = useTokenChartData(tokenAddress, timeframe);

  useEffect(() => {
    if (!chartContainerRef.current || !chartData || chartData.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: chartColors.backgroundColor },
        textColor: chartColors.textColor,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const areaSeries = chart.addAreaSeries({
      lineColor: chartColors.lineColor,
      topColor: chartColors.areaTopColor,
      bottomColor: chartColors.areaBottomColor,
      lineWidth: 2,
    });

    const formattedData = chartData.map(d => ({ time: d.time as UTCTimestamp, value: d.value }));
    areaSeries.setData(formattedData);
    chart.timeScale().fitContent();

    const handleResize = () => chart.resize(chartContainerRef.current!.clientWidth, 400);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [chartData]);

  if (isLoading) return <div className="h-96 flex items-center justify-center text-gray-500">Loading chart...</div>;
  if (error) return <div className="h-96 flex items-center justify-center text-red-500">Error: {error.message}</div>;

  return (
    <div>
      <div className="flex space-x-2 mb-4">
        {['24h', '7d', '30d', 'all'].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1 text-sm rounded-md ${timeframe === tf ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {tf.toUpperCase()}
          </button>
        ))}
      </div>
      <div ref={chartContainerRef} className="w-full h-[400px]" />
      {(!chartData || chartData.length === 0) && !isLoading && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-500">
          No chart data available for this period.
        </div>
      )}
    </div>
  );
}

