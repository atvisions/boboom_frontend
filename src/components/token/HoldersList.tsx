import { useState, useEffect } from 'react';
import { Users, ExternalLink } from 'lucide-react';
import { tokenAPI } from '@/services/api';

interface HoldersListProps {
  tokenAddress: string;
}

export function HoldersList({ tokenAddress }: HoldersListProps) {
  const [holders, setHolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载持有人信息
  useEffect(() => {
    const loadHolders = async () => {
      try {
        setLoading(true);
        const response = await tokenAPI.getTokenHolders(tokenAddress, 'sepolia');
        if (response.success) {
          setHolders(response.data || []);
        } else {
          setError('Failed to load holders');
        }
      } catch (err) {

        setError('Failed to load holders');
      } finally {
        setLoading(false);
      }
    };

    loadHolders();
  }, [tokenAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D7FE11]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg">{error}</p>
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No holders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="h-5 w-5 text-[#D7FE11]" />
        <h3 className="text-lg font-semibold text-white">Token Holders ({holders.length})</h3>
      </div>
      
      <div className="space-y-3">
        {holders.map((holder, index) => (
          <div
            key={holder.address || index}
            className="bg-[#1a1a1a] rounded-lg p-4 border border-[#232323] hover:border-[#D7FE11]/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* 排名 */}
                <div className="w-8 h-8 rounded-full bg-[#D7FE11]/20 flex items-center justify-center">
                  <span className="text-[#D7FE11] font-bold text-sm">#{index + 1}</span>
                </div>
                
                {/* 持有人信息 */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-white font-medium">
                      {holder.address?.slice(0, 6)}...{holder.address?.slice(-4)}
                    </span>
                    {holder.is_creator && (
                      <span className="bg-[#D7FE11] text-black text-xs px-2 py-1 rounded-full">
                        Creator
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Balance: {parseFloat(holder.balance || '0').toFixed(6)} tokens</span>
                    <span>•</span>
                    <span>Percentage: {parseFloat(holder.percentage || '0').toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              
              {/* 外部链接 */}
              <div className="flex items-center space-x-2">
                <a
                  href={`https://sepolia.etherscan.io/address/${holder.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-[#D7FE11] hover:text-[#5BC000] transition-colors"
                >
                  <span className="text-xs">View</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
