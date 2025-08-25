'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi, parseUnits, maxUint256 } from 'viem';

interface UseApproveAndTradeProps {
  tokenToSpend: `0x${string}`;
  spenderAddress: `0x${string}`;
  amountToSpend: bigint;
}

export function useApproveAndTrade({ tokenToSpend, spenderAddress, amountToSpend }: UseApproveAndTradeProps) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | undefined>();

  // 1. Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenToSpend,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, spenderAddress],
    query: { enabled: !!address && !!tokenToSpend && !!spenderAddress },
  });

  // 2. Update approval status when allowance changes
  useEffect(() => {
    if (allowance !== undefined && allowance >= amountToSpend) {
      setIsApproved(true);
    } else {
      setIsApproved(false);
    }
  }, [allowance, amountToSpend]);

  // 3. Wait for approval transaction to be confirmed
  const { isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({ hash: approvalTxHash });

  useEffect(() => {
    if (isApprovalConfirmed) {
      setIsApproving(false);
      refetchAllowance();
    }
  }, [isApprovalConfirmed, refetchAllowance]);

  // 4. Function to initiate approval
  const approve = async () => {
    if (!spenderAddress || !tokenToSpend) return;
    setIsApproving(true);
    try {
      const hash = await writeContractAsync({
        address: tokenToSpend,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, maxUint256], // Approve a practically infinite amount
      });
      setApprovalTxHash(hash);
    } catch (error) {
      console.error('Approval failed:', error);
      setIsApproving(false);
    }
  };

  return {
    isApproved,
    approve,
    isApproving,
    isApprovalConfirmed,
  };
}
