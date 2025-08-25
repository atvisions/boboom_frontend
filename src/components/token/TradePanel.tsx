'use client';

import { useState, useMemo } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { useApproveAndTrade } from '@/hooks/useApproveAndTrade';
import { useTradeQuote } from '@/hooks/useTradeQuote';
import { bondingCurveV3Address, bondingCurveV3Abi, okbTokenAddress } from '@/lib/contracts';

interface TradePanelProps { tokenAddress: `0x${string}` }

export function TradePanel({ tokenAddress }: TradePanelProps) {
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const debouncedAmount = useDebounce(amount, 500);
  const { address: userAddress } = useAccount();
  const { quote, isLoading: isQuoteLoading } = useTradeQuote({
    tokenAddress,
    tradeMode,
    inputAmount: debouncedAmount,
  });

  const amountAsBigInt = useMemo(() => debouncedAmount ? parseUnits(debouncedAmount, 18) : BigInt(0), [debouncedAmount]);
  const tokenToSpend = tradeMode === 'buy' ? okbTokenAddress : tokenAddress;

  const { isApproved, approve, isApproving } = useApproveAndTrade({
    tokenToSpend,
    spenderAddress: bondingCurveV3Address,
    amountToSpend: amountAsBigInt,
  });

  const { data: okbBalance } = useBalance({ address: userAddress, token: okbTokenAddress });
  const { data: tokenBalance } = useBalance({ address: userAddress, token: tokenAddress });

  const { data: tradeTxHash, writeContractAsync: executeTrade, isPending: isTradeExecuting } = useWriteContract();
  const { isLoading: isTradeConfirming } = useWaitForTransactionReceipt({ hash: tradeTxHash });

  const handleTrade = async () => {
    if (amountAsBigInt <= 0) return;
    try {
      await executeTrade({
        address: bondingCurveV3Address,
        abi: bondingCurveV3Abi,
        functionName: tradeMode === 'buy' ? 'buyTokens' : 'sellTokens',
        args: [tokenAddress, amountAsBigInt, BigInt(0)], // 0 for min output, can be improved
      });
    } catch (error) {
      console.error("Trade execution failed:", error);
    }
  };

  const isLoading = isApproving || isTradeExecuting || isTradeConfirming;
  const balance = tradeMode === 'buy' ? okbBalance : tokenBalance;
  const formattedBalance = balance ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4) : '0.0000';

  const setPresetAmount = (percentage: number) => {
    if (!balance) return;
    const newAmount = (Number(formatUnits(balance.value, balance.decimals)) * percentage) / 100;
    setAmount(newAmount.toString());
  };

  return (
    <div className="space-y-6 p-4 bg-gray-800 rounded-lg">
      <div className="grid grid-cols-2 gap-2 bg-gray-900 p-1 rounded-md">
        <button onClick={() => setTradeMode('buy')} className={`px-4 py-2 text-sm font-semibold rounded ${tradeMode === 'buy' ? 'bg-green-500 text-white' : 'text-gray-400'}`}>Buy</button>
        <button onClick={() => setTradeMode('sell')} className={`px-4 py-2 text-sm font-semibold rounded ${tradeMode === 'sell' ? 'bg-red-500 text-white' : 'text-gray-400'}`}>Sell</button>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">{tradeMode === 'buy' ? 'You pay' : 'You sell'}</span>
          <span className="text-xs text-gray-400">Balance: {formattedBalance}</span>
        </div>
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="bg-gray-900 border-gray-700 text-white text-lg pl-4 pr-20 h-12"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-white font-semibold">
            {tradeMode === 'buy' ? 'OKB' : tokenBalance?.symbol || 'TKN'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[25, 50, 75, 100].map((pct) => (
          <button key={pct} onClick={() => setPresetAmount(pct)} className="bg-gray-700 text-xs text-white py-1.5 rounded hover:bg-gray-600">{pct}%</button>
        ))}
      </div>

      <div className="text-center text-sm text-gray-400 h-6">
        {isQuoteLoading && <Loader2 className="animate-spin inline-block" />}
        {quote && !isQuoteLoading && (
          <span>You will receive ~{parseFloat(quote).toFixed(4)} {tradeMode === 'buy' ? tokenBalance?.symbol || 'TKN' : 'OKB'}</span>
        )}
      </div>

      <div className="pt-2">
        {isApproved ? (
          <Button onClick={handleTrade} disabled={isLoading || !amount} className={`w-full h-12 text-lg font-bold ${tradeMode === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
            {isLoading ? <Loader2 className="animate-spin" /> : (tradeMode === 'buy' ? `Buy ${tokenBalance?.symbol || ''}` : `Sell ${tokenBalance?.symbol || ''}`)}
          </Button>
        ) : (
          <Button onClick={approve} disabled={isLoading || !amount} className="w-full h-12 text-lg font-bold bg-blue-500 hover:bg-blue-600">
            {isApproving ? <Loader2 className="animate-spin" /> : `Approve ${tradeMode === 'buy' ? 'OKB' : (tokenBalance?.symbol || 'Token')}`}
          </Button>
        )}
      </div>

      {tradeTxHash && <p className="text-xs text-center text-green-400">Transaction sent! Waiting for confirmation...</p>}
    </div>
  );
}

