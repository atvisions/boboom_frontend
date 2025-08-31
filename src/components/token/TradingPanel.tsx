import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Zap, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTokenFactory } from '@/hooks/useTokenFactory';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from '@/components/ui/toast-notification';

interface TradingPanelProps {
  token: any;
}

export function TradingPanel({ token }: TradingPanelProps) {
  const { address, isAuthenticated } = useWalletAuth();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [okbBalance, setOkbBalance] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [okbPrice, setOkbPrice] = useState<number>(177.6);

  const {
    okbAllowanceBondingCurve,
    isPending,
    approveOKBForTrading,
    buyToken,
    sellToken
  } = useTokenFactory();

  // 加载用户余额
  useEffect(() => {
    const loadBalances = async () => {
      if (!address) return;
      
      try {
        // 这里应该从API获取用户余额
        // 暂时使用模拟数据
        setOkbBalance('1000.0');
        setTokenBalance('0.0');
      } catch (error) {
        console.error('Failed to load balances:', error);
      }
    };

    loadBalances();
  }, [address]);

  // 加载OKB价格
  useEffect(() => {
    const loadOKBPrice = async () => {
      try {
        const response = await fetch('/api/tokens/okb-price');
        const data = await response.json();
        if (data.success) {
          setOkbPrice(parseFloat(data.data.price));
        }
      } catch (error) {
        console.error('Failed to load OKB price:', error);
      }
    };

    loadOKBPrice();
  }, []);

  // 计算预估价格
  const calculateEstimatedPrice = () => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    
    // 这里应该调用合约的getCurrentPrice函数
    // 暂时使用代币的当前价格
    return parseFloat(amount) * parseFloat(token.currentPrice);
  };

  // 计算预估代币数量
  const calculateEstimatedTokens = () => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    
    const okbAmount = parseFloat(amount);
    const tokenPrice = parseFloat(token.currentPrice);
    return okbAmount / tokenPrice;
  };

  // 处理买入
  const handleBuy = async () => {
    if (!address || !isAuthenticated) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const okbAmount = parseFloat(amount);
    if (okbAmount > parseFloat(okbBalance)) {
      toast.error('Insufficient OKB balance');
      return;
    }

    setIsLoading(true);
    try {
      // 执行买入（授权检查在buyToken内部处理）
      await buyToken(token.address, okbAmount);
      toast.success('Buy order submitted successfully');
      setAmount('');
    } catch (error) {
      console.error('Buy error:', error);
      toast.error('Failed to execute buy order');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理卖出
  const handleSell = async () => {
    if (!address || !isAuthenticated) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const tokenAmount = parseFloat(amount);
    if (tokenAmount > parseFloat(tokenBalance)) {
      toast.error('Insufficient token balance');
      return;
    }

    setIsLoading(true);
    try {
      await sellToken(token.address, tokenAmount);
      toast.success('Sell order submitted successfully');
      setAmount('');
    } catch (error) {
      console.error('Sell error:', error);
      toast.error('Failed to execute sell order');
    } finally {
      setIsLoading(false);
    }
  };

  // 快速金额按钮
  const quickAmounts = ['0.1', '0.5', '1', 'Max'];

  const setQuickAmount = (value: string) => {
    if (value === 'Max') {
      setAmount(activeTab === 'buy' ? okbBalance : tokenBalance);
    } else {
      setAmount(value);
    }
  };

  const estimatedPrice = calculateEstimatedPrice();
  const estimatedTokens = calculateEstimatedTokens();

  return (
    <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
      {/* 交易标签页 */}
      <div className="flex bg-[#1a1a1a] rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'buy'
              ? 'bg-[#70E000] text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ArrowUp className="h-4 w-4 inline mr-2" />
          Buy
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sell'
              ? 'bg-red-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ArrowDown className="h-4 w-4 inline mr-2" />
          Sell
        </button>
      </div>

      {/* 余额显示 - 一行显示 */}
      <div className="flex items-center justify-between text-white mb-6">
        <span className="text-sm">balance:</span>
        <span className="font-medium">
          {parseFloat(activeTab === 'buy' ? okbBalance : tokenBalance).toFixed(6)} {activeTab === 'buy' ? 'OKB' : token.symbol}
        </span>
      </div>

      {/* 输入框 - 增加高度，去掉Amount标签 */}
      <div className="mb-4">
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="bg-[#0a0a0a] border-[#333333] text-white pr-16 h-14 text-lg focus:border-[#70E000] focus:ring-[#70E000]/20 [appearance:none] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <span className="text-gray-400 text-sm">{activeTab === 'buy' ? 'OKB' : token.symbol}</span>
            <div className="w-6 h-6 rounded-full bg-[#70E000] flex items-center justify-center">
              <span className="text-black text-xs font-bold">O</span>
            </div>
          </div>
        </div>
      </div>

      {/* 快速金额按钮 */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAmount('')}
          className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
        >
          Reset
        </Button>
        {quickAmounts.map((value) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => setQuickAmount(value)}
            className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
          >
            {value}
          </Button>
        ))}
      </div>

      {/* 预估信息 */}
      {amount && parseFloat(amount) > 0 && (
        <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 mb-6">
          <div className="space-y-2">
            {activeTab === 'buy' ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated {token.symbol}:</span>
                  <span className="text-white font-medium">
                    {estimatedTokens.toFixed(6)} {token.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className="text-green-500">~0.1%</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated OKB:</span>
                  <span className="text-white font-medium">
                    {estimatedPrice.toFixed(4)} OKB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className="text-red-500">~0.1%</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 授权状态 */}
      {activeTab === 'buy' && okbAllowanceBondingCurve < parseFloat(amount || '0') && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-4 w-4 text-yellow-500" />
            <span className="text-yellow-500 text-sm font-medium">Approval Required</span>
          </div>
          <p className="text-yellow-400 text-xs">
            You need to approve OKB spending before trading
          </p>
        </div>
      )}

      {/* 交易按钮 */}
      <Button
        onClick={activeTab === 'buy' ? handleBuy : handleSell}
        disabled={isLoading || isPending || !amount || parseFloat(amount) <= 0}
        className={`w-full py-3 font-medium ${
          activeTab === 'buy'
            ? 'bg-[#70E000] text-black hover:bg-[#5BC000]'
            : 'bg-red-500 text-white hover:bg-red-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading || isPending ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
        ) : activeTab === 'buy' ? (
          <ArrowUp className="h-4 w-4 mr-2" />
        ) : (
          <ArrowDown className="h-4 w-4 mr-2" />
        )}
        {isLoading || isPending ? 'Processing...' : `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`}
      </Button>
    </div>
  );
}
