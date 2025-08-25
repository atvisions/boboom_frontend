'use client';

import { useReadContract } from 'wagmi';
import { useDebounce } from './useDebounce';
import { bondingCurveV3Address, bondingCurveV3Abi } from '@/lib/contracts';
import { parseUnits, formatUnits } from 'viem';

interface UseTradeQuoteProps {
  tokenAddress: `0x${string}`;
  tradeMode: 'buy' | 'sell';
  inputAmount: string;
}

export function useTradeQuote({ tokenAddress, tradeMode, inputAmount }: UseTradeQuoteProps) {
  const debouncedAmount = useDebounce(inputAmount, 300);
  const amountAsBigInt = debouncedAmount ? parseUnits(debouncedAmount, 18) : BigInt(0);

  const { data: quoteData, isLoading, error } = useReadContract({
    address: bondingCurveV3Address,
    abi: bondingCurveV3Abi,
    functionName: tradeMode === 'buy' ? 'calculatePurchaseReturn' : 'calculateSaleReturn',
    args: [tokenAddress, amountAsBigInt],
    query: {
      enabled: amountAsBigInt > 0,
    },
  });

  const quote = quoteData ? formatUnits(quoteData as bigint, 18) : null;

  return { quote, isLoading, error };
}

