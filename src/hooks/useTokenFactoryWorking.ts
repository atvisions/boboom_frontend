import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { formatEther, parseEther, formatUnits, parseUnits } from 'viem';
import { useContractAddresses } from './useContractConfigSimple';
import { NETWORK_CONFIG } from '../contracts/config-simple';
import OKBTokenArtifact from '../contracts/abis/OKBToken.json';
import TokenFactoryV1Artifact from '../contracts/abis/TokenFactoryV1.json';
import BondingCurveV1Artifact from '../contracts/abis/BondingCurveV1.json';
const OKBTokenABI = (OKBTokenArtifact as any).abi;
const TokenFactoryV1ABI = (TokenFactoryV1Artifact as any).abi;
const BondingCurveV1ABI = (BondingCurveV1Artifact as any).abi;

export function useTokenFactoryWorking() {
  const { addresses, isLoading: isConfigLoading, error: configError } = useContractAddresses();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainIdNum = Number(NETWORK_CONFIG.NETWORK_ID || '11155111');
  
  const [balanceData, setBalanceData] = useState({
    okbBalance: 0,
    okbAllowance: 0,
    okbAllowanceBondingCurve: 0,
  });

  const [okbDecimals, setOkbDecimals] = useState<number>(18); // 默认18位，动态获取

  const [transactionStates, setTransactionStates] = useState({
    approval: {
      hash: undefined as string | undefined,
      isPending: false,
      isConfirming: false,
      isSuccess: false,
      isFailed: false,
      error: null as any,
    },
    create: {
      hash: undefined as string | undefined,
      isPending: false,
      isConfirming: false,
      isSuccess: false,
      isFailed: false,
      error: null as any,
    },
    trade: {
      hash: undefined as string | undefined,
      isPending: false,
      isConfirming: false,
      isSuccess: false,
      isFailed: false,
      error: null as any,
      type: null as 'buy' | 'sell' | null,
    },
  });

  // 获取余额数据
  useEffect(() => {
    const fetchBalances = async () => {
      if (!publicClient || !address || !addresses?.OKB_TOKEN) {

        return;
      }

      try {

        // 首先获取 OKB 代币的小数位数
        const decimals = await (publicClient as any).readContract({
          address: addresses.OKB_TOKEN,
          abi: OKBTokenABI,
          functionName: 'decimals',
          args: [],
        });

        setOkbDecimals(Number(decimals));

        // 获取 OKB 余额
        const balance = await (publicClient as any).readContract({
          address: addresses.OKB_TOKEN,
          abi: OKBTokenABI,
          functionName: 'balanceOf',
          args: [address],
        });

        // 获取授权额度（给Factory）
        let allowance = 0n;
        if (addresses.TOKEN_FACTORY_V3) {
          try {
            allowance = await (publicClient as any).readContract({
              address: addresses.OKB_TOKEN,
              abi: OKBTokenABI,
              functionName: 'allowance',
              args: [address, addresses.TOKEN_FACTORY_V3],
            }) as bigint;
          } catch (err) {

          }
        }
        
        // 获取授权额度（给BondingCurve）
        let allowanceBondingCurve = 0n;
        if (addresses.BONDING_CURVE_V3) {
          try {
            allowanceBondingCurve = await (publicClient as any).readContract({
              address: addresses.OKB_TOKEN,
              abi: OKBTokenABI,
              functionName: 'allowance',
              args: [address, addresses.BONDING_CURVE_V3],
            }) as bigint;
          } catch (err) {

          }
        }
        
        const balanceFormatted = Number(formatUnits(balance as bigint, decimals));
        const allowanceFormatted = Number(formatUnits(allowance, decimals));
        const allowanceBondingCurveFormatted = Number(formatUnits(allowanceBondingCurve, decimals));

        setBalanceData({
          okbBalance: balanceFormatted,
          okbAllowance: allowanceFormatted,
          okbAllowanceBondingCurve: allowanceBondingCurveFormatted,
        });
      } catch (error) {

        // 保持默认值，但不重置为0，保留之前的值
      }
    };

    if (addresses && address && publicClient) {

      fetchBalances();
    } else {

    }
  }, [addresses?.OKB_TOKEN, addresses?.TOKEN_FACTORY_V3, addresses?.BONDING_CURVE_V3, address, publicClient]);

  // 授权 OKB 给 TokenFactory（用于创建代币）
  const approveOKB = useCallback(async (amount: number = 1000000) => {
    if (!addresses?.OKB_TOKEN || !addresses?.TOKEN_FACTORY_V3 || !address) {
      throw new Error('Contract addresses or wallet not ready');
    }

    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    setTransactionStates(prev => ({
      ...prev,
      approval: { ...prev.approval, isPending: true, error: null }
    }));

    try {

      // 检查 MetaMask
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      const ethereum = window.ethereum as any;

      // 检查当前网络
      const chainId = await ethereum.request({ method: 'eth_chainId' });

      // 检查当前账户
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      // 检查是否连接到正确的网络 (Sepolia = 0xaa36a7)
      if (chainId !== '0xaa36a7') {

      }

      // 构建交易数据
      const { encodeFunctionData } = await import('viem');

      const data = encodeFunctionData({
        abi: OKBTokenABI,
        functionName: 'approve',
        args: [addresses.TOKEN_FACTORY_V3, parseUnits(amount.toString(), okbDecimals)],
      });

      const approveData = {
        to: addresses.OKB_TOKEN,
        from: address,
        data: data,
      };

      const hash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [approveData],
      });

      setTransactionStates(prev => ({
        ...prev,
        approval: { 
          ...prev.approval, 
          hash, 
          isPending: false, 
          isConfirming: true 
        }
      }));

      // 等待交易确认
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      
      setTransactionStates(prev => ({
        ...prev,
        approval: { 
          ...prev.approval, 
          isConfirming: false, 
          isSuccess: true 
        }
      }));

      // 刷新余额
      setTimeout(() => {
        if (addresses && address && publicClient) {
          // 重新获取余额的逻辑
        }
      }, 1000);

      return hash;
    } catch (error) {
      setTransactionStates(prev => ({
        ...prev,
        approval: { 
          ...prev.approval, 
          isPending: false, 
          isConfirming: false, 
          isFailed: true, 
          error 
        }
      }));
      throw error;
    }
  }, [addresses?.OKB_TOKEN, addresses?.TOKEN_FACTORY_V3, address, publicClient]);

  // 授权 OKB 给 BondingCurve（用于买卖交易）
  const approveOKBForTrading = useCallback(async (amount: number = 1000000) => {
    if (!addresses?.OKB_TOKEN || !addresses?.BONDING_CURVE_V3 || !address) {
      throw new Error('Contract addresses or wallet not ready');
    }

    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    setTransactionStates(prev => ({
      ...prev,
      approval: { ...prev.approval, isPending: true, error: null }
    }));

    try {

      const ethereum = window.ethereum as any;

      // 构建交易数据
      const { encodeFunctionData } = await import('viem');

      const data = encodeFunctionData({
        abi: OKBTokenABI,
        functionName: 'approve',
        args: [addresses.BONDING_CURVE_V3, parseUnits(amount.toString(), okbDecimals)],
      });

      const txData = {
        to: addresses.OKB_TOKEN,
        from: address,
        data: data,
      };

      const hash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [txData],
      });

      setTransactionStates(prev => ({
        ...prev,
        approval: {
          ...prev.approval,
          isPending: false,
          isConfirming: true
        }
      }));

      // 等待交易确认
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });

      setTransactionStates(prev => ({
        ...prev,
        approval: {
          ...prev.approval,
          isConfirming: false,
          isSuccess: true
        }
      }));

      // 刷新余额
      setTimeout(() => {
        if (addresses && address && publicClient) {
          // 重新获取余额的逻辑
        }
      }, 1000);

      return hash;
    } catch (error) {
      setTransactionStates(prev => ({
        ...prev,
        approval: {
          ...prev.approval,
          isPending: false,
          isConfirming: false,
          isFailed: true,
          error
        }
      }));
      throw error;
    }
  }, [addresses?.OKB_TOKEN, addresses?.BONDING_CURVE_V3, address, publicClient]);

  // 创建代币方法
  const createToken = useCallback(async (tokenData: any) => {
    if (!addresses?.TOKEN_FACTORY_V3 || !address) {
      throw new Error('Contract addresses or wallet not ready');
    }

    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    setTransactionStates(prev => ({
      ...prev,
      create: { ...prev.create, isPending: true, error: null }
    }));

    try {
      const ethereum = window.ethereum as any;
      
      // 构建交易数据
      const { encodeFunctionData } = await import('viem');

      const createData = {
        to: addresses.TOKEN_FACTORY_V3,
        from: address,
        data: encodeFunctionData({
          abi: TokenFactoryV1ABI,
          functionName: 'createToken',
          args: [
            tokenData.name,
            tokenData.symbol,
            tokenData.description,
            tokenData.imageUrl,
            tokenData.website || '',
            tokenData.twitter || '',
            tokenData.telegram || '',
          ],
        }),
      };

      const hash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [createData],
      });

      setTransactionStates(prev => ({
        ...prev,
        create: { 
          ...prev.create, 
          hash, 
          isPending: false, 
          isConfirming: true 
        }
      }));

      // 等待交易确认
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      
      setTransactionStates(prev => ({
        ...prev,
        create: { 
          ...prev.create, 
          isConfirming: false, 
          isSuccess: true 
        }
      }));

      return hash;
    } catch (error) {
      setTransactionStates(prev => ({
        ...prev,
        create: { 
          ...prev.create, 
          isPending: false, 
          isConfirming: false, 
          isFailed: true, 
          error 
        }
      }));
      throw error;
    }
  }, [addresses?.TOKEN_FACTORY_V3, address, publicClient]);

  // 如果配置还在加载中，返回加载状态
  if (isConfigLoading || !addresses) {
    return {
      isConfigLoading: true,
      configError,
      // 状态
      isApprovalPending: false,
      isApprovalConfirming: false,
      isApprovalSuccess: false,
      isApprovalFailed: false,
      isCreatePending: false,
      isCreateConfirming: false,
      isCreateSuccess: false,
      isCreateFailed: false,
      okbBalance: 0,
      okbAllowance: 0,
      okbAllowanceBondingCurve: 0,
      // 方法
      approveOKB: () => Promise.reject('Configuration not loaded'),
      approveOKBForTrading: () => Promise.reject('Configuration not loaded'),
      createToken: () => Promise.reject('Configuration not loaded'),
      createTokenWithPurchase: () => Promise.reject('Configuration not loaded'),
      buyToken: () => {},
      sellToken: () => {},
      checkOkbAllowance: () => 0,
      getBuyQuote: () => Promise.resolve(null),
      getSellQuote: () => Promise.resolve(null),
      getCurrentPrice: () => Promise.resolve(0),
      getTokenBalance: () => Promise.resolve(0),
      getOkbBalance: () => 0,
      refetchOkbBalance: () => {},
      refetchOkbAllowance: () => {},
      refetchOkbAllowanceBondingCurve: () => {},
      approvalError: null,
      createError: null,
      approvalReceiptError: null,
      createReceiptError: null,
      approvalHash: undefined,
      createHash: undefined,
      actualCreateHash: undefined,
    };
  }

  return {
    isConfigLoading: false,
    configError: null,
    // 授权状态
    approvalHash: transactionStates.approval.hash,
    isApprovalPending: transactionStates.approval.isPending,
    isApprovalConfirming: transactionStates.approval.isConfirming,
    isApprovalSuccess: transactionStates.approval.isSuccess,
    isApprovalFailed: transactionStates.approval.isFailed,
    approvalError: transactionStates.approval.error,
    approvalReceiptError: null,
    // 创建状态
    createHash: transactionStates.create.hash,
    actualCreateHash: transactionStates.create.hash,
    isCreatePending: transactionStates.create.isPending,
    isCreateConfirming: transactionStates.create.isConfirming,
    isCreateSuccess: transactionStates.create.isSuccess,
    isCreateFailed: transactionStates.create.isFailed,
    createError: transactionStates.create.error,
    createReceiptError: null,
    // 交易状态
    tradeHash: transactionStates.trade.hash,
    isTradePending: transactionStates.trade.isPending,
    isTradeConfirming: transactionStates.trade.isConfirming,
    isTradeSuccess: transactionStates.trade.isSuccess,
    isTradeFailed: transactionStates.trade.isFailed,
    tradeError: transactionStates.trade.error,
    tradeType: transactionStates.trade.type,
    // 重置函数
    resetTradeState: () => {
      setTransactionStates(prev => ({
        ...prev,
        trade: {
          hash: undefined,
          isPending: false,
          isConfirming: false,
          isSuccess: false,
          isFailed: false,
          error: null,
          type: null,
        }
      }));
    },
    // 数据
    okbBalance: balanceData.okbBalance,
    okbAllowance: balanceData.okbAllowance,
    okbAllowanceBondingCurve: balanceData.okbAllowanceBondingCurve,
    refetchOkbBalance: () => {
      // 重新获取余额数据的逻辑可以在这里实现
    },
    refetchOkbAllowance: () => {},
    refetchOkbAllowanceBondingCurve: () => {},
    // 方法
    createToken,
    createTokenWithPurchase: async (tokenData: any) => {
      const okbAmount = tokenData.initialPurchase;
      if (!addresses?.TOKEN_FACTORY_V3 || !address) {
        throw new Error('Contract addresses or wallet not ready');
      }

      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      setTransactionStates(prev => ({
        ...prev,
        create: { ...prev.create, isPending: true, error: null }
      }));

      try {
        const ethereum = window.ethereum as any;

        // 构建带购买的创建交易数据
        const { encodeFunctionData } = await import('viem');

        const data = encodeFunctionData({
          abi: TokenFactoryV1ABI,
          functionName: 'createTokenWithPurchase',
          args: [
            tokenData.name,
            tokenData.symbol,
            tokenData.description,
            tokenData.imageUrl,
            tokenData.website || '',
            tokenData.twitter || '',
            tokenData.telegram || '',
            parseUnits(okbAmount.toString(), okbDecimals), // 初始购买金额
          ],
        });

        const createData = {
          to: addresses.TOKEN_FACTORY_V3,
          from: address,
          data: data,
        };

        const hash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [createData],
        });

        setTransactionStates(prev => ({
          ...prev,
          create: {
            ...prev.create,
            hash,
            isPending: false,
            isConfirming: true
          }
        }));

        // 等待交易确认
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        setTransactionStates(prev => ({
          ...prev,
          create: {
            ...prev.create,
            isConfirming: false,
            isSuccess: true
          }
        }));

        return hash;
      } catch (error) {

        setTransactionStates(prev => ({
          ...prev,
          create: {
            ...prev.create,
            isPending: false,
            isConfirming: false,
            isFailed: true,
            error: error as Error
          }
        }));
        throw error;
      }
    },
    approveOKB,
    approveOKBForTrading,
    checkOkbAllowance: () => balanceData.okbAllowance,
    buyToken: async (tokenAddress: string, okbAmount: number) => {
      if (!addresses?.BONDING_CURVE_V3 || !address) {
        throw new Error('Contract addresses or wallet not ready');
      }

      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      try {
        // 设置交易开始状态
        setTransactionStates(prev => ({
          ...prev,
          trade: {
            ...prev.trade,
            isPending: true,
            isConfirming: false,
            isSuccess: false,
            isFailed: false,
            type: 'buy',
            error: null
          }
        }));

        const ethereum = window.ethereum as any;

        // 构建购买交易数据
        const { encodeFunctionData } = await import('viem');

        const data = encodeFunctionData({
          abi: BondingCurveV1ABI,
          functionName: 'buyTokens',
          args: [tokenAddress, parseUnits(okbAmount.toString(), okbDecimals), parseEther('0')], // token, okbIn, minTokensOut
        });

        const buyData = {
          to: addresses.BONDING_CURVE_V3,
          from: address,
          data: data,
        };

        const hash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [buyData],
        });

        // 设置交易确认中状态
        setTransactionStates(prev => ({
          ...prev,
          trade: {
            ...prev.trade,
            hash,
            isPending: false,
            isConfirming: true
          }
        }));

        // 等待交易确认
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        // 检查交易状态
        if (receipt?.status === 'reverted') {
          throw new Error('Transaction failed: execution reverted');
        }

        // 设置交易成功状态
        setTransactionStates(prev => ({
          ...prev,
          trade: {
            ...prev.trade,
            isConfirming: false,
            isSuccess: true
          }
        }));

        return hash;
      } catch (error) {

        // 设置交易失败状态
        setTransactionStates(prev => ({
          ...prev,
          trade: {
            ...prev.trade,
            isPending: false,
            isConfirming: false,
            isFailed: true,
            error
          }
        }));

        throw error;
      }
    },
    sellToken: async (tokenAddress: string, tokenAmount: number) => {
      if (!addresses?.BONDING_CURVE_V3 || !address) {

        throw new Error('Missing contract addresses or user address');
      }

      try {
        // 设置交易开始状态
        setTransactionStates(prev => ({
          ...prev,
          trade: {
            ...prev.trade,
            isPending: true,
            isConfirming: false,
            isSuccess: false,
            isFailed: false,
            type: 'sell',
            error: null
          }
        }));

        const ethereum = window.ethereum as any;

        // 构建卖出交易数据
        const { encodeFunctionData } = await import('viem');

        const data = encodeFunctionData({
          abi: BondingCurveV1ABI,
          functionName: 'sellTokens',
          args: [tokenAddress, parseEther(tokenAmount.toString()), parseUnits('0', okbDecimals)], // token, tokensIn, minOkbOut
        });

        const sellData = {
          to: addresses.BONDING_CURVE_V3,
          from: address,
          data: data,
        };

        const hash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [sellData],
        });

        // 设置交易确认中状态
        setTransactionStates(prev => ({
          ...prev,
          trade: {
            ...prev.trade,
            hash,
            isPending: false,
            isConfirming: true
          }
        }));

        // 等待交易确认
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        // 检查交易状态
        if (receipt?.status === 'reverted') {
          throw new Error('Transaction failed: execution reverted');
        }

        // 设置交易成功状态
        setTransactionStates(prev => ({
          ...prev,
          trade: {
            ...prev.trade,
            isConfirming: false,
            isSuccess: true
          }
        }));

        return hash;
      } catch (error) {

        // 设置交易失败状态
        setTransactionStates(prev => ({
          ...prev,
          trade: {
            ...prev.trade,
            isPending: false,
            isConfirming: false,
            isFailed: true,
            error
          }
        }));

        throw error;
      }
    },
    getBuyQuote: async (tokenAddress: string, okbAmount: number) => {
      if (!publicClient || !addresses?.BONDING_CURVE_V3) {

        return null;
      }

      try {

        const quote = await (publicClient as any).readContract({
          address: addresses.BONDING_CURVE_V3,
          abi: BondingCurveV1ABI,
          functionName: 'getQuoteBuy',
          args: [tokenAddress, parseUnits(okbAmount.toString(), okbDecimals)],
        });

        if (quote && Array.isArray(quote) && quote.length >= 3) {
          const tokensOut = Number(formatEther(quote[0] as bigint));
          const priceAfter = Number(formatUnits(quote[1] as bigint, okbDecimals));
          const fee = Number(formatUnits(quote[2] as bigint, okbDecimals));

          const result = {
            tokenAmount: tokensOut,
            tokensOut: tokensOut, // TradingPanel 期望的属性名
            fee,
            priceAfter,
            totalCost: okbAmount,
            priceImpact: 0, // 可以根据需要计算价格影响
          };

          return result;
        }

        return null;
      } catch (error) {

        return null;
      }
    },

    getSellQuote: async (tokenAddress: string, tokenAmount: number) => {
      if (!publicClient || !addresses?.BONDING_CURVE_V3) {

        return null;
      }

      try {

        const quote = await (publicClient as any).readContract({
          address: addresses.BONDING_CURVE_V3,
          abi: BondingCurveV1ABI,
          functionName: 'getQuoteSell',
          args: [tokenAddress, parseEther(tokenAmount.toString())],
        });

        if (quote && Array.isArray(quote) && quote.length >= 3) {
          const okbOut = Number(formatUnits(quote[0] as bigint, okbDecimals));
          const priceAfter = Number(formatUnits(quote[1] as bigint, okbDecimals));
          const fee = Number(formatUnits(quote[2] as bigint, okbDecimals));

          const result = {
            okbAmount: okbOut,
            okbOut: okbOut, // TradingPanel 期望的属性名
            fee,
            priceAfter,
            totalReceived: okbOut - fee,
            priceImpact: 0, // 可以根据需要计算价格影响
          };

          return result;
        }

        return null;
      } catch (error) {

        return null;
      }
    },

    getCurrentPrice: async (tokenAddress: string) => {
      if (!publicClient || !addresses?.BONDING_CURVE_V3 || !tokenAddress) {
        return 0;
      }

      try {
        // 获取当前价格 - 可以通过获取小额买入报价来估算
        // 注意：虽然变量名是BONDING_CURVE_V3，但实际指向的是V1合约地址
        const quote = await (publicClient as any).readContract({
          address: addresses.BONDING_CURVE_V3,
          abi: BondingCurveV1ABI,
          functionName: 'getQuoteBuy',
          args: [tokenAddress, parseUnits('1', okbDecimals)], // 1 OKB 的报价
        });

        if (quote && Array.isArray(quote) && quote.length >= 1) {
          const tokenAmount = Number(formatEther(quote[0] as bigint));
          return tokenAmount > 0 ? 1 / tokenAmount : 0; // OKB per token
        }

        return 0;
      } catch (error) {

        return 0;
      }
    },

    getTokenBalance: async (tokenAddress: string) => {
      if (!publicClient || !address || !tokenAddress) {

        return 0;
      }

      try {

        const balance = await (publicClient as any).readContract({
          address: tokenAddress,
          abi: [
            {
              "inputs": [{"name": "account", "type": "address"}],
              "name": "balanceOf",
              "outputs": [{"name": "", "type": "uint256"}],
              "stateMutability": "view",
              "type": "function"
            }
          ],
          functionName: 'balanceOf',
          args: [address],
        });

        const formattedBalance = Number(formatEther(balance as bigint));

        return formattedBalance;
      } catch (error) {

        return 0;
      }
    },
    getOkbBalance: () => balanceData.okbBalance,
  };
}
