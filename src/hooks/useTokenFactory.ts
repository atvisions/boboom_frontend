import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { getContractAddresses } from '@/contracts/config';
import TokenFactoryV3ABI from '@/contracts/abis/TokenFactoryV3.json';
import OKBTokenABI from '@/contracts/abis/OKBToken.json';
import { toast } from 'sonner';

export interface TokenCreationData {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  website: string;
  twitter: string;
  telegram: string;
  initialPurchase?: number; // OKB amount for initial purchase (optional)
}

export function useTokenFactory(network: 'sepolia' | 'xlayer' = 'sepolia') {
  const addresses = getContractAddresses(network);
  const { address } = useAccount();
  
  // 写入合约
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // 等待交易确认
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // 读取用户OKB余额
  const { data: okbBalanceRaw, refetch: refetchOkbBalance } = useReadContract({
    address: addresses.OKB_TOKEN as `0x${string}`,
    abi: OKBTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // 格式化OKB余额
  const okbBalance = okbBalanceRaw ? parseFloat(formatEther(okbBalanceRaw as bigint)) : 0;

  // 创建代币（无初始购买）
  const createToken = async (tokenData: TokenCreationData) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      // 使用类型断言来避免复杂的类型检查
      const contractConfig = {
        address: addresses.TOKEN_FACTORY_V3 as `0x${string}`,
        abi: TokenFactoryV3ABI,
        functionName: 'createToken' as const,
        args: [
          tokenData.name,
          tokenData.symbol,
          tokenData.description,
          tokenData.imageUrl,
          tokenData.website,
          tokenData.twitter,
          tokenData.telegram,
        ] as const,
      };

      writeContract(contractConfig as any);
    } catch (err) {
      console.error('Error creating token:', err);
      toast.error('Failed to create token');
    }
  };

  // 创建代币（带初始购买）
  const createTokenWithPurchase = async (tokenData: TokenCreationData) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!tokenData.initialPurchase || tokenData.initialPurchase <= 0) {
      toast.error('Initial purchase amount must be greater than 0');
      return;
    }

    try {
      const okbAmount = parseEther(tokenData.initialPurchase.toString());
      
      const contractConfig = {
        address: addresses.TOKEN_FACTORY_V3 as `0x${string}`,
        abi: TokenFactoryV3ABI,
        functionName: 'createTokenWithPurchase' as const,
        args: [
          tokenData.name,
          tokenData.symbol,
          tokenData.description,
          tokenData.imageUrl,
          tokenData.website,
          tokenData.twitter,
          tokenData.telegram,
          okbAmount,
        ] as const,
      };

      writeContract(contractConfig as any);
    } catch (err) {
      console.error('Error creating token with purchase:', err);
      toast.error('Failed to create token with purchase');
    }
  };

  // 批准OKB Token
  const approveOKB = async (amount: number) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const okbAmount = parseEther(amount.toString());
      
      const contractConfig = {
        address: addresses.OKB_TOKEN as `0x${string}`,
        abi: OKBTokenABI,
        functionName: 'approve' as const,
        args: [addresses.TOKEN_FACTORY_V3, okbAmount] as const,
      };

      writeContract(contractConfig as any);
    } catch (err) {
      console.error('Error approving OKB:', err);
      toast.error('Failed to approve OKB');
    }
  };

  return {
    // 状态
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    
    // 数据
    okbBalance,
    refetchOkbBalance,
    
    // 方法
    createToken,
    createTokenWithPurchase,
    approveOKB,
  };
}
