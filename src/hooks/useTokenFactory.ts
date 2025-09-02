import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { getContractAddresses, NETWORK_CONFIG } from '@/contracts/config';
import TokenFactoryV3ABI from '@/contracts/abis/TokenFactoryV3.json';
import OKBTokenABI from '@/contracts/abis/OKBToken.json';
import BondingCurveV3ABI from '@/contracts/abis/BondingCurveV3_Final.json';
import { toast } from 'sonner';
import { TOKEN_FLAGS } from '@/contracts/config';

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
  const publicClient = usePublicClient();
  const chainIdNum = Number(NETWORK_CONFIG.NETWORK_ID || '11155111');
  
  // 写入合约（独立通道）：授权
  const { writeContract: writeApprove, data: approvalHash, isPending: isApprovalPending, error: approvalError } = useWriteContract();
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess, isError: isApprovalFailed, error: approvalReceiptError } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // 写入合约（独立通道）：创建
  const { writeContract: writeCreate, data: createHash, isPending: isCreatePending, error: createError } = useWriteContract();
  const { isLoading: isCreateConfirming, isSuccess: isCreateSuccess, isError: isCreateFailed, error: createReceiptError } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  // 读取用户OKB余额
  const { data: okbBalanceRaw, refetch: refetchOkbBalance } = useReadContract({
    address: addresses.OKB_TOKEN as `0x${string}`,
    abi: OKBTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !TOKEN_FLAGS.OKB_IS_NATIVE,
    chainId: chainIdNum,
  } as any);

  // 读取OKB授权额度（给Factory）
  const { data: okbAllowanceRaw, refetch: refetchOkbAllowance } = useReadContract({
    address: addresses.OKB_TOKEN as `0x${string}`,
    abi: OKBTokenABI,
    functionName: 'allowance',
    args: address ? [address, addresses.TOKEN_FACTORY_V3] : undefined,
    chainId: chainIdNum,
  });

  // 读取OKB对BondingCurve的授权额度（交易用）
  const { data: okbAllowanceBondingCurveRaw, refetch: refetchOkbAllowanceBondingCurve } = useReadContract({
    address: addresses.OKB_TOKEN as `0x${string}`,
    abi: OKBTokenABI,
    functionName: 'allowance',
    args: address ? [address, addresses.BONDING_CURVE_V3] : undefined,
    chainId: chainIdNum,
  });

  // 读取代币余额的函数
  const getTokenBalance = async (tokenAddress: string): Promise<number> => {
    if (!address || !tokenAddress || !publicClient) return 0;
    try {
      const erc20Abi = [
        { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
        { inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' }
      ] as const;
      const balanceRaw = await (publicClient as any).readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      }) as bigint;
      let decimals = 18;
      try {
        const d = await (publicClient as any).readContract({ address: tokenAddress as `0x${string}`, abi: erc20Abi, functionName: 'decimals' }) as number;
        if (typeof d === 'number') decimals = d;
      } catch {}
      const value = Number(balanceRaw) / 10 ** decimals;
      return value;
    } catch (error) {
      console.error('Error reading token balance:', error);
      return 0;
    }
  };

  // 格式化OKB余额和授权额度
  const okbBalanceErc20 = okbBalanceRaw ? parseFloat(formatEther(okbBalanceRaw as bigint)) : 0;
  const [okbNative, setOkbNative] = useState<number>(0);

  useEffect(() => {
    const loadNative = async () => {
      if (!TOKEN_FLAGS.OKB_IS_NATIVE || !address || !publicClient) return;
      try {
        const native = await (publicClient as any).getBalance({ address });
        setOkbNative(parseFloat(formatEther(native as bigint)));
      } catch (e) {
        console.warn('read native OKB balance failed', e);
      }
    };
    loadNative();
  }, [address, publicClient]);

  const okbBalance = TOKEN_FLAGS.OKB_IS_NATIVE ? okbNative : okbBalanceErc20;
  const okbAllowance = okbAllowanceRaw ? parseFloat(formatEther(okbAllowanceRaw as bigint)) : 0;
  const okbAllowanceBondingCurve = okbAllowanceBondingCurveRaw ? parseFloat(formatEther(okbAllowanceBondingCurveRaw as bigint)) : 0;

  // 读取OKB余额（可供组件直接调用数值）
  const getOkbBalance = (): number => okbBalance;

  // 任何一个交易成功后，延迟刷新余额与授权
  useEffect(() => {
    const anySuccess = isApprovalSuccess || isCreateSuccess;
    const anyHash = approvalHash || createHash;
    if (anySuccess && anyHash) {
      setTimeout(() => {
        refetchOkbBalance();
        refetchOkbAllowance();
        refetchOkbAllowanceBondingCurve();
      }, 2000);
    }
  }, [isApprovalSuccess, isCreateSuccess, approvalHash, createHash]);

  // 创建代币（无初始购买）
  const createToken = async (tokenData: TokenCreationData) => {
    if (!address) { toast.error('Please connect your wallet first'); return; }
    try {
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
      writeCreate(contractConfig as any);
    } catch (err) {
      console.error('Error creating token:', err);
      toast.error('Failed to create token');
    }
  };

  // 创建代币（带初始购买）
  const createTokenWithPurchase = async (tokenData: TokenCreationData) => {
    if (!address) { toast.error('Please connect your wallet first'); return; }
    if (!tokenData.initialPurchase || tokenData.initialPurchase <= 0) { toast.error('Initial purchase amount must be greater than 0'); return; }
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
      writeCreate(contractConfig as any);
    } catch (err) {
      console.error('Error creating token with purchase:', err);
      toast.error('Failed to create token with purchase');
    }
  };

  // 批准OKB Token（用于代币创建）
  const approveOKB = async (amount: number) => {
    if (!address) { toast.error('Please connect your wallet first'); return; }
    try {
      const okbAmount = parseEther(amount.toString());
      const contractConfig = {
        address: addresses.OKB_TOKEN as `0x${string}`,
        abi: OKBTokenABI,
        functionName: 'approve' as const,
        args: [addresses.TOKEN_FACTORY_V3, okbAmount] as const,
      };
      writeApprove(contractConfig as any);
    } catch (err) {
      console.error('Error approving OKB:', err);
      toast.error('Failed to approve OKB');
    }
  };

  // 批准OKB Token（用于交易）
  const approveOKBForTrading = async (amount: number) => {
    if (!address) { toast.error('Please connect your wallet first'); return; }
    try {
      const okbAmount = parseEther(amount.toString());
      const contractConfig = {
        address: addresses.OKB_TOKEN as `0x${string}`,
        abi: OKBTokenABI,
        functionName: 'approve' as const,
        args: [addresses.BONDING_CURVE_V3, okbAmount] as const,
      };
      writeApprove(contractConfig as any);
    } catch (err) {
      console.error('Error approving OKB for trading:', err);
      toast.error('Failed to approve OKB for trading');
    }
  };

  // 实时检查OKB授权额度
  const checkOkbAllowance = async () => {
    if (!address) return 0;
    try {
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
    console.log("writeContract available:", !!writeApprove); // Assuming writeApprove is the correct one for buy
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
      
      // 检查writeApprove是否可用
      if (!writeApprove) {
        throw new Error('writeApprove is not available');
      }
      
      console.log("Calling writeApprove...");
      // 触发买入交易，这会弹出MetaMask
      const result = writeApprove(contractConfig as any);
      console.log("writeApprove result:", result);
      
      // 检查是否有错误
      if (approvalError) {
        console.error("writeApprove error:", approvalError);
        throw new Error(`writeApprove error: ${approvalError.message}`);
      }
      
      console.log("writeApprove called successfully");
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
      
      // 检查writeApprove是否可用
      if (!writeApprove) {
        throw new Error('writeApprove is not available');
      }
      
      writeApprove(contractConfig as any);
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
    // 授权状态（独立）
    approvalHash,
    isApprovalPending,
    isApprovalConfirming,
    isApprovalSuccess,
    isApprovalFailed,
    approvalError,
    approvalReceiptError,

    // 创建状态（独立）
    createHash,
    isCreatePending,
    isCreateConfirming,
    isCreateSuccess,
    isCreateFailed,
    createError,
    createReceiptError,

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
    getTokenBalance,
    getOkbBalance,
  };
}
