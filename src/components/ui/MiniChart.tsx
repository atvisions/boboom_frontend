"use client";

import React from 'react';
import websocketService from '@/services/websocket';

interface MiniChartProps {
  data?: number[];
  tokenAddress?: string;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  useRealData?: boolean;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data = [],
  tokenAddress,
  width = 48,
  height = 24,
  color = '#10B981',
  className = '',
  useRealData = false
}) => {
  const [realData, setRealData] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState(false);

  // 获取真实价格数据
  const fetchChartData = React.useCallback(async () => {
    if (!useRealData || !tokenAddress) return;

    setLoading(true);
    try {
      // 调用API获取真实数据
      const response = await fetch(`/api/tokens/tokens/${tokenAddress}/mini-chart/?network=sepolia&points=8`);
      const data = await response.json();

      if (data.success && data.data.prices) {
        setRealData(data.data.prices);
      } else {
        // 如果API失败，使用模拟数据
        setRealData(generateMockData());
      }
    } catch (error) {
      console.warn('Failed to fetch real chart data:', error);
      // 如果请求失败，使用模拟数据
      setRealData(generateMockData());
    } finally {
      setLoading(false);
    }
  }, [useRealData, tokenAddress]);

  // 初始数据获取
  React.useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // WebSocket实时更新
  React.useEffect(() => {
    if (!useRealData || !tokenAddress) return;

    // 在开发环境中，由于React的严格模式会导致组件双重渲染，
    // 我们需要延迟WebSocket连接以避免连接冲突
    const isDevelopment = process.env.NODE_ENV === 'development';
    const delay = isDevelopment ? 1500 : 100;

    let connectionId: string | null = null;
    let isMounted = true;

    const timer = setTimeout(() => {
      if (!isMounted) return;

      // 连接到代币详情WebSocket以获取实时价格更新
      connectionId = websocketService.connect(
        `tokens/${tokenAddress}/`,
        (message) => {
          if (!isMounted) return;
          if (message.type === 'token_detail_update' || message.type === 'price_update') {
            // 价格更新时重新获取图表数据
            fetchChartData();
          }
        },
        (error) => {
          if (!isMounted) return;
          // 在开发环境中，WebSocket连接失败是正常的，不显示错误
          if (!isDevelopment) {
            console.error(`MiniChart: WebSocket error for ${tokenAddress}:`, error);
          }
        }
      );
    }, delay);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (connectionId) {
        websocketService.disconnect(connectionId);
      }
    };
  }, [useRealData, tokenAddress, fetchChartData]);

  // 确定使用的数据源
  const chartData = useRealData && realData.length > 0
    ? realData
    : data.length > 0
    ? data
    : generateMockData();
  
  // 计算SVG路径
  const path = generatePath(chartData, width, height);
  
  // 判断趋势（上涨/下跌）
  const isPositive = chartData.length > 1 && chartData[chartData.length - 1] > chartData[0];
  const chartColor = color === '#10B981' ? (isPositive ? '#10B981' : '#EF4444') : color;

  return (
    <div className={`inline-block ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* 渐变定义 */}
        <defs>
          <linearGradient id={`gradient-${Math.random()}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={chartColor} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* 填充区域 */}
        <path
          d={`${path} L ${width} ${height} L 0 ${height} Z`}
          fill={`url(#gradient-${Math.random()})`}
          className="opacity-50"
        />
        
        {/* 主线条 */}
        <path
          d={path}
          fill="none"
          stroke={chartColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />
        
        {/* 终点圆点 */}
        {chartData.length > 0 && (
          <circle
            cx={width}
            cy={normalizeY(chartData[chartData.length - 1], chartData, height)}
            r="1.5"
            fill={chartColor}
            className="drop-shadow-sm"
          />
        )}
      </svg>
    </div>
  );
};

// 生成模拟数据
function generateMockData(): number[] {
  const points = 8;
  const data: number[] = [];
  let value = 100;
  
  for (let i = 0; i < points; i++) {
    // 添加一些随机波动
    const change = (Math.random() - 0.5) * 20;
    value = Math.max(50, Math.min(150, value + change));
    data.push(value);
  }
  
  return data;
}

// 生成SVG路径
function generatePath(data: number[], width: number, height: number): string {
  if (!Array.isArray(data) || data.length === 0) return '';

  // 过滤掉无效值
  const validData = data.filter(v => isFinite(v));
  if (validData.length === 0) return '';

  const stepX = width / Math.max(validData.length - 1, 1);

  let path = '';

  validData.forEach((value, index) => {
    const x = index * stepX;
    const y = normalizeY(value, validData, height);

    // 确保坐标值是有效的
    if (!isFinite(x) || !isFinite(y)) return;

    if (index === 0) {
      path += `M ${x} ${y}`;
    } else {
      // 使用平滑曲线
      const prevX = (index - 1) * stepX;
      const prevY = normalizeY(validData[index - 1], validData, height);

      // 确保所有控制点坐标都是有效的
      if (isFinite(prevX) && isFinite(prevY)) {
        const cpX1 = prevX + stepX * 0.4;
        const cpY1 = prevY;
        const cpX2 = x - stepX * 0.4;
        const cpY2 = y;

        if (isFinite(cpX1) && isFinite(cpY1) && isFinite(cpX2) && isFinite(cpY2)) {
          path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
        } else {
          path += ` L ${x} ${y}`;
        }
      }
    }
  });

  return path;
}

// 标准化Y坐标
function normalizeY(value: number, data: number[], height: number): number {
  // 检查输入值的有效性
  if (!isFinite(value) || !Array.isArray(data) || data.length === 0) {
    return height / 2;
  }

  // 过滤掉无效值
  const validData = data.filter(v => isFinite(v));
  if (validData.length === 0) {
    return height / 2;
  }

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min;

  if (range === 0 || !isFinite(range)) return height / 2;

  const padding = height * 0.1; // 10% padding
  const availableHeight = height - 2 * padding;

  const normalizedValue = padding + (1 - (value - min) / range) * availableHeight;

  // 确保返回值是有效的数字
  return isFinite(normalizedValue) ? normalizedValue : height / 2;
}

export default MiniChart;
