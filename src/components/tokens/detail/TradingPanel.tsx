"use client";
import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, parseUnits, formatEther } from 'viem';
import { TokenDetail } from '@/types/tokenDetail';
import { TokenDetailService } from '@/services/tokenDetailService';
import { notifySuccess, notifyError, notifyInfo } from '@/lib/notify';

interface TradingPanelProps {
  token: TokenDetail;
  onTransactionComplete?: () => void;
}

// 合约配置 - 这些应该从环境变量或配置文件中获取
const CONTRACT_ADDRESSES = {
  bondingCurve: "0x2750db4d488841Ef49F21D47093Ce7F7B93Ef236", // 示例地址
  okbToken: "0xDF021922E0Be7f7dCeF2Cb4809e7D2c28C4133fe",
} as const;

// Bonding Curve ABI (简化版本)
const BONDING_CURVE_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "okbAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "minTokensOut", "type": "uint256"}
    ],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "tokenAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "minOkbOut", "type": "uint256"}
    ],
    "name": "sellTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// OKB Token ABI
const OKB_TOKEN_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export function TradingPanel({ token, onTransactionComplete }: TradingPanelProps) {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [slippage, setSlippage] = useState(1); // 1% slippage

  // Read OKB balance
  const { data: okbBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.okbToken,
    abi: OKB_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read Token balance
  const { data: tokenBalance } = useReadContract({
    address: token.address as `0x${string}`,
    abi: OKB_TOKEN_ABI, // 使用相同的ABI，因为都是ERC20
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const okbBalanceFormatted = okbBalance ? parseFloat(formatEther(okbBalance)).toFixed(2) : '0.00';
  const tokenBalanceFormatted = tokenBalance ? parseFloat(formatEther(tokenBalance)).toFixed(2) : '0.00';

  // 合约写入hooks
  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeTrade, data: tradeHash } = useWriteContract();

  // 交易等待hooks
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const { isLoading: isTradeLoading, isSuccess: isTradeSuccess } = useWaitForTransactionReceipt({
    hash: tradeHash,
  });

  // 计算预期输出
  const calculateExpectedOutput = (): { output: string; priceImpact: number } => {
    if (!amount || isNaN(parseFloat(amount))) {
      return { output: '0', priceImpact: 0 };
    }

    const inputAmount = parseFloat(amount);
    const currentPrice = parseFloat(token.current_price);
    
    if (activeTab === 'buy') {
      // 买入：OKB -> Token
      const expectedTokens = inputAmount / currentPrice;
      return { 
        output: expectedTokens.toFixed(2),
        priceImpact: 0.5 // 简化计算，实际应该根据曲线计算
      };
    } else {
      // 卖出：Token -> OKB
      const expectedOkb = inputAmount * currentPrice;
      return { 
        output: expectedOkb.toFixed(4),
        priceImpact: 0.5
      };
    }
  };

  const { output, priceImpact } = calculateExpectedOutput();

  // 处理交易
  const handleTrade = async () => {
    if (!isConnected || !address) {
      notifyError('钱包未连接', '请先连接钱包');
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      notifyError('输入错误', '请输入有效的交易数量');
      return;
    }

    setIsTrading(true);

    try {
      const inputAmount = parseFloat(amount);
      
      if (activeTab === 'buy') {
        // 买入流程
        const okbAmount = parseUnits(inputAmount.toString(), 18);
        const minTokensOut = parseUnits((parseFloat(output) * (1 - slippage / 100)).toString(), 18);

        notifyInfo('交易确认', '正在授权 OKB 代币...');
        
        // 1. 授权 OKB
        writeApprove({
          address: CONTRACT_ADDRESSES.okbToken,
          abi: OKB_TOKEN_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.bondingCurve, okbAmount],
        });

      } else {
        // 卖出流程 - 直接调用卖出函数
        const tokenAmount = parseUnits(inputAmount.toString(), 18);
        const minOkbOut = parseUnits((parseFloat(output) * (1 - slippage / 100)).toString(), 18);

        notifyInfo('交易确认', '正在卖出代币...');

        writeTrade({
          address: CONTRACT_ADDRESSES.bondingCurve,
          abi: BONDING_CURVE_ABI,
          functionName: 'sellTokens',
          args: [token.address as `0x${string}`, tokenAmount, minOkbOut],
        });
      }

    } catch (error) {
      console.error('Trade error:', error);
      notifyError('交易失败', error instanceof Error ? error.message : '未知错误');
      setIsTrading(false);
    }
  };

  // 监听授权完成，执行买入
  useEffect(() => {
    if (isApproveSuccess && activeTab === 'buy') {
      const inputAmount = parseFloat(amount);
      const okbAmount = parseUnits(inputAmount.toString(), 18);
      const minTokensOut = parseUnits((parseFloat(output) * (1 - slippage / 100)).toString(), 18);

      notifyInfo('交易确认', '正在买入代币...');

      writeTrade({
        address: CONTRACT_ADDRESSES.bondingCurve,
        abi: BONDING_CURVE_ABI,
        functionName: 'buyTokens',
        args: [token.address as `0x${string}`, okbAmount, minTokensOut],
      });
    }
  }, [isApproveSuccess, activeTab, amount, output, slippage, token.address, writeTrade]);

  // 监听交易完成
  useEffect(() => {
    if (isTradeSuccess) {
      notifySuccess('交易成功', `${activeTab === 'buy' ? '买入' : '卖出'}交易已完成`);
      setAmount('');
      setIsTrading(false);
      onTransactionComplete?.();
    }
  }, [isTradeSuccess, activeTab, onTransactionComplete]);

  const isLoading = isApproveLoading || isTradeLoading || isTrading;

  return (
    <div className="bg-white/5 rounded-xl p-6">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600">
          {token.image_url ? (
            <img 
              src={token.image_url} 
              alt={token.symbol}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">
              {token.symbol.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{token.symbol}</h3>
          <div className="text-sm text-gray-400">
            {TokenDetailService.formatPrice(token.current_price)}
          </div>
        </div>
      </div>

      {/* 交易标签页 */}
      <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'buy'
              ? 'bg-green-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sell'
              ? 'bg-red-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Sell
        </button>
      </div>

      {/* 输入区域 */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-400">
              {activeTab === 'buy' ? 'Pay OKB' : `Sell ${token.symbol}`}
            </label>
            <button className="text-xs text-blue-400 hover:text-blue-300">
              Balance: {activeTab === 'buy' ? okbBalanceFormatted : tokenBalanceFormatted}
            </button>
          </div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button 
              onClick={() => {
                if (activeTab === 'buy') {
                  setAmount(okbBalanceFormatted);
                } else {
                  setAmount(tokenBalanceFormatted);
                }
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300"
            >
              Max
            </button>
          </div>
        </div>

        {/* 箭头 */}
        <div className="flex justify-center">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            ↓
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-400">
              {activeTab === 'buy' ? `Get ${token.symbol}` : 'Get OKB'}
            </label>
          </div>
          <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3">
            <div className="text-white text-lg font-medium">
              {output || '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Info */}
      <div className="space-y-2 mb-6 text-sm">
        <div className="flex justify-between text-gray-400">
          <span>Price Impact</span>
          <span className={priceImpact > 5 ? 'text-red-400' : 'text-green-400'}>
            {priceImpact.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Slippage Tolerance</span>
          <div className="flex items-center gap-2">
            <select
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
            >
              <option value={0.5}>0.5%</option>
              <option value={1}>1%</option>
              <option value={2}>2%</option>
              <option value={5}>5%</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Minimum Received</span>
          <span>
            {(parseFloat(output) * (1 - slippage / 100)).toFixed(activeTab === 'buy' ? 2 : 4)}
          </span>
        </div>
      </div>

      {/* 交易按钮 */}
      {!isConnected ? (
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
          Connect Wallet
        </button>
      ) : (
        <button
          onClick={handleTrade}
          disabled={isLoading || !amount || parseFloat(amount) <= 0}
          className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
            activeTab === 'buy'
              ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600'
              : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600'
          } text-white disabled:cursor-not-allowed`}
        >
          {isLoading 
            ? 'Processing...' 
            : `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
          }
        </button>
      )}

      {/* Risk Warning */}
      <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-yellow-400 text-sm">⚠️</span>
          <div className="text-xs text-gray-300">
            <div className="font-medium mb-1">Risk Warning</div>
            <div>
              Token trading involves high risks, and prices may fluctuate significantly. Please invest cautiously and do not invest funds beyond what you can afford to lose.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
