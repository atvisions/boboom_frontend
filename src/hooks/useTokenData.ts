import { useQuery } from '@tanstack/react-query';

// Define the expected shape of the token data from the API
interface TokenData {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image_url: string;
  creator: { address: string; username: string; };
  website: string;
  twitter: string;
  telegram: string;
  total_supply: string;
  phase: string;
  okb_collected: string;
  tokens_traded: string;
  graduation_progress: number;
  current_price: string;
  market_cap: string;
  volume_24h: string;
  price_change_24h: string;
  holder_count: number;
  transaction_count: number;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  network: string;
}

const fetchTokenData = async (tokenAddress: string): Promise<TokenData> => {
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL; // Corrected env variable
  if (!apiUrl) {
    throw new Error('API URL is not configured');
  }

  const response = await fetch(`${apiUrl}/api/tokens/${tokenAddress}/`); // Corrected URL path
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Network response was not ok');
  }

  return data; // The data object itself contains the token fields
};

export function useTokenData(tokenAddress: string) {
  return useQuery<TokenData, Error>({
    queryKey: ['tokenData', tokenAddress],
    queryFn: () => fetchTokenData(tokenAddress),
    enabled: !!tokenAddress, // Only run the query if tokenAddress is not null/undefined
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

