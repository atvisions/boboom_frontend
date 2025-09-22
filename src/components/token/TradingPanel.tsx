import { useState, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown, Zap, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTokenFactoryWorking as useTokenFactory } from '@/hooks/useTokenFactoryWorking';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast, toastMessages } from '@/components/ui/toast-notification';
import { userAPI, tokenAPI } from '@/services/api';
import { connectToUserBalance } from '@/services/websocket';

// TokenIcon 组件
interface TokenIconProps {
  isOKB: boolean;
  token: any;
  className?: string;
}

const TokenIcon = ({ isOKB, token, className = "w-6 h-6" }: TokenIconProps) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleFallbackError = () => {
    setFallbackError(true);
  };

  if (fallbackError || (imageError && isOKB)) {
    // 显示最终备用图标（文字）
    return (
      <div className={`${className} rounded-full bg-[#D7FE11] flex items-center justify-center`}>
        <span className="text-black text-xs font-bold">
          {isOKB ? 'O' : token.symbol?.charAt(0) || 'T'}
        </span>
      </div>
    );
  }

  if (imageError && isOKB) {
    // OKB PNG 失败，尝试 SVG 备用图标
    return (
      <div className={`${className} rounded-full overflow-hidden flex items-center justify-center bg-gray-800`}>
        <img
          src="/icons/okb-fallback.svg"
          alt="OKB"
          className="w-full h-full object-cover"
          onError={handleFallbackError}
        />
      </div>
    );
  }

  // 获取代币图标 URL
  const getTokenImageUrl = () => {
    if (isOKB) {
      return '/icons/okb.png';
    }

    // 优先使用 API 返回的图片 URL
    if (token.imageUrl) {
      // 如果是相对路径，添加后端域名
      if (token.imageUrl.startsWith('/media/')) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.boboom.fun';
        return `${backendUrl}${token.imageUrl}`;
      }
      // 如果已经是完整 URL，直接使用
      return token.imageUrl;
    }

    // 尝试根据代币符号查找本地图片
    const symbol = token.symbol?.toLowerCase();
    if (symbol) {
      return `/tokens/${symbol}.png`;
    }

    // 最后使用默认图标
    return '/tokens/default-token.svg';
  };

  return (
    <div className={`${className} rounded-full overflow-hidden flex items-center justify-center bg-gray-800`}>
      <img
        src={getTokenImageUrl()}
        alt={isOKB ? 'OKB' : token.symbol}
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
    </div>
  );
};

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
  const [lastTransactionType, setLastTransactionType] = useState<'buy' | 'sell' | 'approve' | null>(null);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState<boolean>(false);
  const [prevOkbBalance, setPrevOkbBalance] = useState<string>('0');
  const [prevTokenBalance, setPrevTokenBalance] = useState<string>('0');
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(true); // 初始为true，表示正在加载
  const [balanceLoadError, setBalanceLoadError] = useState<boolean>(false);
  
  // 报价状态
  const [buyQuote, setBuyQuote] = useState<any>(null);
  const [sellQuote, setSellQuote] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isInsufficientLiquidity, setIsInsufficientLiquidity] = useState<boolean>(false);

  const {
    okbBalance: okbBalanceChain,
    okbAllowanceBondingCurve,
    // 创建状态
    isCreatePending,
    isCreateConfirming,
    isCreateSuccess,
    // 授权状态
    isApprovalPending,
    isApprovalConfirming,
    isApprovalSuccess,
    // 交易状态
    isTradePending,
    isTradeConfirming,
    isTradeSuccess,
    tradeType,
    resetTradeState,
    approveOKBForTrading,
    buyToken,
    sellToken,
    refetchOkbAllowanceBondingCurve,
    refetchOkbBalance,
    getBuyQuote,
    getSellQuote,
    getCurrentPrice,
    getTokenBalance
  } = useTokenFactory();

  // 手动刷新余额函数
  const refreshBalances = useCallback(async () => {
    if (!address) return;

    // 使用 isRefreshingBalances 而不是 isLoadingBalances，避免影响初始加载状态
    setIsRefreshingBalances(true);
    try {
      // Manually refreshing balances

      // 并行刷新代币余额和OKB余额
      const [tokenBalance] = await Promise.all([
        getTokenBalance(token.address),
        refetchOkbBalance() // 这会触发okbBalanceChain更新，进而更新okbBalance
      ]);

      const tokenBalanceStr = tokenBalance.toString();

      setTokenBalance(tokenBalanceStr);
      // OKB余额会通过useEffect自动更新

      toast.success('Balances refreshed', { duration: 2000 });
    } catch (error) {

      toast.error('Failed to refresh balances');
    } finally {
      setIsRefreshingBalances(false);
    }
  }, [address, token.address, getTokenBalance, refetchOkbBalance]);

  // 加载当前价格
  useEffect(() => {
    const loadCurrentPrice = async () => {
      if (token?.address) {
        try {
          const price = await getCurrentPrice(token.address);
          setCurrentPrice(price);
        } catch (error) {

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
        setIsInsufficientLiquidity(false);
        return;
      }

      try {
        if (activeTab === 'buy') {
          const quote = await getBuyQuote(token.address, parseFloat(amount));
          if (quote) {
            setBuyQuote(quote);
            setSellQuote(null);
            setIsInsufficientLiquidity(false);
          } else {
            // 报价失败，可能是流动性不足
            setBuyQuote(null);
            setSellQuote(null);
            setIsInsufficientLiquidity(true);
          }
        } else {
          const quote = await getSellQuote(token.address, parseFloat(amount));
          if (quote) {
            setSellQuote(quote);
            setBuyQuote(null);
            setIsInsufficientLiquidity(false);
          } else {
            // 报价失败，可能是流动性不足
            setBuyQuote(null);
            setSellQuote(null);
            setIsInsufficientLiquidity(true);
          }
        }
      } catch (error) {

        setBuyQuote(null);
        setSellQuote(null);
        setIsInsufficientLiquidity(true);
      }
    };

    // 添加防抖，避免频繁调用
    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [amount, activeTab, token?.address]); // 移除getBuyQuote, getSellQuote依赖

  // 当切换买卖模式时清空报价和输入金额
  useEffect(() => {
    setBuyQuote(null);
    setSellQuote(null);
    setAmount(''); // 清空输入框
    setIsInsufficientLiquidity(false); // 重置流动性状态
  }, [activeTab]);

  // 监听授权成功，自动执行买入
  useEffect(() => {
    const handleApprovalSuccess = async () => {
      if (isApprovalSuccess && lastTransactionType === 'approve' && amount && parseFloat(amount) > 0) {
        setLastTransactionType('buy');
        setIsLoading(true); // 开始 loading
        try {
          await buyToken(token.address, parseFloat(amount));
          setAmount(''); // 买入成功后清空输入框

        } catch (error) {

          toast.error('Failed to execute buy order after approval');
          setLastTransactionType(null); // 重置交易类型
        } finally {
          setIsLoading(false); // 结束 loading
        }
      }
    };

    handleApprovalSuccess();
  }, [isApprovalSuccess, lastTransactionType, amount, token.address, buyToken]);

  // 监听买入/卖出成功，清空输入框
  useEffect(() => {
    if (isCreateSuccess && (lastTransactionType === 'buy' || lastTransactionType === 'sell')) {
      setAmount('');
      setLastTransactionType(null);
    }
  }, [isCreateSuccess, lastTransactionType]);

  // 同步链上OKB余额到本地状态
  useEffect(() => {
    // OKB balance chain updated
    if (okbBalanceChain !== undefined) {
      // okbBalanceChain 已经是格式化后的数字，不需要再用 formatEther
      const balanceStr = okbBalanceChain.toString();

      setOkbBalance(balanceStr);
    } else {

    }
  }, [okbBalanceChain]);

  // 加载代币余额 - 只在初始化时加载一次
  useEffect(() => {
    const loadTokenBalance = async () => {
      if (!address || !token.address) {
        setIsLoadingBalances(false);
        return;
      }

      try {

        const tokenBalance = await getTokenBalance(token.address);
        const tokenBalanceStr = tokenBalance.toString();

        setTokenBalance(tokenBalanceStr);
      } catch (error: any) {

        setTokenBalance('0'); // 设置默认值
      } finally {
        setIsLoadingBalances(false); // 无论成功还是失败都结束loading
      }
    };

    loadTokenBalance();
  }, [address, token.address]); // 移除 getTokenBalance 依赖，避免重复调用

  // 加载OKB价格
  useEffect(() => {
    const abortController = new AbortController();
    
    const loadOKBPrice = async () => {
      try {
        const response = await tokenAPI.getOKBPrice();
        if (abortController.signal.aborted) return;
        
        if (response.success) {
          setOkbPrice(parseFloat(response.data.price));
        }
      } catch (error: any) {
        // 忽略已取消的请求错误
        if (error.name === 'AbortError') return;

        // 显示用户友好的错误提示
        if (error.message && !error.message.includes('AbortError')) {
          toast.error('Failed to load OKB price', {
            description: 'Price information may be outdated',
            duration: 3000
          });
        }
      }
    };

    // 延迟加载，避免频繁切换时的重复请求
    const timeoutId = setTimeout(loadOKBPrice, 100);
    
    // 清理函数：取消未完成的请求和定时器
    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, []);

  // 监听交易成功，刷新授权状态并显示成功提示
  useEffect(() => {
    if (isCreateSuccess) {
      setIsRefreshingBalances(true);
      setPrevOkbBalance(okbBalance.toString());
      setPrevTokenBalance(tokenBalance.toString());
      if (lastTransactionType === 'buy') {
        toast.success(toastMessages.tokens.bought(token.symbol), { description: `Successfully purchased ${token.symbol} tokens`, duration: 4000 });
      } else if (lastTransactionType === 'sell') {
        toast.success(toastMessages.tokens.sold(token.symbol), { description: `Successfully sold ${token.symbol} tokens`, duration: 4000 });
      } else if (lastTransactionType === 'approve') {
        toast.success('OKB approval successful', { description: 'You can now proceed with your transaction', duration: 3000 });
      }
      setLastTransactionType(null);
      // 立即刷新授权状态
      (async () => {
        try {
          await Promise.all([refetchOkbAllowanceBondingCurve(), refetchOkbBalance()]);
        } catch (e) {
          // Silently handle refetch errors
        }
      })();
      // 简化的余额刷新 - 延迟刷新避免立即查询
      setTimeout(async () => {
        try {

          // 刷新代币余额
          const latestTokenBalance = await getTokenBalance(token.address);
          setTokenBalance(latestTokenBalance.toString());

          // 刷新OKB余额 (会通过useEffect自动更新显示)
          await refetchOkbBalance();

        } catch (error) {

        } finally {
          setIsRefreshingBalances(false);
        }
      }, 2000); // 2秒后刷新，给区块链时间确认
    }
  }, [isCreateSuccess, lastTransactionType, address, token.address, token.symbol]);

  // 监听交易成功，刷新余额
  useEffect(() => {
    if (isTradeSuccess && tradeType && address) {

      // 立即显示成功提示
      if (tradeType === 'buy') {
        toast.success(toastMessages.tokens.bought(token.symbol));
      } else if (tradeType === 'sell') {
        toast.success(toastMessages.tokens.sold(token.symbol));
      }

      // 立即重置交易状态，避免重复触发
      resetTradeState();

      // 立即尝试刷新价格（可能还没有更新，但值得尝试）
      getCurrentPrice(token.address).then(price => {
        setCurrentPrice(price);

      }).catch(err => {

      });

      // 延迟刷新余额和价格，给区块链时间确认
      setTimeout(async () => {
        try {

          const [latestTokenBalance, latestPrice] = await Promise.all([
            getTokenBalance(token.address),
            getCurrentPrice(token.address) // 刷新当前价格
          ]);

          // 刷新 OKB 余额（不需要等待返回值）
          refetchOkbBalance();

          setTokenBalance(latestTokenBalance.toString());
          setCurrentPrice(latestPrice);

        } catch (error) {

        }
      }, 3000); // 增加到3秒，给更多时间处理
    }
  }, [isTradeSuccess, tradeType, address, token.address, getTokenBalance, refetchOkbBalance, token.symbol, resetTradeState]);

  // WebSocket连接用于实时余额更新
  useEffect(() => {
    if (!address || !isAuthenticated) {
      return;
    }

    const handleBalanceUpdate = (data: any) => {
      if (data.type === 'balance_update') {
        const { user_address, token_address, okb_balance, token_balance } = data;

        // 检查是否是当前用户的更新
        if (user_address.toLowerCase() === address.toLowerCase()) {
          
          // 更新OKB余额
          if (okb_balance !== undefined) {
            setOkbBalance(okb_balance.toString());
          }
          
          // 更新代币余额（如果是当前代币）
          if (token_address && token_address.toLowerCase() === token.address.toLowerCase() && token_balance !== undefined) {
            setTokenBalance(token_balance.toString());
          }
          
          // 如果正在刷新余额，停止刷新状态
          if (isRefreshingBalances) {
            setIsRefreshingBalances(false);
          }
        }
      }
    };

    const connectionId = connectToUserBalance(address, handleBalanceUpdate);
    
    return () => {
      // 清理WebSocket连接
      // websocketService.disconnect(connectionId); // 如果需要的话可以添加断开连接的逻辑
    };
  }, [address, isAuthenticated, token.address, isRefreshingBalances]);

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

    setIsLoading(true); // 开始 loading

    try {
      // 检查是否需要授权
      if (okbAmount >= okbAllowanceBondingCurve) {
        setLastTransactionType('approve'); // 设置为授权类型
        // 需要授权，直接调用授权函数
        await approveOKBForTrading(okbAmount);
      } else {
        setLastTransactionType('buy'); // 设置为买入类型
        // 直接买入
        await buyToken(token.address, okbAmount);
        setAmount(''); // 买入成功后清空输入框
      }
    } catch (error) {

      setLastTransactionType(null); // 重置交易类型
      toast.error('Failed to execute buy order');
    } finally {
      setIsLoading(false); // 结束 loading
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

    setIsLoading(true); // 开始 loading
    setLastTransactionType('sell'); // 设置交易类型，用于成功时显示对应提示

    try {
      await sellToken(token.address, tokenAmount);
      setAmount(''); // 卖出成功后清空输入框

    } catch (error) {

      setLastTransactionType(null); // 重置交易类型
      toast.error('Failed to execute sell order');
    } finally {
      setIsLoading(false); // 结束 loading
    }
  };

  // 快速金额按钮 - 买卖模式都显示百分比选项
  const getQuickAmounts = () => {
    return ['10%', '25%', '50%', 'Max'];
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
              ? 'bg-[#D7FE11] text-black'
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

      {/* 余额显示 - 添加刷新按钮 */}
      <div className="flex items-center justify-between text-white mb-6">
        <span className="text-sm">balance:</span>
        <div className="flex items-center space-x-2">
          <span className="font-medium relative inline-block min-w-[160px] text-right">
            {isLoadingBalances ? (
              <span className="inline-block w-32 h-5 bg-gray-700/60 animate-pulse rounded text-transparent">
                0.000000 OKB
              </span>
            ) : (
              <>
                <span className={isRefreshingBalances ? 'opacity-0' : ''}>
                  {parseFloat(activeTab === 'buy' ? okbBalance : tokenBalance).toFixed(6)} {activeTab === 'buy' ? 'OKB' : token.symbol}
                </span>
                {isRefreshingBalances && (
                  <span className="absolute inset-0 rounded bg-gray-700/60 animate-pulse"></span>
                )}
              </>
            )}
          </span>
          <button
            onClick={refreshBalances}
            disabled={isLoadingBalances || isRefreshingBalances}
            className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh balances from blockchain"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshingBalances ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 输入框 - 增加高度，去掉Amount标签 */}
      <div className="mb-4">
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="bg-[#0a0a0a] border-[#333333] text-white pr-16 h-14 text-lg focus:border-[#D7FE11] focus:ring-[#D7FE11]/20 [appearance:none] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <span className="text-gray-400 text-sm">{activeTab === 'buy' ? 'OKB' : token.symbol}</span>
            <TokenIcon
              isOKB={activeTab === 'buy'}
              token={token}
              className="w-6 h-6"
            />
          </div>
        </div>
      </div>

      {/* 快速金额按钮（在刷新余额时禁用） */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAmount('')}
          disabled={isLoading || isCreatePending || isCreateConfirming || isApprovalPending || isApprovalConfirming || isTradePending || isTradeConfirming || isRefreshingBalances}
          className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </Button>
        {quickAmounts.map((value) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => setQuickAmount(value)}
            disabled={isLoading || isCreatePending || isCreateConfirming || isApprovalPending || isApprovalConfirming || isTradePending || isTradeConfirming || isRefreshingBalances}
            className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {value}
          </Button>
        ))}
      </div>

      {/* 预估信息 - 在有金额输入时始终显示，不因为授权而隐藏 */}
      {amount && parseFloat(amount) > 0 && (
        <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 mb-6">
          <div className="space-y-2">
            {activeTab === 'buy' ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated {token.symbol}:</span>
                  <span className="text-white font-medium text-right">
                    {buyQuote ? buyQuote.tokensOut.toFixed(6) : 'Calculating...'} {token.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee:</span>
                  <span className="text-yellow-500 text-right">
                    {buyQuote ? buyQuote.fee.toFixed(6) : '0.000000'} OKB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className="text-green-500 text-right">
                    {buyQuote ? `${calculatePriceImpact().toFixed(2)}%` : '~0.00%'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated OKB:</span>
                  <span className="text-white font-medium text-right">
                    {sellQuote ? sellQuote.okbOut.toFixed(6) : 'Calculating...'} OKB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee:</span>
                  <span className="text-yellow-500 text-right">
                    {sellQuote ? sellQuote.fee.toFixed(6) : '0.000000'} OKB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className="text-red-500 text-right">
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
        disabled={isLoading || isCreatePending || isCreateConfirming || isApprovalPending || isApprovalConfirming || isTradePending || isTradeConfirming || isRefreshingBalances || !amount || parseFloat(amount) <= 0 || isInsufficientLiquidity}
        className={`w-full py-3 font-medium ${
          activeTab === 'buy'
            ? 'bg-[#D7FE11] text-black hover:bg-[#5BC000]'
            : 'bg-red-500 text-white hover:bg-red-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading || isCreatePending || isCreateConfirming || isApprovalPending || isApprovalConfirming || isTradePending || isTradeConfirming || isRefreshingBalances ? (
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
        {isInsufficientLiquidity
          ? 'Insufficient Liquidity'
          : isLoading || isCreatePending || isCreateConfirming || isApprovalPending || isApprovalConfirming || isTradePending || isTradeConfirming || isRefreshingBalances
            ? 'Processing...'
            : activeTab === 'buy' && parseFloat(amount || '0') >= okbAllowanceBondingCurve
              ? 'Approve OKB'
              : `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
        }
      </Button>
    </div>
  );
}
