"use client";
import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { sepolia } from 'wagmi/chains';
import { TokenDetail } from '@/types/tokenDetail';
import { notifySuccess, notifyError, notifyInfo } from '@/lib/notify';

import { CONTRACT_ADDRESSES, OKB_TOKEN_ABI } from '@/config/contracts';

import { BONDING_CURVE_ABI } from '@/config/contracts';

interface TradingPanelProps {
  token: TokenDetail;
  onTransactionComplete?: () => void;
}

export function TradingPanel({ token, onTransactionComplete }: TradingPanelProps) {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);

  // 读取 OKB 余额
  const { data: okbBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.okbToken,
    abi: OKB_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });

  // 读取代币余额
  const { data: tokenBalance } = useReadContract({
    address: token.address as `0x${string}`,
    abi: OKB_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });

  // 检查 OKB 授权额度
  const { data: okbAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.okbToken,
    abi: OKB_TOKEN_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACT_ADDRESSES.bondingCurve],
    query: { enabled: !!address },
  });

  // 检查代币授权额度
  const { data: tokenAllowance } = useReadContract({
    address: token.address as `0x${string}`,
    abi: OKB_TOKEN_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACT_ADDRESSES.bondingCurve],
    query: { enabled: !!address },
  });

  // 获取买入报价
  const { data: buyQuote, error: buyQuoteError } = useReadContract({
    address: CONTRACT_ADDRESSES.bondingCurve,
    abi: BONDING_CURVE_ABI,
    functionName: 'getQuoteBuy',
    args: [token.address as `0x${string}`, parseEther(amount || '0')],
    query: { enabled: !!address && !!amount && activeTab === 'buy' && parseFloat(amount) > 0 },
  });

  // 获取卖出报价
  const { data: sellQuote, error: sellQuoteError } = useReadContract({
    address: CONTRACT_ADDRESSES.bondingCurve,
    abi: BONDING_CURVE_ABI,
    functionName: 'getQuoteSell',
    args: [token.address as `0x${string}`, parseEther(amount || '0')],
    query: { enabled: !!address && !!amount && activeTab === 'sell' && parseFloat(amount) > 0 },
  });

  // 合约写入功能
  const { writeContract: writeTrade, data: tradeHash, error: tradeError } = useWriteContract();
  const { writeContract: writeApprove, data: approveHash, error: approveError } = useWriteContract();

  // 交易等待hooks
  const { isLoading: isTradeLoading, isSuccess: isTradeSuccess } = useWaitForTransactionReceipt({
    hash: tradeHash,
  });
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const okbBalanceFormatted = okbBalance ? formatEther(okbBalance) : '0.00';
  const tokenBalanceFormatted = tokenBalance ? formatEther(tokenBalance) : '0.00';

  // 计算预期输出 - 使用合约的报价函数
  const calculateExpectedOutput = (): { output: string; priceImpact: number } => {
    if (!amount || isNaN(parseFloat(amount))) {
      return { output: '0', priceImpact: 0 };
    }

    const inputAmount = parseFloat(amount);
    
    if (activeTab === 'buy') {
      // 买入：OKB -> Token
      if (buyQuote) {
        const [tokensOut, priceAfter, fee] = buyQuote;
        const expectedTokens = parseFloat(formatEther(tokensOut));
        const feeAmount = parseFloat(formatEther(fee));
        const priceImpact = (feeAmount / inputAmount) * 100;
        
        return { 
          output: expectedTokens.toFixed(2),
          priceImpact: Math.round(priceImpact * 100) / 100
        };
      }
      
      // 如果无法获取报价，使用简单的线性计算作为后备
      const currentPrice = parseFloat(token.current_price);
      if (currentPrice > 0) {
        const expectedTokens = inputAmount / currentPrice;
        return { 
          output: expectedTokens.toFixed(2),
          priceImpact: 0.5
        };
      }
      
      // 如果连后备价格都没有，显示估算值
      if (inputAmount > 0) {
        // 使用一个非常小的价格作为估算
        const estimatedPrice = 0.000001; // 1 OKB = 1,000,000 tokens
        const estimatedTokens = inputAmount / estimatedPrice;
        return { 
          output: estimatedTokens.toFixed(0),
          priceImpact: 0
        };
      }
    } else {
      // 卖出：Token -> OKB
      if (sellQuote) {
        const [okbOut, priceAfter, fee] = sellQuote;
        const expectedOkb = parseFloat(formatEther(okbOut));
        const feeAmount = parseFloat(formatEther(fee));
        const priceImpact = (feeAmount / expectedOkb) * 100;
        
        return { 
          output: expectedOkb.toFixed(4),
          priceImpact: Math.round(priceImpact * 100) / 100
        };
      }
      
      // 如果无法获取报价，使用简单的线性计算作为后备
      const currentPrice = parseFloat(token.current_price);
      if (currentPrice > 0) {
        const expectedOkb = inputAmount * currentPrice;
        return { 
          output: expectedOkb.toFixed(4),
          priceImpact: 0.5
        };
      }
      
      // 如果连后备价格都没有，显示估算值
      if (inputAmount > 0) {
        // 使用一个非常小的价格作为估算
        const estimatedPrice = 0.000001; // 1 token = 0.000001 OKB
        const estimatedOkb = inputAmount * estimatedPrice;
        return { 
          output: estimatedOkb.toFixed(4),
          priceImpact: 0
        };
      }
    }

    return { output: '0', priceImpact: 0 };
  };

  const { output, priceImpact } = calculateExpectedOutput();

  // 监听交易成功
  React.useEffect(() => {
    if (isTradeSuccess) {
      notifySuccess(
        'Transaction Successful', 
        `${activeTab === 'buy' ? 'Bought' : 'Sold'} ${output} ${activeTab === 'buy' ? token.symbol : 'OKB'}`
      );
      setAmount('');
      setIsTrading(false);
      onTransactionComplete?.();
    }
  }, [isTradeSuccess, activeTab, output, token.symbol, onTransactionComplete]);

  // 监听授权成功，自动执行交易
  React.useEffect(() => {
    if (isApproveSuccess && isTrading) {
      const amountInWei = parseEther(amount);
      
      if (activeTab === 'buy') {
        // 买入代币
        writeTrade({
          address: CONTRACT_ADDRESSES.bondingCurve,
          abi: BONDING_CURVE_ABI,
          functionName: 'buyTokens',
          args: [token.address as `0x${string}`, amountInWei, 0n], // minTokensOut = 0
          chain: sepolia,
          account: address,
        });
      } else {
        // 卖出代币
        writeTrade({
          address: CONTRACT_ADDRESSES.bondingCurve,
          abi: BONDING_CURVE_ABI,
          functionName: 'sellTokens',
          args: [token.address as `0x${string}`, amountInWei, 0n], // minOkbOut = 0
          chain: sepolia,
          account: address,
        });
      }
    }
  }, [isApproveSuccess, isTrading, activeTab, amount, token.address, writeTrade, address]);

  // 监听交易错误
  React.useEffect(() => {
    if (tradeError) {
      console.error('Trade error:', tradeError);
      notifyError('Transaction Failed', tradeError.message || 'Failed to execute trade');
      setIsTrading(false);
    }
  }, [tradeError]);

  // 监听授权错误
  React.useEffect(() => {
    if (approveError) {
      console.error('Approve error:', approveError);
      notifyError('Approval Failed', approveError.message || 'Failed to approve spending');
      setIsTrading(false);
    }
  }, [approveError]);

  // 处理交易
  const handleTrade = async () => {
    if (!isConnected || !address) {
      notifyInfo('Connect Wallet', 'Please connect your wallet to trade');
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      notifyError('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setIsTrading(true);
    try {
      const amountInWei = parseEther(amount);
      
      if (activeTab === 'buy') {
        // 检查 OKB 授权
        if (!okbAllowance || okbAllowance < amountInWei) {
          notifyInfo('Approving OKB', 'Please approve OKB spending...');
          writeApprove({
            address: CONTRACT_ADDRESSES.okbToken,
            abi: OKB_TOKEN_ABI,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.bondingCurve, amountInWei],
            chain: sepolia,
            account: address,
          });
          return;
        }
        
        // 买入代币
        writeTrade({
          address: CONTRACT_ADDRESSES.bondingCurve,
          abi: BONDING_CURVE_ABI,
          functionName: 'buyTokens',
          args: [token.address as `0x${string}`, amountInWei, 0n], // minTokensOut = 0
          chain: sepolia,
          account: address,
        });
      } else {
        // 检查代币授权
        if (!tokenAllowance || tokenAllowance < amountInWei) {
          notifyInfo('Approving Token', 'Please approve token spending...');
          writeApprove({
            address: token.address as `0x${string}`,
            abi: OKB_TOKEN_ABI,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.bondingCurve, amountInWei],
            chain: sepolia,
            account: address,
          });
          return;
        }
        
        // 卖出代币
        writeTrade({
          address: CONTRACT_ADDRESSES.bondingCurve,
          abi: BONDING_CURVE_ABI,
          functionName: 'sellTokens',
          args: [token.address as `0x${string}`, amountInWei, 0n], // minOkbOut = 0
          chain: sepolia,
          account: address,
        });
      }
    } catch (error: any) {
      console.error('Trade error:', error);
      notifyError('Transaction Failed', error.message || 'Failed to execute trade');
      setIsTrading(false);
    }
  };

  const handleMaxAmount = () => {
    if (activeTab === 'buy') {
      setAmount(okbBalanceFormatted);
    } else {
      setAmount(tokenBalanceFormatted);
    }
  };

  const getButtonState = () => {
    if (!isConnected || !address) {
      return 'disabled';
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return 'disabled';
    }
    
    // 检查错误
    if ((activeTab === 'buy' && buyQuoteError) || (activeTab === 'sell' && sellQuoteError)) {
      return 'error';
    }
    
    // 检查余额
    if (activeTab === 'buy') {
      const inputAmount = parseFloat(amount);
      const balance = parseFloat(okbBalanceFormatted);
      if (balance < inputAmount) {
        return 'error';
      }
    } else {
      const inputAmount = parseFloat(amount);
      const balance = parseFloat(tokenBalanceFormatted);
      if (balance < inputAmount) {
        return 'error';
      }
    }
    
    // 正常状态
    if (isTrading || isTradeLoading || isApproveLoading) {
      return 'loading';
    }
    
    return 'enabled';
  };

  const getButtonText = () => {
    if (!isConnected) {
      return 'Connect Wallet';
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return `Enter ${activeTab === 'buy' ? 'OKB' : 'Token'} Amount`;
    }
    
    // 检查错误
    if (activeTab === 'buy' && buyQuoteError) {
      const errorMessage = buyQuoteError.message || '';
      if (errorMessage.includes('INSUFFICIENT_LIQUIDITY')) {
        return 'Insufficient Liquidity';
      }
      return 'Quote Error';
    }
    
    if (activeTab === 'sell' && sellQuoteError) {
      const errorMessage = sellQuoteError.message || '';
      if (errorMessage.includes('INSUFFICIENT_LIQUIDITY')) {
        return 'Insufficient Liquidity';
      }
      return 'Quote Error';
    }
    
    // 检查余额
    if (activeTab === 'buy') {
      const inputAmount = parseFloat(amount);
      const balance = parseFloat(okbBalanceFormatted);
      if (balance < inputAmount) {
        return 'Insufficient OKB Balance';
      }
    } else {
      const inputAmount = parseFloat(amount);
      const balance = parseFloat(tokenBalanceFormatted);
      if (balance < inputAmount) {
        return 'Insufficient Token Balance';
      }
    }
    
    // 正常状态
    if (isTradeLoading || isApproveLoading) {
      return 'Processing...';
    }
    
    return `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`;
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Connect your wallet to start trading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
      {/* 标签切换 */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'buy'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sell'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Sell
        </button>
      </div>

      {/* 余额显示 */}
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <span>Balance: {activeTab === 'buy' ? okbBalanceFormatted : tokenBalanceFormatted} {activeTab === 'buy' ? 'OKB' : token.symbol}</span>
        <button
          onClick={handleMaxAmount}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Max
        </button>
      </div>

      {/* 输入框 */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {activeTab === 'buy' ? 'OKB' : token.symbol}
          </div>
        </div>
      </div>

      {/* 交易详情 */}
      <div className="bg-white/5 rounded-lg p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">You will receive:</span>
          <span className="text-white">
            {output === 'Insufficient Liquidity' || output === 'Quote Error' || output === 'Getting Quote...' 
              ? output 
              : `${output} ${activeTab === 'buy' ? token.symbol : 'OKB'}`
            }
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Price Impact:</span>
          <span className="text-white">{priceImpact}%</span>
        </div>
      </div>

      {/* 交易按钮 */}
      <button
        onClick={handleTrade}
        disabled={getButtonState() === 'disabled' || getButtonState() === 'error' || getButtonState() === 'loading'}
        className={`w-full font-medium py-3 px-4 rounded-lg transition-all duration-200 ${
          getButtonState() === 'error' 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : getButtonState() === 'loading'
            ? 'bg-gray-500 text-white cursor-not-allowed'
            : getButtonState() === 'disabled'
            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
        }`}
      >
        {getButtonState() === 'loading' ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </div>
        ) : (
          getButtonText()
        )}
      </button>
    </div>
  );
}
