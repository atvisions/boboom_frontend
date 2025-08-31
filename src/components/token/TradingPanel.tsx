import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Zap, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTokenFactory } from '@/hooks/useTokenFactory';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from '@/components/ui/toast-notification';
import { userAPI, tokenAPI } from '@/services/api';

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
  const [userPortfolio, setUserPortfolio] = useState<any>(null);
  const [userTokens, setUserTokens] = useState<any>(null);
  
  // 报价状态
  const [buyQuote, setBuyQuote] = useState<any>(null);
  const [sellQuote, setSellQuote] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  const {
    okbAllowanceBondingCurve,
    isPending,
    isSuccess,
    approveOKBForTrading,
    buyToken,
    sellToken,
    refetchOkbAllowanceBondingCurve,
    refetchOkbBalance,
    getBuyQuote,
    getSellQuote,
    getCurrentPrice
  } = useTokenFactory();

  // 加载当前价格
  useEffect(() => {
    const loadCurrentPrice = async () => {
      if (token?.address) {
        try {
          const price = await getCurrentPrice(token.address);
          setCurrentPrice(price);
        } catch (error) {
          console.error('Failed to load current price:', error);
        }
      }
    };

    loadCurrentPrice();
  }, [token?.address]); // 移除getCurrentPrice依赖

  // 当金额变化时获取报价
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || parseFloat(amount) <= 0 || !token?.address) {
        setBuyQuote(null);
        setSellQuote(null);
        return;
      }

      try {
        if (activeTab === 'buy') {
          const quote = await getBuyQuote(token.address, parseFloat(amount));
          setBuyQuote(quote);
          setSellQuote(null);
        } else {
          const quote = await getSellQuote(token.address, parseFloat(amount));
          setSellQuote(quote);
          setBuyQuote(null);
        }
      } catch (error) {
        console.error('Failed to fetch quote:', error);
        setBuyQuote(null);
        setSellQuote(null);
      }
    };

    // 添加防抖，避免频繁调用
    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [amount, activeTab, token?.address]); // 移除getBuyQuote, getSellQuote依赖

  // 当切换买卖模式时清空报价
  useEffect(() => {
    setBuyQuote(null);
    setSellQuote(null);
  }, [activeTab]);

  // 加载用户余额
  useEffect(() => {
    const loadBalances = async () => {
      if (!address) return;
      
      try {
        // 获取用户资产组合
        const portfolioResponse = await userAPI.getUserPortfolio(address);
        setUserPortfolio(portfolioResponse);
        setOkbBalance(portfolioResponse.okb || '0');

        // 获取用户代币
        const tokensResponse = await userAPI.getUserTokens(address, 'sepolia');
        setUserTokens(tokensResponse);
        
        // 查找当前代币的余额
        const currentToken = tokensResponse.holding.find(
          (t: any) => t.address.toLowerCase() === token.address.toLowerCase()
        );
        if (currentToken) {
          setTokenBalance(currentToken.balance || '0');
        } else {
          setTokenBalance('0');
        }
      } catch (error) {
        console.error('Failed to load balances:', error);
        // 使用合约余额作为备用
        setOkbBalance(okbBalance.toString());
      }
    };

    loadBalances();
  }, [address, token.address]);

  // 加载OKB价格
  useEffect(() => {
    const loadOKBPrice = async () => {
      try {
        const response = await tokenAPI.getOKBPrice();
        if (response.success) {
          setOkbPrice(parseFloat(response.data.price));
        }
      } catch (error) {
        console.error('Failed to load OKB price:', error);
      }
    };

    loadOKBPrice();
  }, []);

  // 监听交易成功，刷新授权状态
  useEffect(() => {
    if (isSuccess) {
      // 交易成功后刷新授权状态
      refetchOkbAllowanceBondingCurve();
      // 刷新余额
      refetchOkbBalance();
      
      // 延迟一下再刷新用户资产组合，确保链上数据已更新
      setTimeout(async () => {
        if (address) {
          try {
            // 重新获取用户资产组合
            const portfolioResponse = await userAPI.getUserPortfolio(address);
            setUserPortfolio(portfolioResponse);
            setOkbBalance(portfolioResponse.okb || '0');

            // 重新获取用户代币
            const tokensResponse = await userAPI.getUserTokens(address, 'sepolia');
            setUserTokens(tokensResponse);
            
            // 查找当前代币的余额
            const currentToken = tokensResponse.holding.find(
              (t: any) => t.address.toLowerCase() === token.address.toLowerCase()
            );
            if (currentToken) {
              setTokenBalance(currentToken.balance || '0');
            } else {
              setTokenBalance('0');
            }
          } catch (error) {
            console.error('Failed to refresh balances after transaction:', error);
          }
        }
      }, 2000); // 延迟2秒，等待链上数据更新
    }
  }, [isSuccess, address, token.address]); // 移除refetch函数依赖



  // 计算预估价格
  const calculateEstimatedPrice = () => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    
    // 使用真实的报价数据
    if (activeTab === 'buy') {
      return buyQuote?.tokensOut || 0;
    } else {
      return sellQuote?.okbOut || 0;
    }
  };

  // 计算预估代币数量
  const calculateEstimatedTokens = () => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    
    // 使用真实的报价数据
    if (activeTab === 'buy') {
      return buyQuote?.tokensOut || 0;
    } else {
      return sellQuote?.okbOut || 0;
    }
  };

  // 计算手续费
  const calculateFee = () => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    
    if (activeTab === 'buy') {
      return buyQuote?.fee || 0;
    } else {
      return sellQuote?.fee || 0;
    }
  };

  // 计算价格影响
  const calculatePriceImpact = () => {
    if (!amount || parseFloat(amount) <= 0 || currentPrice === 0) return 0;
    
    if (activeTab === 'buy' && buyQuote) {
      const priceChange = (buyQuote.priceAfter - currentPrice) / currentPrice * 100;
      return priceChange;
    } else if (activeTab === 'sell' && sellQuote) {
      const priceChange = (currentPrice - sellQuote.priceAfter) / currentPrice * 100;
      return priceChange;
    }
    
    return 0;
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

    console.log("=== HANDLE BUY DEBUG ===");
    console.log("OKB Amount:", okbAmount);
    console.log("OKB Allowance:", okbAllowanceBondingCurve);
    console.log("Needs approval:", okbAmount >= okbAllowanceBondingCurve);

    setIsLoading(true);
    try {
      // 检查是否需要授权
      if (okbAmount >= okbAllowanceBondingCurve) {
        console.log("Calling approveOKBForTrading...");
        // 需要授权，直接调用授权函数
        await approveOKBForTrading(okbAmount);
      } else {
        console.log("Calling buyToken...");
        // 直接买入
        await buyToken(token.address, okbAmount);
      }
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
      setAmount('');
    } catch (error) {
      console.error('Sell error:', error);
      toast.error('Failed to execute sell order');
    } finally {
      setIsLoading(false);
    }
  };

  // 快速金额按钮 - 根据买卖模式显示不同选项
  const getQuickAmounts = () => {
    if (activeTab === 'buy') {
      return ['0.1', '0.5', '1', 'Max'];
    } else {
      // 卖出模式：显示百分比
      return ['10%', '25%', '50%', 'Max'];
    }
  };

  const quickAmounts = getQuickAmounts();

  const setQuickAmount = (value: string) => {
    if (value === 'Max') {
      setAmount(activeTab === 'buy' ? okbBalance : tokenBalance);
    } else if (value.includes('%')) {
      // 处理百分比
      const percentage = parseFloat(value.replace('%', ''));
      const maxBalance = activeTab === 'buy' ? parseFloat(okbBalance) : parseFloat(tokenBalance);
      const calculatedAmount = (maxBalance * percentage) / 100;
      setAmount(calculatedAmount.toFixed(6));
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
      
      {/* 买入时显示授权额度 */}
      {activeTab === 'buy' && (
        <div className="flex items-center justify-between text-gray-400 mb-4">
          <span className="text-sm">OKB allowance:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm">
              {parseFloat(okbAllowanceBondingCurve.toString()).toFixed(6)} OKB
            </span>
            {parseFloat(amount || '0') >= okbAllowanceBondingCurve && (
              <span className="text-xs text-yellow-500">
                ⚠️ Insufficient allowance
              </span>
            )}
          </div>
        </div>
      )}

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
                    {buyQuote ? buyQuote.tokensOut.toFixed(6) : 'Calculating...'} {token.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee:</span>
                  <span className="text-yellow-500">
                    {buyQuote ? buyQuote.fee.toFixed(6) : '0.000000'} OKB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className="text-green-500">
                    {buyQuote ? `${calculatePriceImpact().toFixed(2)}%` : '~0.00%'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated OKB:</span>
                  <span className="text-white font-medium">
                    {sellQuote ? sellQuote.okbOut.toFixed(6) : 'Calculating...'} OKB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee:</span>
                  <span className="text-yellow-500">
                    {sellQuote ? sellQuote.fee.toFixed(6) : '0.000000'} {token.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className="text-red-500">
                    {sellQuote ? `${calculatePriceImpact().toFixed(2)}%` : '~0.00%'}
                  </span>
                </div>
              </>
            )}
          </div>
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
          parseFloat(amount || '0') >= okbAllowanceBondingCurve ? (
            <Shield className="h-4 w-4 mr-2" />
          ) : (
            <ArrowUp className="h-4 w-4 mr-2" />
          )
        ) : (
          <ArrowDown className="h-4 w-4 mr-2" />
        )}
        {isLoading || isPending 
          ? 'Processing...' 
          : activeTab === 'buy' && parseFloat(amount || '0') >= okbAllowanceBondingCurve
            ? 'Approve OKB'
            : `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
        }
      </Button>
    </div>
  );
}
