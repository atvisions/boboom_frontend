import { useState, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown, ExternalLink, Clock, Users, Crown, Medal, Award, ChevronDown, Copy, Check, BarChart3 } from 'lucide-react';
import { tokenAPI } from '@/services/api';
import websocketService from '@/services/websocket';
import { TokenOverview } from './TokenOverview';

interface TradesAndHoldersProps {
  tokenAddress: string;
  token?: any;
  okbPrice?: number;
}

export function TradesAndHolders({ tokenAddress, token, okbPrice }: TradesAndHoldersProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'holders'>('overview');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [holders, setHolders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [holdersPage, setHoldersPage] = useState<number>(1);
  const [hasMoreTrades, setHasMoreTrades] = useState<boolean>(true);
  const [hasMoreHolders, setHasMoreHolders] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [totalHolders, setTotalHolders] = useState<number>(0);

  // 处理WebSocket交易数据
  const handleTransactionData = useCallback((data: any) => {
    if (data.type === 'transaction') {
      const transaction = data.data;
      if (transaction && transaction.token_address === tokenAddress) {
        // 将后端的snake_case字段映射为前端期望的格式
        const mappedTransaction = {
          ...transaction,
          type: transaction.type || transaction.transaction_type, // 确保type字段正确
          tokenAddress: transaction.token_address || transaction.tokenAddress,
          okbAmount: transaction.okb_amount || transaction.okbAmount,
          tokenAmount: transaction.token_amount || transaction.tokenAmount,
          amount: transaction.token_amount || transaction.amount, // 添加amount字段映射
          blockNumber: transaction.block_number || transaction.blockNumber,
          user_address: transaction.user_address,
          transaction_hash: transaction.transaction_hash
        };
        
        setTransactions(prev => {
          // 检查是否已存在该交易
          const exists = prev.some(tx => tx.id === mappedTransaction.id || tx.hash === mappedTransaction.hash);
          if (!exists) {
            return [mappedTransaction, ...prev]; // 新交易添加到顶部
          }
          return prev;
        });
        setLoading(false);
        setError(null);
      }
    }
  }, [tokenAddress]);

  // 加载交易数据
  const loadTransactions = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await tokenAPI.getTokenTransactions(tokenAddress, 'sepolia', page, 10);
      if (response.success) {
        // 将后端的snake_case字段映射为前端期望的格式
        const mappedTransactions = (response.data || []).map((transaction: any) => ({
          ...transaction,
          type: transaction.type || transaction.transaction_type, // 确保type字段正确
          tokenAddress: transaction.token_address || transaction.tokenAddress,
          okbAmount: transaction.okb_amount || transaction.okbAmount,
          tokenAmount: transaction.token_amount || transaction.tokenAmount,
          amount: transaction.token_amount || transaction.amount, // 添加amount字段映射
          blockNumber: transaction.block_number || transaction.blockNumber,
          user_address: transaction.user_address,
          transaction_hash: transaction.transaction_hash
        }));

        if (append) {
          setTransactions(prev => [...prev, ...mappedTransactions]);
        } else {
          setTransactions(mappedTransactions);
        }

        setHasMoreTrades(response.hasMore);
        setTotalTransactions(response.total);
        setCurrentPage(page);
      } else {
        setError('Failed to load transactions');
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 复制hash到剪贴板
  const copyToClipboard = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error('Failed to copy hash:', err);
    }
  };

  // 处理WebSocket持有者数据
  const handleHoldersData = useCallback((data: any) => {
    if (data.type === 'token_holders') {
      const holdersData = data.data;
      if (Array.isArray(holdersData)) {
        setHolders(holdersData);
        setLoading(false);
        setError(null);
      }
    } else if (data.type === 'holders_update') {
      const updateData = data.data;
      if (updateData && updateData.token_address === tokenAddress) {
        setHolders(updateData.holders || []);
      }
    }
  }, [tokenAddress]);

  // 加载持有人数据
  const loadHolders = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await tokenAPI.getTokenHolders(tokenAddress, 'sepolia', page, 10);
      if (response.success) {
        if (append) {
          setHolders(prev => [...prev, ...response.data || []]);
        } else {
          setHolders(response.data || []);
        }

        setHasMoreHolders(response.hasMore);
        setTotalHolders(response.total);
        setHoldersPage(page);
      } else {
        setError('Failed to load holders');
      }
    } catch (err) {
      console.error('Error loading holders:', err);
      setError('Failed to load holders');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 初始化WebSocket连接和数据
  useEffect(() => {
    let transactionConnectionId: string | null = null;
    let holdersConnectionId: string | null = null;

    if (activeTab === 'trades') {
      // 重置状态并加载第一页交易数据
      setCurrentPage(1);
      setTransactions([]);
      loadTransactions(1, false);

      // 连接交易WebSocket获取实时更新
      transactionConnectionId = websocketService.connect('transactions/', handleTransactionData);

      console.log('Connected to transaction WebSocket for real-time updates');
    } else if (activeTab === 'holders') {
      // 重置状态并加载第一页持有者数据
      setHoldersPage(1);
      setHolders([]);
      loadHolders(1, false);

      // 连接持有者WebSocket获取实时更新
      holdersConnectionId = websocketService.connect(`tokens/${tokenAddress}/holders/`, handleHoldersData);

      console.log('Connected to holders WebSocket for real-time updates');
    } else if (activeTab === 'overview') {
      // Overview tab 不需要额外的数据加载，因为数据通过 props 传递
      // 直接设置loading为false
      setLoading(false);
      setError(null);
    }

    // 清理函数
    return () => {
      if (transactionConnectionId) {
        websocketService.disconnect(transactionConnectionId);
        transactionConnectionId = null;
      }
      if (holdersConnectionId) {
        websocketService.disconnect(holdersConnectionId);
        holdersConnectionId = null;
      }
    };
  }, [tokenAddress, activeTab, handleTransactionData, handleHoldersData]);

  // 移除定期刷新，现在使用WebSocket实时数据

  // 暴露刷新函数给父组件
  useEffect(() => {
    // 将刷新函数挂载到window对象，供父组件调用
    (window as any).refreshTokenTransactions = loadTransactions;
    (window as any).refreshTokenHolders = loadHolders;
    
    return () => {
      delete (window as any).refreshTokenTransactions;
      delete (window as any).refreshTokenHolders;
    };
  }, []);

  // 加载更多交易
  const loadMoreTrades = () => {
    if (!loadingMore && hasMoreTrades) {
      loadTransactions(currentPage + 1, true);
    }
  };

  // 加载更多持有人
  const loadMoreHolders = () => {
    if (!loadingMore && hasMoreHolders) {
      loadHolders(holdersPage + 1, true);
    }
  };

  // 获取排名图标
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-4 w-4 text-yellow-400" />;
      case 1:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Award className="h-4 w-4 text-orange-400" />;
      default:
        return <span className="text-gray-400 text-sm font-bold">{index + 1}</span>;
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  // 格式化地址
  const formatAddress = (address: string | undefined) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 打开Etherscan
  const openEtherscan = (hash: string, type: 'tx' | 'address') => {
    const url = type === 'tx' 
      ? `https://sepolia.etherscan.io/tx/${hash}`
      : `https://sepolia.etherscan.io/address/${hash}`;
    window.open(url, '_blank');
  };



  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#70E000] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading {activeTab}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button 
              onClick={() => activeTab === 'trades' ? loadTransactions() : loadHolders()} 
              className="px-6 py-2 bg-[#70E000] text-black rounded-lg hover:bg-[#5BC000] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
      {/* Tab 切换 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1 bg-[#1a1a1a] rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#70E000] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'trades'
                ? 'bg-[#70E000] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Trades
          </button>
          <button
            onClick={() => setActiveTab('holders')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'holders'
                ? 'bg-[#70E000] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Holders
          </button>
        </div>

        {/* 右侧信息 */}
        <div className="text-gray-400 text-sm">
          {activeTab === 'overview' ? (
            <span>Token Information</span>
          ) : activeTab === 'trades' ? (
            <span>Showing {transactions.length} of {totalTransactions} transactions</span>
          ) : (
            <span>Showing {holders.length} of {totalHolders} holders</span>
          )}
        </div>
      </div>

      {/* Overview 内容 */}
      {activeTab === 'overview' && (
        <TokenOverview key={`${token?.address}-${Date.now()}`} token={token} okbPrice={okbPrice} />
      )}

      {/* Trades 内容 */}
      {activeTab === 'trades' && (
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <div 
              key={tx.id || index}
              className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#232323] hover:border-[#70E000]/30 transition-all duration-200"
            >
              {/* 左侧：交易类型和用户 */}
              <div className="flex items-center space-x-3">
                {/* 交易类型图标 */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  tx.type === 'BUY'
                    ? 'bg-green-500/20 text-green-400'
                    : tx.type === 'SELL'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {tx.type === 'BUY' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : tx.type === 'SELL' ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <span className="text-xs">C</span>
                  )}
                </div>
                
                {/* 用户地址和交易hash */}
                <div className="flex flex-col space-y-1">
                  <span className="text-white font-mono text-sm">
                    {formatAddress(tx.user_address)}
                  </span>
                  {tx.transaction_hash && (
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>Hash:</span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.transaction_hash.startsWith('0x') ? tx.transaction_hash : '0x' + tx.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#70E000] hover:text-[#5BC000] transition-colors cursor-pointer"
                        title="Click to view on Etherscan"
                      >
                        {tx.transaction_hash.startsWith('0x') ? tx.transaction_hash.slice(2, 10) : tx.transaction_hash.slice(0, 8)}...{tx.transaction_hash.slice(-6)}
                      </a>
                      <button
                        onClick={() => copyToClipboard(tx.transaction_hash.startsWith('0x') ? tx.transaction_hash : '0x' + tx.transaction_hash)}
                        className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
                        title="Copy hash to clipboard"
                      >
                        {copiedHash === tx.transaction_hash ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-gray-400 hover:text-[#70E000]" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 右侧：交易详情 */}
              <div className="text-right space-y-1">
                {/* 金额和时间 */}
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-white font-medium">
                    {tx.type === 'CREATE' ? 'Created' :
                     `${tx.type === 'BUY' ? '+' : '-'}${parseFloat(tx.amount || tx.token_amount || '0').toFixed(6)}`}
                  </span>
                  <span className="text-gray-400">{formatTime(tx.timestamp)}</span>
                </div>
                
                         {/* OKB金额和Etherscan链接 */}
         <div className="flex items-center justify-end space-x-3">
           <span className="text-gray-400 text-xs">
             {parseFloat(tx.okbAmount || tx.okb_amount || '0').toFixed(4)} OKB
           </span>
           {tx.hash && (
             <a
               href={`https://sepolia.etherscan.io/tx/${tx.hash.startsWith('0x') ? tx.hash : '0x' + tx.hash}`}
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center space-x-1 text-[#70E000] hover:text-[#5BC000] transition-colors text-xs"
               title="View on Etherscan"
             >
               <span>View</span>
               <ExternalLink className="h-3 w-3" />
             </a>
           )}
         </div>
              </div>
            </div>
          ))}
          
          {/* 加载更多按钮 */}
          {hasMoreTrades && (
            <div className="text-center pt-4">
              <button
                onClick={loadMoreTrades}
                disabled={loadingMore}
                className="px-6 py-3 bg-[#70E000] text-black rounded-lg hover:bg-[#5BC000] transition-colors font-medium flex items-center mx-auto space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Load More</span>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Holders 内容 */}
      {activeTab === 'holders' && (
        <div className="space-y-3">
          {holders.map((holder, index) => (
            <div 
              key={holder.address}
              className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#232323] hover:border-[#70E000]/30 transition-all duration-200"
            >
              {/* 左侧：排名和地址 */}
              <div className="flex items-center space-x-3">
                {/* 排名 */}
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700/50">
                  {getRankIcon(index)}
                </div>
                
                {/* 地址信息 */}
                <div className="flex items-center space-x-2">
                  <span className="text-white font-mono text-sm">
                    {formatAddress(holder.address)}
                  </span>
                  
                  {/* 创建者标识 */}
                  {holder.rank === 1 && (
                    <span className="px-2 py-1 bg-[#70E000]/20 text-[#70E000] text-xs rounded-full font-medium">
                      Creator
                    </span>
                  )}
                </div>
              </div>
              
              {/* 右侧：余额和百分比 */}
              <div className="text-right space-y-1">
                {/* 余额 */}
                <div className="text-white font-medium text-sm">
                  {parseFloat(holder.balance).toFixed(6)}
                </div>
                
                {/* 百分比 */}
                <div className="text-[#70E000] text-xs font-medium">
                  {parseFloat(holder.percentage).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
          
          {/* 加载更多按钮 */}
          {hasMoreHolders && (
            <div className="text-center pt-4">
              <button
                onClick={loadMoreHolders}
                disabled={loadingMore}
                className="px-6 py-3 bg-[#70E000] text-black rounded-lg hover:bg-[#5BC000] transition-colors font-medium flex items-center mx-auto space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Load More</span>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
