import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Zap, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTokenFactory } from '@/hooks/useTokenFactory';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast, toastMessages } from '@/components/ui/toast-notification';
import { userAPI, tokenAPI } from '@/services/api';
import { connectToUserBalance } from '@/services/websocket';

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
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  const [balanceLoadError, setBalanceLoadError] = useState<boolean>(false);
  
  // 报价状态
  const [buyQuote, setBuyQuote] = useState<any>(null);
  const [sellQuote, setSellQuote] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  const {
    okbBalance: okbBalanceChain,
    okbAllowanceBondingCurve,
    // 新状态：不再有 isPending/isConfirming/isSuccess，改用创建与授权通道
    isCreatePending,
    isCreateConfirming,
    isCreateSuccess,
    // 授权状态
    isApprovalPending,
    isApprovalConfirming,
    isApprovalSuccess,
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

  // 当切换买卖模式时清空报价和输入金额
  useEffect(() => {
    setBuyQuote(null);
    setSellQuote(null);
    setAmount(''); // 清空输入框
  }, [activeTab]);

  // 监听授权成功，自动执行买入
  useEffect(() => {
    const handleApprovalSuccess = async () => {
      if (isApprovalSuccess && lastTransactionType === 'approve' && amount && parseFloat(amount) > 0) {
        console.log('Approval successful, proceeding with buy...');
        setLastTransactionType('buy');
        try {
          await buyToken(token.address, parseFloat(amount));
          setAmount(''); // 买入成功后清空输入框
        } catch (error) {
          console.error('Buy after approval error:', error);
          toast.error('Failed to execute buy order after approval');
        }
        setLastTransactionType(null);
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

  // 加载用户余额
  useEffect(() => {
    const abortController = new AbortController();
    const loadBalances = async () => {
      if (!address) return;
      setIsLoadingBalances(true);
      try {
        let tokenFromChain = '0';
        try {
          const tokenBal = await getTokenBalance(token.address);
          tokenFromChain = tokenBal.toString();
        } catch (e) {
          console.warn('on-chain token balance read failed', e);
        }
        const okbFromChain = okbBalanceChain.toString();
        if (!abortController.signal.aborted) {
          setOkbBalance((prev: string) => (prev !== okbFromChain ? okbFromChain : prev));
          setTokenBalance((prev: string) => (prev !== tokenFromChain ? tokenFromChain : prev));
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Failed to load balances:', error);
          toast.error('Failed to load balances', { description: 'Please try refreshing the page', duration: 3000 });
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoadingBalances(false);
      }
    };
    const timeoutId = setTimeout(loadBalances, 50);
    return () => { clearTimeout(timeoutId); abortController.abort(); };
  }, [address, token.address, okbBalanceChain]);

  // 同步链上OKB余额到本地状态，保证展示与create页一致
  useEffect(() => {
    setOkbBalance((prev) => {
      const next = okbBalanceChain.toString();
      return prev !== next ? next : prev;
    });
  }, [okbBalanceChain]);

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
        
        console.error('Failed to load OKB price:', error);
        
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
      (async () => {
        try {
          await Promise.all([refetchOkbAllowanceBondingCurve(), refetchOkbBalance()]);
        } catch (e) { console.error('Refetch allowance/balance error:', e); }
      })();
      (async () => {
        const MAX_ATTEMPTS = 15; const SLEEP = (ms: number) => new Promise((r) => setTimeout(r, ms));
        let updated = false;
        for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
          try {
            if (!address) break;
            const [portfolioResponse, tokensResponse] = await Promise.all([userAPI.getUserPortfolio(address), userAPI.getUserTokens(address, 'sepolia')]);
            setUserPortfolio(portfolioResponse); setUserTokens(tokensResponse);
            const latestOkb = (portfolioResponse.okb || '0').toString(); setOkbBalance(latestOkb);
            const currentToken = tokensResponse.holding.find((t: any) => t.address.toLowerCase() === token.address.toLowerCase());
            const latestTokenBal = (currentToken ? currentToken.balance : '0') || '0'; setTokenBalance(latestTokenBal);
            const okbChanged = Math.abs(parseFloat(latestOkb) - parseFloat(prevOkbBalance || '0')) > 1e-9;
            const tokenChanged = Math.abs(parseFloat(latestTokenBal) - parseFloat(prevTokenBalance || '0')) > 1e-9;
            if (okbChanged || tokenChanged) { updated = true; break; }
          } catch (error) { console.error('Polling balance error:', error); }
          await SLEEP(1000);
        }
        if (!updated) { console.warn('Balance polling timeout, closing overlay as fallback'); }
        setIsRefreshingBalances(false);
      })();
    }
  }, [isCreateSuccess, lastTransactionType, address, token.address, token.symbol]);

  // WebSocket连接用于实时余额更新
  useEffect(() => {
    if (!address || !isAuthenticated) {
      return;
    }

    console.log('Setting up WebSocket connection for user balance updates:', address);
    
    const handleBalanceUpdate = (data: any) => {
      console.log('Received balance update:', data);
      
      if (data.type === 'balance_update') {
        const { user_address, token_address, okb_balance, token_balance } = data;
        
        // 检查是否是当前用户的更新
        if (user_address.toLowerCase() === address.toLowerCase()) {
          console.log('Updating balances from WebSocket:', { okb_balance, token_balance });
          
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

    console.log("=== HANDLE BUY DEBUG ===");
    console.log("OKB Amount:", okbAmount);
    console.log("OKB Allowance:", okbAllowanceBondingCurve);
    console.log("Needs approval:", okbAmount >= okbAllowanceBondingCurve);

    try {
      // 检查是否需要授权
      if (okbAmount >= okbAllowanceBondingCurve) {
        console.log("Calling approveOKBForTrading...");
        setLastTransactionType('approve'); // 设置为授权类型
        // 需要授权，直接调用授权函数
        await approveOKBForTrading(okbAmount);
      } else {
        console.log("Calling buyToken...");
        setLastTransactionType('buy'); // 设置为买入类型
        // 直接买入
        await buyToken(token.address, okbAmount);
      }
    } catch (error) {
      console.error('Buy error:', error);
      setLastTransactionType(null); // 重置交易类型
      toast.error('Failed to execute buy order');
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

    setLastTransactionType('sell'); // 设置交易类型，用于成功时显示对应提示
    
    try {
      await sellToken(token.address, tokenAmount);
    } catch (error) {
      console.error('Sell error:', error);
      setLastTransactionType(null); // 重置交易类型
      toast.error('Failed to execute sell order');
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

      {/* 余额显示 - 保持原设计，仅遮挡数值区域 */}
      <div className="flex items-center justify-between text-white mb-6">
        <span className="text-sm">balance:</span>
        <span className="font-medium relative inline-block min-w-[160px] text-right">
          {isLoadingBalances ? (
            <span className="inline-block w-24 h-6 bg-gray-700/60 animate-pulse rounded"></span>
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

      {/* 快速金额按钮（在刷新余额时禁用） */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAmount('')}
          disabled={isLoading || isCreatePending || isCreateConfirming || isApprovalPending || isApprovalConfirming || isRefreshingBalances}
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
            disabled={isLoading || isCreatePending || isCreateConfirming || isApprovalPending || isApprovalConfirming || isRefreshingBalances}
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
                    {sellQuote ? sellQuote.fee.toFixed(6) : '0.000000'} OKB
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
        disabled={isLoading || isCreatePending || isCreateConfirming || isApprovalPending || isApprovalConfirming || isRefreshingBalances || !amount || parseFloat(amount) <= 0}
        className={`w-full py-3 font-medium ${
          activeTab === 'buy'
            ? 'bg-[#70E000] text-black hover:bg-[#5BC000]'
            : 'bg-red-500 text-white hover:bg-red-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading || isCreatePending || isCreateConfirming || isApprovalPending || isApprovalConfirming || isRefreshingBalances ? (
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
        {isLoading || isCreatePending || isCreateConfirming || isApprovalPending || isApprovalConfirming || isRefreshingBalances
          ? 'Processing...'
          : activeTab === 'buy' && parseFloat(amount || '0') >= okbAllowanceBondingCurve
            ? 'Approve OKB'
            : `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
        }
      </Button>
    </div>
  );
}
