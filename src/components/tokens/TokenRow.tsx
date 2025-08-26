"use client";
import Link from "next/link";
import { Token } from "@/types/token";
import { useToggleFavorite, useFavoriteStatus } from "@/hooks/useFavorites";
import { useAccount } from "wagmi";
import { notifyInfo } from "@/lib/notify";
import { useCallback, useState } from "react";

interface TokenRowProps {
  token: Token;
}

function SocialIcon({ href, icon, label }: { href?: string; icon: React.ReactNode; label: string }) {
  if (!href) return null;
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
      title={label}
      onClick={(e) => e.stopPropagation()} // 防止触发父级链接
    >
      {icon}
    </a>
  );
}

function WebsiteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-.61.08-1.21.21-1.78L9.99 16v1c0 1.1.9 2 2 2v1.93C7.06 20.44 4 16.59 4 12zm13.89 5.4c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41C17.92 5.77 20 8.65 20 12c0 2.08-.81 3.98-2.11 5.4z" fill="currentColor"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="currentColor"/>
    </svg>
  );
}

export function TokenRow({ token }: TokenRowProps) {
  const avatarSrc = token.imageUrl || `https://avatar.vercel.sh/${token.address}.png?size=64`;
  const creatorAvatarSrc = `https://avatar.vercel.sh/${token.creator}.png?size=24`;
  
  // 计算时间显示
  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1h ago';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
  };

  // 收藏相关hooks
  const { address: userAddress } = useAccount();
  const [isClicking, setIsClicking] = useState(false);
  
  const { data: favoriteStatus, isLoading: favoriteLoading } = useFavoriteStatus(
    token.address,
    token.network || 'sepolia'
  );
  const toggleFavoriteMutation = useToggleFavorite();

  const isFavorited = favoriteStatus?.is_favorited || false;
  const isDisabled = favoriteLoading || toggleFavoriteMutation.isPending || isClicking;

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 防止连续点击
    if (isDisabled) {
      return;
    }
    
    if (!userAddress) {
      // 显示钱包连接提示 - 使用与其他功能一致的样式
      notifyInfo('Connect Wallet', 'Please connect your wallet to favorite tokens');
      return;
    }

    // 设置点击状态，防止重复点击
    setIsClicking(true);
    
    try {
      await toggleFavoriteMutation.mutateAsync({
        tokenAddress: token.address,
        network: token.network || 'sepolia',
      });
    } catch (error) {
      // 错误已在 useFavorites hook 中处理
    } finally {
      // 延迟重置点击状态，确保用户能看到反馈
      setTimeout(() => setIsClicking(false), 500);
    }
  }, [isDisabled, userAddress, toggleFavoriteMutation, token.address, token.network]);

  // 收藏图标组件
  const FavoriteIcon = () => (
    <button
      onClick={handleFavoriteClick}
      disabled={isDisabled}
      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
      title={
        !userAddress 
          ? "Connect wallet first" 
          : isFavorited 
            ? "Remove from favorites" 
            : "Add to favorites"
      }
    >
      {isDisabled ? (
        // 加载状态
        <div className="w-4 h-4 border-2 border-gray-400 border-t-yellow-400 rounded-full animate-spin" />
      ) : (
        // 收藏图标
        <svg 
          className={`w-4 h-4 transition-all duration-200 ${
            isFavorited 
              ? 'text-yellow-400 fill-current' 
              : userAddress
                ? 'text-gray-400 group-hover:text-yellow-400'
                : 'text-gray-600'
          }`} 
          viewBox="0 0 24 24" 
          fill={isFavorited ? "currentColor" : "none"}
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      )}
    </button>
  );

  // 获取区块链图标
  const getChainIcon = () => {
    return (
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <FavoriteIcon />
      </div>
    );
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(2);
  };

  // 获取阶段显示文本
  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'CREATED': return 'On Curve';
      case 'CURVE': return 'Trading';
      case 'GRADUATING': return 'Graduating';
      case 'GRADUATED': return 'Graduated';
      default: return phase;
    }
  };

  // 使用后端提供的 FDV
  const getFDV = () => {
    return Number(token.fdv || 0);
  };

  const priceChange = Number(token.priceChange24h || 0);
  const isNearGraduation = token.graduationProgress >= 80;

  // 获取进度条样式
  const getProgressBarClass = () => {
    if (isNearGraduation) {
      return "bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 h-1.5 rounded-full transition-all duration-500 animate-pulse shadow-lg shadow-yellow-500/50";
    }
    return "bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500";
  };

  return (
    <Link href={`/token/${token.address}`} className="block">
      <div className={`flex items-center p-4 md:p-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.01] hover:-translate-y-0.5 cursor-pointer group ${
        isNearGraduation ? 'ring-1 ring-yellow-500/30' : ''
      }`} style={{backgroundColor: '#17182D'}}>
      {/* 移动端：垂直布局 */}
      <div className="flex flex-col md:hidden w-full gap-4">
        {/* 顶部：Logo + 名称 + 收藏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img 
              src={avatarSrc} 
              alt={token.name} 
              className="w-12 h-12 rounded-xl bg-white/10 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = `https://avatar.vercel.sh/${token.address}.png?size=48`;
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-white truncate group-hover:text-blue-400 transition-colors">{token.name}</h3>
                <span className="text-xs text-gray-400">${token.symbol}</span>
              </div>
              <div className="text-sm font-semibold text-white">
                ${Number(token.currentPrice).toFixed(6)}
              </div>
            </div>
          </div>
          <FavoriteIcon />
        </div>

        {/* 价格变化和阶段 */}
        <div className="flex items-center justify-between">
          <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% (24h)
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isNearGraduation 
              ? 'bg-yellow-600/20 text-yellow-400' 
              : 'bg-blue-600/20 text-blue-400'
          }`}>
            {getPhaseText(token.phase)}
          </span>
        </div>

        {/* 进度条 */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-xs">Progress</span>
            <span className={`font-bold text-xs ${isNearGraduation ? 'text-yellow-400' : 'text-white'}`}>
              {Math.floor(token.graduationProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
            <div 
              className={getProgressBarClass()}
              style={{ width: `${Math.min(token.graduationProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* 统计数据网格 */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="text-center">
            <div className="text-gray-400">Market Cap</div>
            <div className="text-white font-semibold">${formatNumber(Number(token.marketCap))}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">FDV</div>
            <div className="text-white font-semibold">${formatNumber(getFDV())}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Holders</div>
            <div className="text-white font-semibold">{token.holderCount}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Txns</div>
            <div className="text-white font-semibold">{token.transactionCount}</div>
          </div>
        </div>

        {/* 底部：创建人和社交 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={creatorAvatarSrc} 
              alt="Creator" 
              className="w-4 h-4 rounded-full bg-white/10"
              onError={(e) => {
                e.currentTarget.src = `https://avatar.vercel.sh/${token.creator}.png?size=16`;
              }}
            />
            <span className="text-gray-300 text-xs font-mono">
              {token.creator.slice(0, 4)}...{token.creator.slice(-4)}
            </span>
            <span className="text-gray-500 text-xs">• {getTimeAgo(token.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <SocialIcon href={token.website} icon={<WebsiteIcon />} label="Website" />
            <SocialIcon href={token.twitter} icon={<TwitterIcon />} label="Twitter" />
            <SocialIcon href={token.telegram} icon={<TelegramIcon />} label="Telegram" />
          </div>
        </div>
      </div>

      {/* 桌面端：水平布局 */}
      <div className="hidden md:flex items-center w-full">
        {/* 左侧：Logo + 名称 + 价格 */}
        <div className="flex items-center gap-4 w-80 min-w-0">
          <div className="relative flex-shrink-0">
            <img 
              src={avatarSrc} 
              alt={token.name} 
              className="w-14 h-14 rounded-2xl bg-white/10 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = `https://avatar.vercel.sh/${token.address}.png?size=64`;
              }}
            />
            <div className="absolute -bottom-1 -right-1">
              <FavoriteIcon />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">{token.name}</h3>
              <span className="text-sm text-gray-400">${token.symbol}</span>
            </div>
            
            <div className="text-white font-semibold mb-1">
              ${Number(token.currentPrice).toFixed(6)}
            </div>
            
            <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% (24h)
            </div>
          </div>
        </div>
        
        {/* 中间：介绍和阶段 */}
        <div className="flex-1 px-6 min-w-0">
          {token.description && (
            <p className="text-gray-300 text-sm line-clamp-2 mb-2">{token.description}</p>
          )}
          
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isNearGraduation 
                ? 'bg-yellow-600/20 text-yellow-400' 
                : 'bg-blue-600/20 text-blue-400'
            }`}>
              {getPhaseText(token.phase)}
            </span>
            <div className="w-48 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-xs">Progress</span>
                <span className={`font-semibold text-xs ${isNearGraduation ? 'text-yellow-400' : 'text-white'}`}>
                  {Math.floor(token.graduationProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={getProgressBarClass()}
                  style={{ width: `${Math.min(token.graduationProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 右侧：统计数据并列显示 */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-right">
            <div className="text-gray-400 text-xs">Market Cap</div>
            <div className="text-white font-semibold">${formatNumber(Number(token.marketCap))}</div>
          </div>
          
          <div className="text-right">
            <div className="text-gray-400 text-xs">FDV</div>
            <div className="text-white font-semibold">${formatNumber(getFDV())}</div>
          </div>
          
          <div className="text-right">
            <div className="text-gray-400 text-xs">Holders</div>
            <div className="text-white font-semibold">{token.holderCount}</div>
          </div>
          
          <div className="text-right">
            <div className="text-gray-400 text-xs">Txns</div>
            <div className="text-white font-semibold">{token.transactionCount}</div>
          </div>
        </div>
        
        {/* 最右侧：创建人和社交图标 */}
        <div className="flex flex-col items-end gap-3 ml-6 w-32">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className="text-gray-400 text-xs font-mono">
                {token.creator.slice(0, 4)}...{token.creator.slice(-4)}
              </span>
              <img 
                src={creatorAvatarSrc} 
                alt="Creator" 
                className="w-5 h-5 rounded-full bg-white/10"
                onError={(e) => {
                  e.currentTarget.src = `https://avatar.vercel.sh/${token.creator}.png?size=24`;
                }}
              />
            </div>
            <div className="text-gray-500 text-xs">{getTimeAgo(token.createdAt)}</div>
          </div>
          
          <div className="flex items-center gap-1 justify-end">
            <SocialIcon href={token.website} icon={<WebsiteIcon />} label="Website" />
            <SocialIcon href={token.twitter} icon={<TwitterIcon />} label="Twitter" />
            <SocialIcon href={token.telegram} icon={<TelegramIcon />} label="Telegram" />
          </div>
        </div>
      </div>
      </div>
    </Link>
  );
}