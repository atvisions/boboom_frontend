import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { tokenAPI } from '@/services/api';

interface TransactionHistoryProps {
  tokenAddress: string;
}

export function TransactionHistory({ tokenAddress }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载交易记录
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const response = await tokenAPI.getTokenTransactions(tokenAddress, 'sepolia');
        if (response.success) {
          setTransactions(response.data.transactions);
        } else {
          setError('Failed to load transactions');
        }
      } catch (err) {
        console.error('Error loading transactions:', err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [tokenAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#70E000]"></div>
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

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
      
      <div className="space-y-3">
        {transactions.map((tx, index) => (
          <div
            key={tx.id || index}
            className="bg-[#1a1a1a] rounded-lg p-4 border border-[#232323] hover:border-[#70E000]/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* 交易类型图标 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tx.transaction_type === 'BUY' 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {tx.transaction_type === 'BUY' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </div>
                
                {/* 交易信息 */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-white font-medium">
                      {tx.transaction_type === 'BUY' ? 'Buy' : 'Sell'}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {tx.okb_amount} OKB
                    </span>
                    {tx.token_amount > 0 && (
                      <>
                        <span className="text-gray-400">for</span>
                        <span className="text-gray-400 text-sm">
                          {tx.token_amount} tokens
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Price: ${parseFloat(tx.price || '0').toFixed(6)}</span>
                    <span>•</span>
                    <span>{new Date(tx.block_timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* 用户地址和区块链接 */}
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">
                  {tx.user_address?.slice(0, 6)}...{tx.user_address?.slice(-4)}
                </div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${tx.transaction_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-[#70E000] hover:text-[#5BC000] transition-colors"
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
