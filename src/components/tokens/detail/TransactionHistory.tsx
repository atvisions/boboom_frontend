"use client";
import React, { useState, useEffect } from 'react';
import { Transaction } from '@/types/tokenDetail';
import { TokenDetailService } from '@/services/tokenDetailService';

interface TransactionHistoryProps {
  tokenAddress: string;
  network?: string;
}

export function TransactionHistory({ tokenAddress, network = 'sepolia' }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'CREATE' | 'GRADUATE'>('ALL');

  useEffect(() => {
    fetchTransactions();
  }, [tokenAddress, network]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TokenDetailService.getTokenTransactions(tokenAddress, network, 100);
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    filter === 'ALL' || tx.type === filter
  );

  const getTransactionIcon = (type: string): string => {
    switch (type) {
      case 'BUY': return '🟢';
      case 'SELL': return '🔴';
      case 'CREATE': return '🆕';
      case 'GRADUATE': return '🎓';
      default: return '⚪';
    }
  };

  const getExplorerUrl = (hash: string): string => {
    // Return different blockchain explorer links based on network
    switch (network) {
      case 'sepolia':
        return `https://sepolia.etherscan.io/tx/${hash}`;
      case 'xlayer':
        return `https://www.oklink.com/xlayer/tx/${hash}`;
      default:
        return `https://etherscan.io/tx/${hash}`;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-4 bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-2xl p-6">
        <div className="text-center">
          <div className="text-red-400 mb-2">📋 Failed to Load</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6">
      {/* Title and filters */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Transaction History</h3>
        
        {/* Filters */}
        <div className="flex gap-2">
          {['ALL', 'BUY', 'SELL', 'CREATE', 'GRADUATE'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filterType === 'ALL' ? 'All' : TokenDetailService.getTransactionTypeText(filterType).text}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => {
            const { text: typeText, color: typeColor } = TokenDetailService.getTransactionTypeText(tx.type);
            
            return (
              <div
                key={tx.hash}
                className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                {/* Transaction type icon */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm">
                    {getTransactionIcon(tx.type)}
                  </div>
                </div>

                {/* Transaction info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${typeColor}`}>
                      {typeText}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {TokenDetailService.formatAddress(tx.user)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>
                      {parseFloat(tx.tokens).toFixed(2)} tokens
                    </span>
                    <span>
                      {parseFloat(tx.okb).toFixed(4)} OKB
                    </span>
                    <span>
                      {TokenDetailService.formatPrice(tx.price)}
                    </span>
                  </div>
                </div>

                {/* Time and link */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-gray-400 mb-1">
                    {TokenDetailService.formatTime(tx.timestamp)}
                  </div>
                  <a
                    href={getExplorerUrl(tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View Details ↗
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-gray-400">
              {filter === 'ALL' ? 'No transactions found' : `No ${TokenDetailService.getTransactionTypeText(filter).text.toLowerCase()} transactions found`}
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {transactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Total: {transactions.length}</span>
            <span>Showing: {filteredTransactions.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
