import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { getContractAddresses } from '@/contracts/config';
import TokenFactoryV3ABI from '@/contracts/abis/TokenFactoryV3.json';
import OKBTokenABI from '@/contracts/abis/OKBToken.json';
import BondingCurveV3ABI from '@/contracts/abis/BondingCurveV3_Final.json';
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
  const { isLoading: isConfirming, isSuccess, isError, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });

  // 读取用户OKB余额
  const { data: okbBalanceRaw, refetch: refetchOkbBalance } = useReadContract({
    address: addresses.OKB_TOKEN as `0x${string}`,
    abi: OKBTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // 读取OKB授权额度
  const { data: okbAllowanceRaw, refetch: refetchOkbAllowance } = useReadContract({
    address: addresses.OKB_TOKEN as `0x${string}`,
    abi: OKBTokenABI,
    functionName: 'allowance',
    args: address ? [address, addresses.TOKEN_FACTORY_V3] : undefined,
  });

  // 读取OKB对BondingCurve的授权额度
  const { data: okbAllowanceBondingCurveRaw, refetch: refetchOkbAllowanceBondingCurve } = useReadContract({
    address: addresses.OKB_TOKEN as `0x${string}`,
    abi: OKBTokenABI,
    functionName: 'allowance',
    args: address ? [address, addresses.BONDING_CURVE_V3] : undefined,
  });

  // 格式化OKB余额和授权额度
  const okbBalance = okbBalanceRaw ? parseFloat(formatEther(okbBalanceRaw as bigint)) : 0;
  const okbAllowance = okbAllowanceRaw ? parseFloat(formatEther(okbAllowanceRaw as bigint)) : 0;
  const okbAllowanceBondingCurve = okbAllowanceBondingCurveRaw ? parseFloat(formatEther(okbAllowanceBondingCurveRaw as bigint)) : 0;

  // 创建代币（无初始购买）
  const createToken = async (tokenData: TokenCreationData) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      console.log("=== CREATE TOKEN WITHOUT PURCHASE ===");
      console.log("Creating token without purchase:", tokenData);
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

      console.log("Contract config for createToken:", contractConfig);
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
      
      // 检查授权额度是否足够
      if (okbAllowance < tokenData.initialPurchase) {
        toast.info('Approving OKB tokens for token creation...');
        
        // 授权OKB
        const approveConfig = {
          address: addresses.OKB_TOKEN as `0x${string}`,
          abi: OKBTokenABI,
          functionName: 'approve' as const,
          args: [addresses.TOKEN_FACTORY_V3, okbAmount] as const,
        };

        writeContract(approveConfig as any);
        return; // 等待授权完成后再创建代币
      }
      
      // 如果授权足够，直接创建代币
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

      console.log("=== CREATE TOKEN WITH PURCHASE ===");
      console.log("Contract config for createTokenWithPurchase:", contractConfig);
      writeContract(contractConfig as any);
    } catch (err) {
      console.error('Error creating token with purchase:', err);
      toast.error('Failed to create token with purchase');
    }
  };

  // 批准OKB Token（用于代币创建）
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

  // 批准OKB Token（用于交易）
  const approveOKBForTrading = async (amount: number) => {
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
        args: [addresses.BONDING_CURVE_V3, okbAmount] as const,
      };

      writeContract(contractConfig as any);
    } catch (err) {
      console.error('Error approving OKB for trading:', err);
      toast.error('Failed to approve OKB for trading');
    }
  };

  // 买入代币
  const buyToken = async (tokenAddress: string, okbAmount: number) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    // 检查授权额度是否足够
    if (okbAllowanceBondingCurve < okbAmount) {
      toast.info('Approving OKB tokens for trading...');
      await approveOKBForTrading(okbAmount);
      return; // 等待授权完成后再买入
    }

    try {
      const contractConfig = {
        address: addresses.BONDING_CURVE_V3 as `0x${string}`,
        abi: BondingCurveV3ABI,
        functionName: 'buyTokens' as const,
        args: [tokenAddress as `0x${string}`, parseEther(okbAmount.toString())] as const,
      };

      console.log("=== BUY TOKENS ===");
      console.log("Contract config for buyTokens:", contractConfig);
      writeContract(contractConfig as any);
    } catch (err) {
      console.error('Error buying tokens:', err);
      toast.error('Failed to buy tokens');
    }
  };

  // 卖出代币
  const sellToken = async (tokenAddress: string, tokenAmount: number) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const contractConfig = {
        address: addresses.BONDING_CURVE_V3 as `0x${string}`,
        abi: BondingCurveV3ABI,
        functionName: 'sellTokens' as const,
        args: [tokenAddress as `0x${string}`, parseEther(tokenAmount.toString())] as const,
      };

      console.log("=== SELL TOKENS ===");
      console.log("Contract config for sellTokens:", contractConfig);
      writeContract(contractConfig as any);
    } catch (err) {
      console.error('Error selling tokens:', err);
      toast.error('Failed to sell tokens');
    }
  };

  return {
    // 状态
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    receiptError,
    hash,
    
    // 数据
    okbBalance,
    okbAllowance,
    okbAllowanceBondingCurve,
    refetchOkbBalance,
    refetchOkbAllowance,
    refetchOkbAllowanceBondingCurve,
    
    // 方法
    createToken,
    createTokenWithPurchase,
    approveOKB,
    approveOKBForTrading,
    buyToken,
    sellToken,
  };
}
