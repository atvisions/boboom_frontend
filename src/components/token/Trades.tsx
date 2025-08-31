import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ExternalLink, Clock, Users, Crown, Medal, Award, ChevronDown } from 'lucide-react';

interface TradesAndHoldersProps {
  tokenAddress: string;
}

export function TradesAndHolders({ tokenAddress }: TradesAndHoldersProps) {
  const [activeTab, setActiveTab] = useState<'trades' | 'holders'>('trades');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [holders, setHolders] = useState<any[]>([]);
  const [displayedTrades, setDisplayedTrades] = useState<number>(20);
  const [displayedHolders, setDisplayedHolders] = useState<number>(20);

  // 生成模拟交易数据
  const generateMockTransactions = () => {
    const mockTransactions = [];
    for (let i = 1; i <= 100; i++) {
      mockTransactions.push({
        id: i,
        transaction_type: i % 3 === 0 ? 'SELL' : 'BUY',
        user_address: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
        token_amount: (Math.random() * 5000000 + 100000).toLocaleString(),
        okb_amount: (Math.random() * 2 + 0.1).toFixed(4),
        time: `${Math.floor(Math.random() * 60)}m ago`
      });
    }
    return mockTransactions;
  };

  // 生成模拟持有人数据
  const generateMockHolders = () => {
    const mockHolders = [];
    for (let i = 1; i <= 100; i++) {
      mockHolders.push({
        address: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
        balance: (Math.random() * 10000000 + 100000).toLocaleString(),
        percentage: (Math.random() * 20 + 0.1).toFixed(2),
        is_creator: i === 1
      });
    }
    return mockHolders;
  };

  // 初始化模拟数据
  useEffect(() => {
    setTransactions(generateMockTransactions());
    setHolders(generateMockHolders());
  }, []);

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

  // 检查是否还有更多数据可以加载
  const hasMoreTrades = displayedTrades < transactions.length;
  const hasMoreHolders = displayedHolders < holders.length;

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
              key={tx.id}
              className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#232323] hover:border-[#70E000]/30 transition-all duration-200"
            >
              {/* 左侧：交易类型和用户 */}
              <div className="flex items-center space-x-3">
                {/* 交易类型图标 */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  tx.transaction_type === 'BUY' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {tx.transaction_type === 'BUY' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                </div>
                
                {/* 用户地址 */}
                <span className="text-white font-mono text-sm">
                  {tx.user_address}
                </span>
              </div>
              
              {/* 右侧：交易详情 */}
              <div className="text-right space-y-1">
                {/* 金额和时间 */}
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-white font-medium">
                    {tx.transaction_type === 'BUY' ? '+' : '-'}{tx.token_amount}
                  </span>
                  <span className="text-gray-400">{tx.time}</span>
                </div>
                
                {/* OKB金额 */}
                <div className="text-gray-400 text-xs">
                  {tx.okb_amount} OKB
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
                    {holder.address}
                  </span>
                  
                  {/* 创建者标识 */}
                  {holder.is_creator && (
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
                  {holder.balance}
                </div>
                
                {/* 百分比 */}
                <div className="text-[#70E000] text-xs font-medium">
                  {holder.percentage}%
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
