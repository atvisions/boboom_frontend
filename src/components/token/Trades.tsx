import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ExternalLink, Clock, Users, Crown, Medal, Award } from 'lucide-react';

interface TradesAndHoldersProps {
  tokenAddress: string;
}

export function TradesAndHolders({ tokenAddress }: TradesAndHoldersProps) {
  const [activeTab, setActiveTab] = useState<'trades' | 'holders'>('trades');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [holders, setHolders] = useState<any[]>([]);

  // 生成模拟交易数据
  const generateMockTransactions = () => {
    const mockTransactions = [
      {
        id: 1,
        transaction_type: 'BUY',
        user_address: '0x1234...5678',
        token_amount: '1,250,000',
        okb_amount: '0.6850',
        time: '5m ago'
      },
      {
        id: 2,
        transaction_type: 'SELL',
        user_address: '0xabcd...ef12',
        token_amount: '500,000',
        okb_amount: '0.2739',
        time: '15m ago'
      },
      {
        id: 3,
        transaction_type: 'BUY',
        user_address: '0x9876...5432',
        token_amount: '2,500,000',
        okb_amount: '1.3700',
        time: '30m ago'
      },
      {
        id: 4,
        transaction_type: 'BUY',
        user_address: '0x5555...5555',
        token_amount: '750,000',
        okb_amount: '0.4110',
        time: '45m ago'
      },
      {
        id: 5,
        transaction_type: 'SELL',
        user_address: '0x6666...6666',
        token_amount: '300,000',
        okb_amount: '0.1644',
        time: '1h ago'
      }
    ];
    return mockTransactions;
  };

  // 生成模拟持有人数据
  const generateMockHolders = () => {
    const mockHolders = [
      {
        address: '0x1234...5678',
        balance: '5,000,000',
        percentage: '25.00',
        is_creator: true
      },
      {
        address: '0xabcd...ef12',
        balance: '3,000,000',
        percentage: '15.00',
        is_creator: false
      },
      {
        address: '0x9876...5432',
        balance: '2,500,000',
        percentage: '12.50',
        is_creator: false
      },
      {
        address: '0x5555...5555',
        balance: '2,000,000',
        percentage: '10.00',
        is_creator: false
      },
      {
        address: '0x6666...6666',
        balance: '1,500,000',
        percentage: '7.50',
        is_creator: false
      }
    ];
    return mockHolders;
  };

  // 初始化模拟数据
  useEffect(() => {
    setTransactions(generateMockTransactions());
    setHolders(generateMockHolders());
  }, []);

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
            <span>Recent transactions</span>
          ) : (
            <span>{holders.length} holders</span>
          )}
        </div>
      </div>

      {/* Trades 内容 */}
      {activeTab === 'trades' && (
        <div className="space-y-3">
          {transactions.map((tx, index) => (
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
        </div>
      )}
    </div>
  );
}
