'use client';

import { useReadContract } from 'wagmi';
import { bondingCurveV3Address, bondingCurveV3Abi } from '@/lib/contracts';
import { formatUnits, parseUnits } from 'viem';

export function useTokenChainData(tokenAddress: `0x${string}`) {

  // Fetch how many tokens can be bought with 1 OKB (10^18 wei)
  const { data: tokensPerOkb, error: priceError, isLoading: isPriceLoading } = useReadContract({
    address: bondingCurveV3Address,
    abi: bondingCurveV3Abi,
    functionName: 'calculatePurchaseReturn',
    args: [tokenAddress, parseUnits('1', 18)], // 1 OKB
    query: {
      enabled: !!tokenAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Calculate the price of 1 token in OKB
  const priceInOkb = tokensPerOkb ? 1 / parseFloat(formatUnits(tokensPerOkb as bigint, 18)) : 0;

  return {
    priceInOkb,
    isLoading: isPriceLoading,
    error: priceError,
  };
}
