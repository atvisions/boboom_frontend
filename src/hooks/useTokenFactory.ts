import { useState, useEffect } from 'react';
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

  // 监听交易成功状态，自动刷新余额
  useEffect(() => {
    if (isSuccess && hash) {
      console.log("Transaction successful, refreshing balances...");
      refetchOkbBalance();
      refetchOkbAllowanceBondingCurve();
    }
  }, [isSuccess, hash]); // 移除refetch函数依赖

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

  // 实时检查OKB授权额度
  const checkOkbAllowance = async () => {
    if (!address) return 0;
    
    try {
      // 重新获取授权额度
      await refetchOkbAllowanceBondingCurve();
      return okbAllowanceBondingCurve;
    } catch (error) {
      console.error('Failed to check OKB allowance:', error);
      return okbAllowanceBondingCurve;
    }
  };

  // 买入代币
  const buyToken = async (tokenAddress: string, okbAmount: number) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    console.log("=== BUY TOKENS DEBUG ===");
    console.log("Address:", address);
    console.log("Token Address:", tokenAddress);
    console.log("OKB Amount:", okbAmount);
    console.log("writeContract available:", !!writeContract);
    console.log("Network addresses:", addresses);
    console.log("BondingCurve address:", addresses.BONDING_CURVE_V3);

    try {
      const contractConfig = {
        address: addresses.BONDING_CURVE_V3 as `0x${string}`,
        abi: BondingCurveV3ABI.abi,
        functionName: 'buyTokens' as const,
        args: [tokenAddress as `0x${string}`, parseEther(okbAmount.toString()), 0] as const, // 添加minTokensOut参数，设为0表示接受任何滑点
      };

      console.log("=== BUY TOKENS ===");
      console.log("Contract config for buyTokens:", contractConfig);
      
      // 检查writeContract是否可用
      if (!writeContract) {
        throw new Error('writeContract is not available');
      }
      
      console.log("Calling writeContract...");
      // 触发买入交易，这会弹出MetaMask
      const result = writeContract(contractConfig as any);
      console.log("writeContract result:", result);
      
      // 检查是否有错误
      if (error) {
        console.error("writeContract error:", error);
        throw new Error(`writeContract error: ${error.message}`);
      }
      
      console.log("writeContract called successfully");
    } catch (err) {
      console.error('Error buying tokens:', err);
      toast.error('Failed to buy tokens');
      throw err; // 重新抛出错误，让调用者知道
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
        abi: BondingCurveV3ABI.abi,
        functionName: 'sellTokens' as const,
        args: [tokenAddress as `0x${string}`, parseEther(tokenAmount.toString()), 0] as const, // 添加minOkbOut参数，设为0表示接受任何滑点
      };

      console.log("=== SELL TOKENS ===");
      console.log("Contract config for sellTokens:", contractConfig);
      
      // 检查writeContract是否可用
      if (!writeContract) {
        throw new Error('writeContract is not available');
      }
      
      writeContract(contractConfig as any);
    } catch (err) {
      console.error('Error selling tokens:', err);
      toast.error('Failed to sell tokens');
      throw err; // 重新抛出错误，让调用者知道
    }
  };

  // 获取买入报价
  const getBuyQuote = async (tokenAddress: string, okbAmount: number) => {
    if (!address) return null;
    
    try {
      const result = await fetch('/api/quote/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress,
          okbAmount,
          network: 'sepolia'
        }),
      });
      
      if (result.ok) {
        const data = await result.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error getting buy quote:', error);
      return null;
    }
  };

  // 获取卖出报价
  const getSellQuote = async (tokenAddress: string, tokenAmount: number) => {
    if (!address) return null;
    
    try {
      const result = await fetch('/api/quote/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress,
          tokenAmount,
          network: 'sepolia'
        }),
      });
      
      if (result.ok) {
        const data = await result.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error getting sell quote:', error);
      return null;
    }
  };

  // 获取当前价格
  const getCurrentPrice = async (tokenAddress: string) => {
    if (!address) return 0;
    
    try {
      const result = await fetch('/api/quote/price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress,
          network: 'sepolia'
        }),
      });
      
      if (result.ok) {
        const data = await result.json();
        return data.price || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting current price:', error);
      return 0;
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
    checkOkbAllowance,
    buyToken,
    sellToken,
    getBuyQuote,
    getSellQuote,
    getCurrentPrice,
  };
}
