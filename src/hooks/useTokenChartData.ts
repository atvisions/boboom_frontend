'use client';

import { useQuery } from '@tanstack/react-query';

// lightweight-charts expects time in UNIX timestamp (seconds)
export interface ChartDataPoint {
  time: number;
  value: number;
}

const fetchTokenChartData = async (tokenAddress: string, timeframe: string): Promise<ChartDataPoint[]> => {
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!apiUrl) {
    throw new Error('API URL is not configured');
  }

  const response = await fetch(`${apiUrl}/api/tokens/${tokenAddress}/price-history/?timeframe=${timeframe}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Network response was not ok');
  }

  const result = await response.json();

  // The backend returns 'timestamp' (ISO string) and 'price'.
  // We need to convert it to the format lightweight-charts expects.
  return result.map((d: any) => ({
    time: new Date(d.timestamp).getTime() / 1000, // Convert ISO string to UNIX timestamp in seconds
    value: parseFloat(d.price),
  }));
};

export function useTokenChartData(tokenAddress: string, timeframe: string) {
  return useQuery<ChartDataPoint[], Error>({
    queryKey: ['tokenChartData', tokenAddress, timeframe],
    queryFn: () => fetchTokenChartData(tokenAddress, timeframe),
    enabled: !!tokenAddress,
  });
}


