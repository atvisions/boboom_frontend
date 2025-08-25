import { useQuery } from '@tanstack/react-query';

// This interface matches the data structure required by TransactionHistory.tsx
export interface Transaction {
  tx_hash: string;
  user_address: string;
  transaction_type: 'BUY' | 'SELL';
  token_amount: string;
  price: string;
  timestamp: string;
}

const fetchTokenTransactions = async (tokenAddress: string): Promise<Transaction[]> => {
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!apiUrl) {
    throw new Error('API URL is not configured');
  }

  // The new backend endpoint for real transaction data
  const response = await fetch(`${apiUrl}/api/tokens/${tokenAddress}/transaction-history/`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Network response was not ok');
  }

  const result = await response.json();

  // Map the real data from the backend to the format the component expects
  return result.map((tx: any) => ({
    tx_hash: tx.transaction_hash,
    user_address: tx.user_address,
    transaction_type: tx.transaction_type,
    token_amount: tx.token_amount,
    price: tx.price,
    timestamp: tx.timestamp,
  }));
};

export function useTokenTransactions(tokenAddress: string) {
  return useQuery<Transaction[], Error>({
    queryKey: ['tokenTransactions', tokenAddress],
    queryFn: () => fetchTokenTransactions(tokenAddress),
    enabled: !!tokenAddress,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

