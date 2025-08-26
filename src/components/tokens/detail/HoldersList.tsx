"use client";
import React, { useState, useEffect } from 'react';
import { TokenHolder } from '@/types/tokenDetail';
import { TokenDetailService } from '@/services/tokenDetailService';

interface HoldersListProps {
  tokenAddress: string;
  network?: string;
  tokenSymbol?: string;
}

export function HoldersList({ tokenAddress, network = 'sepolia', tokenSymbol = 'TOKEN' }: HoldersListProps) {
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHolders();
  }, [tokenAddress, network]);

  const fetchHolders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TokenDetailService.getTokenHolders(tokenAddress, network, 50);
      setHolders(data);
    } catch (err) {
      console.error('Error fetching holders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load holders');
    } finally {
      setLoading(false);
    }
  };

  const getAddressLabel = (address: string): string => {
    // Check for special addresses
    if (address.toLowerCase() === tokenAddress.toLowerCase()) {
      return 'Contract';
    }
    
    // Add more known address labels
    const knownAddresses: { [key: string]: string } = {
      '0x0000000000000000000000000000000000000000': 'Null Address',
      '0x000000000000000000000000000000000000dead': 'Burn Address',
    };
    
    return knownAddresses[address.toLowerCase()] || '';
  };

  const getExplorerUrl = (address: string): string => {
    // Return different blockchain explorer links based on network
    switch (network) {
      case 'sepolia':
        return `https://sepolia.etherscan.io/address/${address}`;
      case 'xlayer':
        return `https://www.oklink.com/xlayer/address/${address}`;
      default:
        return `https://etherscan.io/address/${address}`;
    }
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
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
          <div className="text-red-400 mb-2">👥 Failed to Load</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <button
            onClick={fetchHolders}
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
      {/* Title */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Top Holders</h3>
        <div className="text-sm text-gray-400">
          {holders.length} holders total
        </div>
      </div>

      {/* Holders list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {holders.length > 0 ? (
          holders.map((holder, index) => {
            const rank = index + 1;
            const addressLabel = getAddressLabel(holder.address);
            
            return (
              <div
                key={holder.address}
                className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-12 text-center">
                  <span className="text-sm font-medium text-gray-300">
                    {typeof getRankIcon(rank) === 'string' && getRankIcon(rank).includes('#') 
                      ? getRankIcon(rank) 
                      : getRankIcon(rank)
                    }
                  </span>
                </div>

                {/* Address info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-mono text-sm">
                      {TokenDetailService.formatAddress(holder.address)}
                    </span>
                    {addressLabel && (
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                        {addressLabel}
                      </span>
                    )}
                  </div>
                  
                  <a
                    href={getExplorerUrl(holder.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View Address ↗
                  </a>
                </div>

                {/* Holdings info */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-white font-semibold text-sm mb-1">
                    {TokenDetailService.formatNumber(holder.balance)} {tokenSymbol}
                  </div>
                  <div className="text-xs text-gray-400">
                    {holder.percentage ? `${holder.percentage.toFixed(2)}%` : '0.00%'}
                  </div>
                </div>

                {/* Holdings percentage visualization */}
                <div className="flex-shrink-0 w-16">
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(holder.percentage || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">👥</div>
            <div className="text-gray-400">No holder data available</div>
            <div className="text-xs text-gray-500 mt-1">
              Data based on recent transaction addresses
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {holders.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-gray-400">Top 10 Holdings</div>
              <div className="text-white font-semibold">
                {holders.slice(0, 10).reduce((sum, holder) => sum + (holder.percentage || 0), 0).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-gray-400">Largest Holding</div>
              <div className="text-white font-semibold">
                {holders.length > 0 ? (holders[0].percentage || 0).toFixed(2) : 0}%
              </div>
            </div>
            <div>
              <div className="text-gray-400">Unique Holders</div>
              <div className="text-white font-semibold">
                {holders.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
