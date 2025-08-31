import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ExternalLink, Clock, Users, Crown, Medal, Award, ChevronDown } from 'lucide-react';
import { tokenAPI } from '@/services/api';

interface TradesAndHoldersProps {
  tokenAddress: string;
}

export function TradesAndHolders({ tokenAddress }: TradesAndHoldersProps) {
  const [activeTab, setActiveTab] = useState<'trades' | 'holders'>('trades');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [holders, setHolders] = useState<any[]>([]);
  const [displayedTrades, setDisplayedTrades] = useState<number>(20);
  const [displayedHolders, setDisplayedHolders] = useState<number>(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载交易数据
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await tokenAPI.getTokenTransactions(tokenAddress, 'sepolia');
      if (response.success) {
        setTransactions(response.data || []);
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

  // 加载持有人数据
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
      console.error('Error loading holders:', err);
      setError('Failed to load holders');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    if (activeTab === 'trades') {
      loadTransactions();
    } else {
      loadHolders();
    }
  }, [tokenAddress, activeTab]);

  // 加载更多交易
  const loadMoreTrades = () => {
    setDisplayedTrades(prev => Math.min(prev + 20, transactions.length));
  };

  // 加载更多持有人
  const loadMoreHolders = () => {
    setDisplayedHolders(prev => Math.min(prev + 20, holders.length));
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
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 打开Etherscan
  const openEtherscan = (hash: string, type: 'tx' | 'address') => {
    const url = type === 'tx' 
      ? `https://sepolia.etherscan.io/tx/${hash}`
      : `https://sepolia.etherscan.io/address/${hash}`;
    window.open(url, '_blank');
  };

  // 检查是否还有更多数据可以加载
  const hasMoreTrades = displayedTrades < transactions.length;
  const hasMoreHolders = displayedHolders < holders.length;

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
          {activeTab === 'trades' ? (
            <span>Showing {Math.min(displayedTrades, transactions.length)} of {transactions.length} transactions</span>
          ) : (
            <span>Showing {Math.min(displayedHolders, holders.length)} of {holders.length} holders</span>
          )}
        </div>
      </div>

      {/* Trades 内容 */}
      {activeTab === 'trades' && (
        <div className="space-y-3">
          {transactions.slice(0, displayedTrades).map((tx, index) => (
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
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {tx.type === 'BUY' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                </div>
                
                {/* 用户地址 */}
                <span className="text-white font-mono text-sm">
                  {formatAddress(tx.from)}
                </span>
              </div>
              
              {/* 右侧：交易详情 */}
              <div className="text-right space-y-1">
                {/* 金额和时间 */}
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-white font-medium">
                    {tx.type === 'BUY' ? '+' : '-'}{parseFloat(tx.amount).toFixed(6)}
                  </span>
                  <span className="text-gray-400">{formatTime(tx.timestamp)}</span>
                </div>
                
                {/* OKB金额 */}
                <div className="text-gray-400 text-xs">
                  {parseFloat(tx.okb_amount).toFixed(4)} OKB
                </div>
              </div>
            </div>
          ))}
          
          {/* 加载更多按钮 */}
          {hasMoreTrades && (
            <div className="text-center pt-4">
              <button
                onClick={loadMoreTrades}
                className="px-6 py-3 bg-[#70E000] text-black rounded-lg hover:bg-[#5BC000] transition-colors font-medium flex items-center mx-auto space-x-2"
              >
                <span>Load More</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Holders 内容 */}
      {activeTab === 'holders' && (
        <div className="space-y-3">
          {holders.slice(0, displayedHolders).map((holder, index) => (
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
                className="px-6 py-3 bg-[#70E000] text-black rounded-lg hover:bg-[#5BC000] transition-colors font-medium flex items-center mx-auto space-x-2"
              >
                <span>Load More</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
