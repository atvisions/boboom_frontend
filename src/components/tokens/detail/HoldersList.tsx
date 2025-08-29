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
      <div className="animate-pulse">
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
              <div className="w-8 h-8 bg-white/10 rounded-full"></div>
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
        <div className="text-red-400 mb-2">👥 Failed to Load</div>
        <div className="text-gray-400 text-sm mb-4">{error}</div>
        <button
          onClick={fetchHolders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Holders List */}
      <div className="space-y-3">
        {holders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-2xl mb-2">👥</div>
            <div>No holders found</div>
          </div>
        ) : (
          holders.map((holder, index) => (
            <div key={holder.address} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-lg">{getRankIcon(index + 1)}</div>
                <img 
                  src={`https://avatar.vercel.sh/${holder.address}.png?size=32`}
                  alt="Holder"
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://avatar.vercel.sh/${holder.address}.png?size=32`;
                  }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium">
                    {getAddressLabel(holder.address) || TokenDetailService.formatAddress(holder.address)}
                  </span>
                  {holder.percentage > 5 && (
                    <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">
                      Whale
                    </span>
                  )}
                </div>
                <div className="text-gray-400 text-sm">
                  {TokenDetailService.formatNumber(parseFloat(holder.balance))} {tokenSymbol}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-white font-medium">
                  {holder.percentage.toFixed(2)}%
                </div>
                <a
                  href={getExplorerUrl(holder.address)}
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
