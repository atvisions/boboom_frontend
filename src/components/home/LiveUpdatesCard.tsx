"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import websocketService from "@/services/websocket";
import { userAPI } from "@/services/api";
import { formatDistanceToNow } from "date-fns";

type BuySellItem = { avatar: string; wallet: string; tokenLogo: string; tokenAddr: string; tokenAddress: string; userAddress: string; side: "Buy" | "Sell"; amount: string; coinName: string; tokenAmount: string };
type NewTokenItem = { tokenLogo: string; name: string; address: string; fullAddress: string; createdAgo: string; creatorAddress: string };
type WhaleItem = { tokenLogo: string; name: string; address: string; fullAddress: string; userAddress: string; amount: string };

// 移除默认数据，只显示真实的WebSocket数据

export function LiveUpdatesCard() {
  const router = useRouter();

  // 调试：组件加载时立即打印日志
  console.log('🎯 LiveUpdatesCard component loaded!');
  console.log('🎯 LiveUpdatesCard: About to define useEffect...');

  // WebSocket连接必须在useEffect中执行（客户端）
  console.log('🚀 Component loaded - service available:', !!websocketService);
  console.log('🚀 typeof window:', typeof window);

  // 测试useEffect是否执行
  useEffect(() => {
    console.log('🔥 SIMPLE useEffect EXECUTED! This should always show!');
    console.log('🔥 Window available:', typeof window !== 'undefined');
    console.log('🔥 WebSocket service:', !!websocketService);
    console.log('🔥 WebSocket URL from env:', process.env.NEXT_PUBLIC_WEBSOCKET_URL);

    if (typeof window !== 'undefined' && websocketService) {
      console.log('🔥 Attempting WebSocket connection...');

      const testConnection = websocketService.connect(
        'transactions/',
        (data) => {
          console.log('🎉 RECEIVED WebSocket data:', data);
          if (data.type === 'transaction_list') {
            console.log('📊 Initial transaction list received');
            handleTransactionData(data);
          } else if (data.type === 'transaction') {
            console.log('🎯 NEW TRANSACTION received:', data.data?.transaction_hash);
            handleTransactionData(data);
          }
        },
        (error) => {
          console.error('❌ WebSocket error:', error);
        },
        () => {
          console.log('🔌 WebSocket closed');
        }
      );

      console.log('🔥 WebSocket connection ID:', testConnection);

      return () => {
        console.log('🧹 Cleaning up WebSocket connection');
        if (testConnection) {
          websocketService.disconnect(testConnection);
        }
      };
    }
  }, []);

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);
  
  // WebSocket实时数据状态
  const [buys, setBuys] = useState<BuySellItem[]>([]);
  const [sells, setSells] = useState<BuySellItem[]>([]);
  const [news, setNews] = useState<NewTokenItem[]>([]);
  const [whales, setWhales] = useState<WhaleItem[]>([]);
  const [pulse, setPulse] = useState({ buy: false, sell: false, news: false, whale: false });
  const [userAvatars, setUserAvatars] = useState<{[key: string]: any}>({}); // 存储用户头像信息
  const [connectionIds, setConnectionIds] = useState<string[]>([]);
  
  // 动画状态
  const [isAnimating, setIsAnimating] = useState(false);

  // 加载用户头像信息
  const loadUserAvatar = useCallback(async (userAddress: string) => {
    // 使用函数式更新来避免依赖 userAvatars 状态
    setUserAvatars(prev => {
      if (prev[userAddress]) return prev; // 已经加载过了

      // 异步加载用户数据
      userAPI.getUser(userAddress.toLowerCase())
        .then(userData => {
          setUserAvatars(current => ({
            ...current,
            [userAddress]: userData
          }));
        })
        .catch(error => {
          console.error('Failed to load user avatar for:', userAddress, error);
          // 提供默认用户信息
          setUserAvatars(current => ({
            ...current,
            [userAddress]: {
              address: userAddress,
              username: `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`,
              avatar_url: '👤'
            }
          }));
        });

      return prev; // 返回当前状态，不做改变
    });
  }, []); // 移除 userAvatars 依赖

  // 渲染用户头像
  const renderUserAvatar = (userAddress: string) => {
    const userInfo = userAvatars[userAddress];

    const handleUserClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // 阻止事件冒泡到卡片点击
      // 跳转到用户主页
      window.open(`/profile/${userAddress}`, '_blank');
    };

    const avatarContent = () => {
      if (!userInfo) {
        return <span className="text-sm">👤</span>;
      }

      if (userInfo.avatar_url && userInfo.avatar_url.trim() !== '') {
        if (userInfo.avatar_url.startsWith('/media/')) {
          return (
            <Image
              src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}${userInfo.avatar_url}?t=${userInfo.updated_at || Date.now()}`}
              alt="User avatar"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
              unoptimized={true}
            />
          );
        } else {
          try {
            if (userInfo.avatar_url.includes('\\u')) {
              return <span className="text-sm">{JSON.parse(`"${userInfo.avatar_url}"`)}</span>;
            }
            if (userInfo.avatar_url.startsWith('\\u')) {
              return <span className="text-sm">{String.fromCodePoint(parseInt(userInfo.avatar_url.slice(2), 16))}</span>;
            }
            return <span className="text-sm">{userInfo.avatar_url}</span>;
          } catch (e) {
            return <span className="text-sm">{userInfo.avatar_url}</span>;
          }
        }
      }
      return <span className="text-sm">👤</span>;
    };

    return (
      <div
        className="cursor-pointer hover:scale-110 transition-transform duration-200 relative group"
        onClick={handleUserClick}
        title={`查看用户 ${formatWallet(userAddress)} 的主页`}
      >
        {avatarContent()}
        {/* 悬停提示 */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          查看用户主页
        </div>
      </div>
    );
  };

  // 格式化钱包地址
  const formatWallet = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 获取随机头像
  const getRandomAvatar = () => {
    const avatars = ["🧑‍🚀", "👨‍💻", "🧑‍🎨", "🤖", "🐶", "🦄", "🚀", "💎"];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  // 处理卡片点击跳转
  const handleCardClick = (tokenAddress: string) => {
    if (tokenAddress && tokenAddress !== "Unknown") {
      router.push(`/token/${tokenAddress}`);
    }
  };

  // 触发动画效果
  const triggerAnimation = (type: 'buy' | 'sell' | 'news' | 'whale') => {
    setIsAnimating(true);
    setPulse({ 
      buy: type === "buy", 
      sell: type === "sell", 
      news: type === "news", 
      whale: type === "whale" 
    });
    
    // 设置动画效果
    const rand = (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(2) + "px";
    document.documentElement.style.setProperty('--jx', rand(-20, 20));
    
    setTimeout(() => {
      setPulse({ buy: false, sell: false, news: false, whale: false });
      setIsAnimating(false);
    }, 400);
  };

  // 处理交易数据
  const handleTransactionData = useCallback((data: any) => {
    console.log('LiveUpdatesCard: Received transaction data:', data);
    console.log('LiveUpdatesCard: Data type:', typeof data, 'Keys:', Object.keys(data || {}));

    if (data.type === 'transaction') {
      // 单个交易更新
      const transaction = data.data;
      const item: BuySellItem = {
        avatar: getRandomAvatar(),
        wallet: formatWallet(transaction.user_address),
        tokenLogo: transaction.token_image_url || "", // 使用后端提供的代币logo
        tokenAddr: formatWallet(transaction.token_address),
        tokenAddress: transaction.token_address, // 保存完整的代币地址用于跳转
        userAddress: transaction.user_address, // 保存完整的用户地址用于头像加载
        side: transaction.transaction_type === 'BUY' ? 'Buy' : 'Sell',
        amount: `$${parseFloat(transaction.usd_amount || transaction.okb_amount || '0').toFixed(2)}`,
        coinName: transaction.token_symbol || 'Unknown',
        tokenAmount: `${parseFloat(transaction.token_amount || '0').toFixed(4)} ${transaction.token_symbol || ''}`
      };

      if (item.side === 'Buy') {
        setBuys([item]); // 只显示最新的买入交易
        triggerAnimation('buy');
      } else {
        setSells([item]); // 只显示最新的卖出交易
        triggerAnimation('sell');
      }
      
      // 加载用户头像信息
      loadUserAvatar(transaction.user_address);
      
      // 标记已收到真实数据
      console.log('LiveUpdatesCard: Setting hasRealData to true and isLoading to false (single transaction)');
      setHasRealData(true);
      setIsLoading(false);
    } else if (data.type === 'transaction_list') {
      // 初始交易列表数据
      const transactions = data.data || [];
      console.log('LiveUpdatesCard: Processing transaction list:', transactions.length, 'transactions');
      
      if (transactions.length > 0) {
        // 分别处理买入和卖出交易
        const buyTransactions = transactions.filter(t => t.transaction_type === 'BUY');
        const sellTransactions = transactions.filter(t => t.transaction_type === 'SELL');

        console.log('LiveUpdatesCard: Buy transactions:', buyTransactions.length);
        console.log('LiveUpdatesCard: Sell transactions:', sellTransactions.length);

        // 处理买入交易
        if (buyTransactions.length > 0) {
          const latestBuy = buyTransactions[0];
          const buyItem: BuySellItem = {
            avatar: getRandomAvatar(),
            wallet: formatWallet(latestBuy.user_address),
            tokenLogo: latestBuy.token_image_url || "",
            tokenAddr: formatWallet(latestBuy.token_address),
            tokenAddress: latestBuy.token_address,
            userAddress: latestBuy.user_address,
            side: 'Buy',
            amount: `$${parseFloat(latestBuy.usd_amount || latestBuy.okb_amount || '0').toFixed(2)}`,
            coinName: latestBuy.token_symbol || 'Unknown',
            tokenAmount: `${parseFloat(latestBuy.token_amount || '0').toFixed(4)} ${latestBuy.token_symbol || ''}`
          };
          setBuys([buyItem]);
          loadUserAvatar(latestBuy.user_address);
        }
        
        // 处理卖出交易
        if (sellTransactions.length > 0) {
          const latestSell = sellTransactions[0];
          const sellItem: BuySellItem = {
            avatar: getRandomAvatar(),
            wallet: formatWallet(latestSell.user_address),
            tokenLogo: latestSell.token_image_url || "",
            tokenAddr: formatWallet(latestSell.token_address),
            tokenAddress: latestSell.token_address,
            userAddress: latestSell.user_address,
            side: 'Sell',
            amount: `$${parseFloat(latestSell.usd_amount || latestSell.okb_amount || '0').toFixed(2)}`,
            coinName: latestSell.token_symbol || 'Unknown',
            tokenAmount: `${parseFloat(latestSell.token_amount || '0').toFixed(4)} ${latestSell.token_symbol || ''}`
          };
          setSells([sellItem]);
          loadUserAvatar(latestSell.user_address);
        }
        
        // 标记已收到真实数据
        console.log('LiveUpdatesCard: Setting hasRealData to true and isLoading to false (transaction list)');
        setHasRealData(true);
        setIsLoading(false);
      }
    }
  }, [loadUserAvatar]);

  // 处理新代币数据
  const handleNewTokenData = useCallback((data: any) => {
    console.log('LiveUpdatesCard: Received new token data:', data);
    if (data.type === 'new_token') {
      // 单个新代币更新
      const tokenData = data.data;
      const item: NewTokenItem = {
        tokenLogo: tokenData.image_url || "", // 使用后端提供的代币logo
        name: tokenData.name || 'New Token',
        address: formatWallet(tokenData.address),
        fullAddress: tokenData.address, // 保存完整的代币地址用于跳转
        createdAgo: formatDistanceToNow(new Date(tokenData.created_at || Date.now()), { addSuffix: true }),
        creatorAddress: tokenData.creator || '' // 保存创建者地址
      };

      setNews([item]);
      triggerAnimation('news');

      // 加载创建者头像信息
      if (item.creatorAddress) {
        loadUserAvatar(item.creatorAddress);
      }

      // 标记已收到真实数据
      setHasRealData(true);
      setIsLoading(false);
    } else if (data.type === 'new_token_list') {
      // 初始新代币列表数据
      const tokens = data.data || [];
      if (tokens.length > 0) {
        // 取最新的代币作为显示
        const latestToken = tokens[0];
        const item: NewTokenItem = {
          tokenLogo: latestToken.image_url || "", // 使用后端提供的代币logo
          name: latestToken.name || 'New Token',
          address: formatWallet(latestToken.address),
          fullAddress: latestToken.address, // 保存完整的代币地址用于跳转
          createdAgo: formatDistanceToNow(new Date(latestToken.created_at || Date.now()), { addSuffix: true }),
          creatorAddress: latestToken.creator || '' // 保存创建者地址
        };
        setNews([item]);

        // 加载创建者头像信息
        if (item.creatorAddress) {
          loadUserAvatar(item.creatorAddress);
        }

        // 标记已收到真实数据
        setHasRealData(true);
        setIsLoading(false);
      }
    }
  }, []);

  // 处理巨鲸交易数据
  const handleWhaleTradeData = useCallback((data: any) => {
    console.log('LiveUpdatesCard: Received whale trade data:', data);
    if (data.type === 'whale_transaction') {
      // 单个巨鲸交易更新
      const transaction = data.data;
      const item: WhaleItem = {
        tokenLogo: transaction.token_image_url || "", // 使用后端提供的代币logo
        name: transaction.token_symbol || 'Whale Token',
        address: formatWallet(transaction.token_address),
        fullAddress: transaction.token_address, // 保存完整的代币地址用于跳转
        userAddress: transaction.user_address, // 保存完整的用户地址用于头像加载
        amount: `$${parseFloat(transaction.usd_amount || transaction.okb_amount || '0').toFixed(2)}`
      };

      setWhales([item]);
      triggerAnimation('whale');
      
      // 加载用户头像信息
      loadUserAvatar(transaction.user_address);
      
      // 标记已收到真实数据
      if (!hasRealData) {
        setHasRealData(true);
        setIsLoading(false);
      }
    } else if (data.type === 'whale_transaction_list') {
      // 初始巨鲸交易列表数据
      const transactions = data.data || [];
      if (transactions.length > 0) {
        // 取最新的巨鲸交易作为显示
        const latestTransaction = transactions[0];
        const item: WhaleItem = {
          tokenLogo: latestTransaction.token_image_url || "", // 使用后端提供的代币logo
          name: latestTransaction.token_symbol || 'Whale Token',
          address: formatWallet(latestTransaction.token_address),
          fullAddress: latestTransaction.token_address, // 保存完整的代币地址用于跳转
          userAddress: latestTransaction.user_address, // 保存完整的用户地址用于头像加载
          amount: `$${parseFloat(latestTransaction.usd_amount || latestTransaction.okb_amount || '0').toFixed(2)}`
        };
        setWhales([item]);

        // 加载用户头像信息
        loadUserAvatar(latestTransaction.user_address);

        // 标记已收到真实数据
        setHasRealData(true);
        setIsLoading(false);
      }
    }
  }, [loadUserAvatar]);

  useEffect(() => {
    // 连接到WebSocket端点
    console.log('🚀 LiveUpdatesCard: useEffect triggered, connecting to WebSocket endpoints...');
    console.log('🚀 LiveUpdatesCard: WebSocket service:', websocketService);
    console.log('🚀 LiveUpdatesCard: Current time:', new Date().toISOString());

    let isComponentMounted = true;
    let connectionIds: string[] = [];

    // 内部处理函数，避免依赖项问题
    const internalHandleTransactionData = (data: any) => {
      if (!isComponentMounted) return;
      handleTransactionData(data);
    };

    const internalHandleNewTokenData = (data: any) => {
      if (!isComponentMounted) return;
      handleNewTokenData(data);
    };

    const internalHandleWhaleTradeData = (data: any) => {
      if (!isComponentMounted) return;
      handleWhaleTradeData(data);
    };

    // 直接连接，不使用延迟
    console.log('🚀 LiveUpdatesCard: Starting WebSocket connections...');

    const transactionConnectionId = websocketService.connect(
      'transactions/',
      internalHandleTransactionData,
      (error) => {
        console.error('LiveUpdatesCard: Transaction WebSocket error:', error);
      },
      () => {
        console.log('LiveUpdatesCard: Transaction WebSocket closed');
      }
    );

    const newTokenConnectionId = websocketService.connect(
      'tokens/new/',
      internalHandleNewTokenData,
      (error) => {
        console.error('LiveUpdatesCard: New token WebSocket error:', error);
      },
      () => {
        console.log('LiveUpdatesCard: New token WebSocket closed');
      }
    );

    const whaleConnectionId = websocketService.connect(
      'transactions/whale/',
      internalHandleWhaleTradeData,
      (error) => {
        console.error('LiveUpdatesCard: Whale WebSocket error:', error);
      },
      () => {
        console.log('LiveUpdatesCard: Whale WebSocket closed');
      }
    );

    connectionIds = [transactionConnectionId, newTokenConnectionId, whaleConnectionId];

    console.log('🚀 LiveUpdatesCard: WebSocket connection IDs:', {
      transaction: transactionConnectionId,
      newToken: newTokenConnectionId,
      whale: whaleConnectionId
    });

    if (isComponentMounted) {
      setConnectionIds(connectionIds);
    }

    // 设置超时，如果10秒内没有收到真实数据，则停止加载状态
    const fallbackTimeout = setTimeout(() => {
      if (isComponentMounted && !hasRealData) {
        console.log('WebSocket连接超时，停止加载状态');
        setIsLoading(false);
      }
    }, 10000);

    // 清理函数
    return () => {
      isComponentMounted = false;
      clearTimeout(fallbackTimeout);

      // 断开所有连接
      connectionIds.forEach(id => {
        if (id) {
          websocketService.disconnect(id);
        }
      });
    };
  }, []); // 移除依赖项，避免useEffect重复执行

  // 如果没有真实数据或者所有数据都为空，显示骨架图
  console.log('🔍 LiveUpdatesCard: Render check - hasRealData:', hasRealData, 'buys:', buys.length, 'sells:', sells.length, 'news:', news.length, 'whales:', whales.length);
  console.log('🔍 LiveUpdatesCard: Component is rendering at', new Date().toISOString());

  if (buys.length === 0 && sells.length === 0 && news.length === 0 && whales.length === 0) {
    return (
      <div className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>

        <div className="flex gap-6 py-6 px-2 overflow-x-auto">
          {/* 加载骨架屏 - 4种不同颜色的卡片类型 */}
          {[
            { color: 'emerald', label: 'Live Buy' },
            { color: 'red', label: 'Live Sell' },
            { color: 'blue', label: 'New Token' },
            { color: 'purple', label: 'Whale Alert' }
          ].map((cardType, i) => (
            <div key={i} className={`relative w-80 rounded-2xl p-6 backdrop-blur-sm border flex-shrink-0 animate-pulse ${
              cardType.color === 'emerald' ? 'bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-green-900/50 border-emerald-500/20' :
              cardType.color === 'red' ? 'bg-gradient-to-br from-red-900/40 via-red-800/30 to-rose-900/50 border-red-500/20' :
              cardType.color === 'blue' ? 'bg-gradient-to-br from-blue-900/40 via-indigo-800/30 to-purple-900/50 border-blue-500/20' :
              'bg-gradient-to-br from-purple-900/40 via-violet-800/30 to-fuchsia-900/50 border-purple-500/20'
            }`}>
              {/* 发光效果骨架 */}
              <div className={`absolute inset-0 rounded-2xl opacity-30 ${
                cardType.color === 'emerald' ? 'bg-gradient-to-r from-emerald-400/20 to-green-400/20' :
                cardType.color === 'red' ? 'bg-gradient-to-r from-red-400/20 to-rose-400/20' :
                cardType.color === 'blue' ? 'bg-gradient-to-r from-blue-400/20 to-indigo-400/20' :
                'bg-gradient-to-r from-purple-400/20 to-violet-400/20'
              }`}></div>

              {/* 点击提示骨架 */}
              <div className="absolute top-2 right-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  cardType.color === 'emerald' ? 'bg-emerald-400/50' :
                  cardType.color === 'red' ? 'bg-red-400/50' :
                  cardType.color === 'blue' ? 'bg-blue-400/50' :
                  'bg-purple-400/50'
                }`}></div>
              </div>

              {/* 顶部状态指示器骨架 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    cardType.color === 'emerald' ? 'bg-emerald-400/50' :
                    cardType.color === 'red' ? 'bg-red-400/50' :
                    cardType.color === 'blue' ? 'bg-blue-400/50' :
                    'bg-purple-400/50'
                  }`}></div>
                  <div className={`h-3 rounded w-20 ${
                    cardType.color === 'emerald' ? 'bg-emerald-300/30' :
                    cardType.color === 'red' ? 'bg-red-300/30' :
                    cardType.color === 'blue' ? 'bg-blue-300/30' :
                    'bg-purple-300/30'
                  }`}></div>
                </div>
                <div className={`w-5 h-5 rounded animate-bounce ${
                  cardType.color === 'emerald' ? 'bg-emerald-400/50' :
                  cardType.color === 'red' ? 'bg-red-400/50' :
                  cardType.color === 'blue' ? 'bg-blue-400/50' :
                  'bg-purple-400/50'
                }`}></div>
              </div>

              <div className="flex items-center space-x-4">
                {/* 左侧代币图标骨架（主要显示） */}
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl ring-4 shadow-lg ${
                    cardType.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500/50 to-green-600/50 ring-emerald-400/30' :
                    cardType.color === 'red' ? 'bg-gradient-to-br from-red-500/50 to-rose-600/50 ring-red-400/30' :
                    cardType.color === 'blue' ? 'bg-gradient-to-br from-blue-500/50 to-indigo-600/50 ring-blue-400/30' :
                    'bg-gradient-to-br from-purple-500/50 to-violet-600/50 ring-purple-400/30'
                  }`}></div>
                  {/* 操作人头像覆盖层骨架（右下角） */}
                  <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 border-2 ${
                    cardType.color === 'emerald' ? 'border-emerald-400/50' :
                    cardType.color === 'red' ? 'border-red-400/50' :
                    cardType.color === 'blue' ? 'border-blue-400/50' :
                    'border-purple-400/50'
                  }`}></div>
                </div>

                {/* 右侧信息区域骨架 */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-white/20 rounded w-20"></div>
                    <div className={`h-6 rounded-full w-16 ${
                      cardType.color === 'emerald' ? 'bg-emerald-500/50' :
                      cardType.color === 'red' ? 'bg-red-500/50' :
                      cardType.color === 'blue' ? 'bg-blue-500/50' :
                      'bg-purple-500/50'
                    }`}></div>
                  </div>
                  <div className={`h-4 rounded w-24 ${
                    cardType.color === 'emerald' ? 'bg-emerald-200/30' :
                    cardType.color === 'red' ? 'bg-red-200/30' :
                    cardType.color === 'blue' ? 'bg-blue-200/30' :
                    'bg-purple-200/30'
                  }`}></div>
                  <div className="h-3 bg-white/20 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
      
      <div className="flex gap-6 py-6 px-2 overflow-x-auto">
        {/* 买入卡片 */}
        {buys.length > 0 && (
        <div 
          className={`relative w-80 rounded-2xl p-6 bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-green-900/50 backdrop-blur-sm border border-emerald-500/20 cursor-pointer hover:scale-105 transition-all duration-300 ${pulse.buy ? 'jitter-on' : ''} ${isAnimating && pulse.buy ? 'animate-pulse' : ''} fade-in group flex-shrink-0`}
          onClick={() => handleCardClick(buys[0].tokenAddress)}
        >
          {/* 发光效果 */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* 点击提示 */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
          
          {/* 顶部状态指示器 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-300 text-xs font-medium uppercase tracking-wider">Live Buy</span>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400 animate-bounce" />
          </div>

          <div className="flex items-center space-x-4">
            {/* 左侧代币图标（主要显示） */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center ring-4 ring-emerald-400/30 shadow-lg overflow-hidden">
                {buys[0].tokenLogo ? (
                  <img 
                    src={buys[0].tokenLogo} 
                    alt={buys[0].coinName}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      // 如果图片加载失败，显示代币名称
                      const target = e.currentTarget as HTMLImageElement;
                      const nextElement = target.nextElementSibling as HTMLElement;
                      target.style.display = 'none';
                      if (nextElement) nextElement.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className="text-2xl font-bold text-white" style={{ display: buys[0].tokenLogo ? 'none' : 'flex' }}>
                  {buys[0].coinName?.slice(0, 2) || "??"}
                </span>
              </div>
              {/* 操作人头像覆盖层（右下角） */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 border-2 border-emerald-400 flex items-center justify-center overflow-hidden">
                {renderUserAvatar(buys[0].userAddress)}
              </div>
            </div>

            {/* 右侧信息区域 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm truncate">{buys[0].wallet}</span>
                <div className="bg-emerald-500 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  BOUGHT
                </div>
              </div>
              <div className="text-emerald-200 text-sm font-medium">{buys[0].tokenAmount}</div>
              <div className="text-white/70 text-xs">{buys[0].coinName}</div>
            </div>
          </div>
        </div>)}

        {/* 卖出卡片 */}
        {sells.length > 0 && (
        <div 
          className={`relative w-80 rounded-2xl p-6 bg-gradient-to-br from-red-900/40 via-red-800/30 to-rose-900/50 backdrop-blur-sm border border-red-500/20 cursor-pointer hover:scale-105 transition-all duration-300 ${pulse.sell ? 'jitter-on' : ''} ${isAnimating && pulse.sell ? 'animate-pulse' : ''} fade-in group flex-shrink-0`}
          onClick={() => handleCardClick(sells[0].tokenAddress)}
        >
          {/* 发光效果 */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400/20 to-rose-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* 点击提示 */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          </div>
          
          {/* 顶部状态指示器 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-red-300 text-xs font-medium uppercase tracking-wider">Live Sell</span>
            </div>
            <TrendingDown className="w-5 h-5 text-red-400 animate-bounce" />
          </div>

          <div className="flex items-center space-x-4">
            {/* 左侧代币图标（主要显示） */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center ring-4 ring-red-400/30 shadow-lg overflow-hidden">
                {sells[0].tokenLogo ? (
                  <img 
                    src={sells[0].tokenLogo} 
                    alt={sells[0].coinName}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      // 如果图片加载失败，显示代币名称
                      const target = e.currentTarget as HTMLImageElement;
                      const nextElement = target.nextElementSibling as HTMLElement;
                      target.style.display = 'none';
                      if (nextElement) nextElement.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className="text-2xl font-bold text-white" style={{ display: sells[0].tokenLogo ? 'none' : 'flex' }}>
                  {sells[0].coinName?.slice(0, 2) || "??"}
                </span>
              </div>
              {/* 操作人头像覆盖层（右下角） */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 border-2 border-red-400 flex items-center justify-center overflow-hidden">
                {renderUserAvatar(sells[0].userAddress)}
              </div>
            </div>

            {/* 右侧信息区域 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm truncate">{sells[0].wallet}</span>
                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  SOLD
                </div>
              </div>
              <div className="text-red-200 text-sm font-medium">{sells[0].tokenAmount}</div>
              <div className="text-white/70 text-xs">{sells[0].coinName}</div>
            </div>
          </div>
        </div>)}

        {/* 新代币卡片 */}
        {news.length > 0 && (
        <div 
          className={`relative w-80 rounded-2xl p-6 bg-gradient-to-br from-blue-900/40 via-indigo-800/30 to-purple-900/50 backdrop-blur-sm border border-blue-500/20 cursor-pointer hover:scale-105 transition-all duration-300 ${pulse.news ? 'jitter-on' : ''} ${isAnimating && pulse.news ? 'animate-pulse' : ''} fade-in group flex-shrink-0`}
          onClick={() => handleCardClick(news[0].fullAddress)}
        >
          {/* 发光效果 */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* 点击提示 */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
          
          {/* 顶部状态指示器 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-300 text-xs font-medium uppercase tracking-wider">New Token</span>
            </div>
            <Zap className="w-5 h-5 text-blue-400 animate-bounce" />
          </div>

          <div className="flex items-center space-x-4">
            {/* 左侧代币图标（主要显示） */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-4 ring-blue-400/30 shadow-lg overflow-hidden">
                {news[0].tokenLogo ? (
                  <img 
                    src={news[0].tokenLogo} 
                    alt={news[0].name}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      // 如果图片加载失败，显示代币名称
                      const target = e.currentTarget as HTMLImageElement;
                      const nextElement = target.nextElementSibling as HTMLElement;
                      target.style.display = 'none';
                      if (nextElement) nextElement.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className="text-2xl font-bold text-white" style={{ display: news[0].tokenLogo ? 'none' : 'flex' }}>
                  {news[0].name?.slice(0, 2) || "??"}
                </span>
              </div>
              {/* 创建者头像覆盖层（右下角） */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 border-2 border-blue-400 flex items-center justify-center overflow-hidden">
                {news[0].creatorAddress ? renderUserAvatar(news[0].creatorAddress) : <span className="text-xs font-bold text-white">NEW</span>}
              </div>
            </div>

            {/* 右侧信息区域 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm truncate">{news[0].name}</span>
                <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  LAUNCHED
                </div>
              </div>
              <div className="text-blue-200 text-sm font-medium">{news[0].address}</div>
              <div className="text-white/70 text-xs">{news[0].createdAgo}</div>
            </div>
          </div>
        </div>)}

        {/* 巨鲸交易卡片 */}
        {whales.length > 0 && (
        <div 
          className={`relative w-80 rounded-2xl p-6 bg-gradient-to-br from-purple-900/40 via-violet-800/30 to-fuchsia-900/50 backdrop-blur-sm border border-purple-500/20 cursor-pointer hover:scale-105 transition-all duration-300 ${pulse.whale ? 'jitter-on' : ''} ${isAnimating && pulse.whale ? 'animate-pulse' : ''} fade-in group flex-shrink-0`}
          onClick={() => handleCardClick(whales[0].fullAddress)}
        >
          {/* 发光效果 */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-violet-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* 点击提示 */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
          
          {/* 顶部状态指示器 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-purple-300 text-xs font-medium uppercase tracking-wider">Whale Alert</span>
            </div>
            <Zap className="w-5 h-5 text-purple-400 animate-bounce" />
          </div>

          <div className="flex items-center space-x-4">
            {/* 左侧代币图标（主要显示） */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center ring-4 ring-purple-400/30 shadow-lg overflow-hidden">
                {whales[0].tokenLogo ? (
                  <img 
                    src={whales[0].tokenLogo} 
                    alt={whales[0].name}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      // 如果图片加载失败，显示代币名称
                      const target = e.currentTarget as HTMLImageElement;
                      const nextElement = target.nextElementSibling as HTMLElement;
                      target.style.display = 'none';
                      if (nextElement) nextElement.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className="text-2xl font-bold text-white" style={{ display: whales[0].tokenLogo ? 'none' : 'flex' }}>
                  {whales[0].name?.slice(0, 2) || "??"}
                </span>
              </div>
              {/* 操作人头像覆盖层（右下角） */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 border-2 border-purple-400 flex items-center justify-center overflow-hidden">
                {renderUserAvatar(whales[0].userAddress)}
              </div>
            </div>

            {/* 右侧信息区域 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm truncate">{whales[0].name}</span>
                <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  WHALE
                </div>
              </div>
              <div className="text-purple-200 text-sm font-medium">{whales[0].amount}</div>
              <div className="text-white/70 text-xs">{whales[0].address}</div>
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
