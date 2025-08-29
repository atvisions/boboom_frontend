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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'BUY': 
        return (
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'SELL': 
        return (
          <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'CREATE': 
        return (
          <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        );
      case 'GRADUATE': 
        return (
          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      default: 
        return (
          <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
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
      <div className="animate-pulse">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/10 rounded"></div>
                <div className="w-8 h-8 bg-white/10 rounded-full"></div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-4 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-2">📋 Failed to Load</div>
        <div className="text-gray-400 text-sm mb-4">{error}</div>
        <button
          onClick={fetchTransactions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'BUY', label: 'Buy' },
          { key: 'SELL', label: 'Sell' },
          { key: 'CREATE', label: 'Create' },
          { key: 'GRADUATE', label: 'Graduate' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-2xl mb-2">📋</div>
            <div>No transactions found</div>
          </div>
        ) : (
          filteredTransactions.slice(0, 10).map((tx) => (
            <div key={tx.hash} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-lg">{getTransactionIcon(tx.type)}</div>
                <img 
                  src={`https://avatar.vercel.sh/${tx.user}.png?size=32`}
                  alt="User"
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://avatar.vercel.sh/${tx.user}.png?size=32`;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium">{tx.type}</span>
                  <span className="text-gray-400 text-sm">
                    {TokenDetailService.formatNumber(parseFloat(tx.tokens))} tokens
                  </span>
                </div>
                <div className="text-gray-400 text-sm">
                  {TokenDetailService.formatAddress(tx.user)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm">
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </div>
                <a
                  href={getExplorerUrl(tx.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
