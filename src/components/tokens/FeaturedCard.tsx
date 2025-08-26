"use client";
import Link from "next/link";
import { Token } from "@/types/token";
import { useToggleFavorite, useFavoriteStatus } from "@/hooks/useFavorites";
import { useAccount } from "wagmi";
import { notifyInfo } from "@/lib/notify";
import { useCallback, useState } from "react";

interface FeaturedCardProps {
  token: Token;
}

function SocialIcon({ href, icon, label }: { href?: string; icon: React.ReactNode; label: string }) {
  if (!href) return null;
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-gray-300 hover:text-white"
      title={label}
      onClick={(e) => e.stopPropagation()} // 防止触发父级链接
    >
      {icon}
    </a>
  );
}

function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="currentColor"/>
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-.61.08-1.21.21-1.78L9.99 16v1c0 1.1.9 2 2 2v1.93C7.06 20.44 4 16.59 4 12zm13.89 5.4c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41C17.92 5.77 20 8.65 20 12c0 2.08-.81 3.98-2.11 5.4z" fill="currentColor"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="currentColor"/>
    </svg>
  );
}

function ChainIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
      <span className="text-xs font-bold text-white">S</span>
    </div>
  );
}

export function FeaturedCard({ token }: FeaturedCardProps) {
  const avatarSrc = token.imageUrl || `https://avatar.vercel.sh/${token.address}.png?size=64`;
  const creatorAvatarSrc = `https://avatar.vercel.sh/${token.creator}.png?size=32`;
  const { address: userAddress } = useAccount();
  const isNearGraduation = token.graduationProgress >= 80;
  
  // 本地防重复点击状态
  const [isClicking, setIsClicking] = useState(false);

  // 获取收藏状态
  const { data: favoriteStatus, isLoading: favoriteLoading } = useFavoriteStatus(
    token.address,
    token.network || 'sepolia'
  );

  // 收藏切换mutation
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
  
  // 计算创建时间
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

  // 模拟24小时涨跌（基于毕业进度）
  const getPriceChange = () => {
    const change = (token.graduationProgress - 50) * 0.5; // 简单模拟
    return change;
  };

  const priceChange = getPriceChange();

  // 获取进度条样式
  const getProgressBarClass = () => {
    if (isNearGraduation) {
      return "bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 h-full rounded-full transition-all duration-500 animate-pulse shadow-lg shadow-yellow-500/50";
    }
    return "bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 shadow-sm";
  };

  return (
    <Link href={`/token/${token.address}`} className="block">
      <div 
        className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer group overflow-hidden ${
          isNearGraduation ? 'ring-1 ring-yellow-500/30' : ''
        }`}
        style={{backgroundColor: '#17182D'}}
      >
      {/* 背景装饰 */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${
        isNearGraduation ? 'from-yellow-500/10' : 'from-blue-500/10'
      } to-transparent rounded-full -translate-y-8 translate-x-8 opacity-50`} />
      
      {/* 头部：Logo + 名称 + 价格 + 收藏 */}
      <div className="relative z-10 flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img 
            src={avatarSrc} 
            alt={token.name} 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = `https://avatar.vercel.sh/${token.address}.png?size=48`;
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">{token.name}</h3>
              <span className="text-xs text-gray-400">${token.symbol}</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white">
              ${Number(token.currentPrice).toFixed(6)}
            </div>
            <div className={`text-xs font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% (24h)
            </div>
          </div>
        </div>
        <FavoriteIcon />
      </div>

      {/* 介绍 */}
      {token.description && (
        <div className="relative z-10 mb-3">
          <p className="text-gray-300 text-xs line-clamp-2 leading-relaxed">{token.description}</p>
        </div>
      )}

      {/* 阶段标签 + 进度条 */}
      <div className="relative z-10 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isNearGraduation 
              ? 'bg-yellow-600/20 text-yellow-400' 
              : 'bg-blue-600/20 text-blue-400'
          }`}>
            {getPhaseText(token.phase)}
          </span>
          <span className={`font-bold text-sm ${isNearGraduation ? 'text-yellow-400' : 'text-white'}`}>
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

      {/* 统计数据网格 - 移动端2列，桌面端3列 */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-gray-400 text-xs">Market Cap</div>
          <div className="text-white font-bold text-xs sm:text-sm">${formatNumber(Number(token.marketCap))}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-xs">FDV</div>
          <div className="text-white font-bold text-xs sm:text-sm">${formatNumber(Number(token.fdv || 0))}</div>
        </div>
        <div className="text-center col-span-2 sm:col-span-1">
          <div className="text-gray-400 text-xs">Holders</div>
          <div className="text-white font-bold text-xs sm:text-sm">{token.holderCount}</div>
        </div>
      </div>

      {/* 创建人信息 */}
      <div className="relative z-10 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={creatorAvatarSrc} 
              alt="Creator" 
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/10"
              onError={(e) => {
                e.currentTarget.src = `https://avatar.vercel.sh/${token.creator}.png?size=20`;
              }}
            />
            <span className="text-gray-300 text-xs font-mono">
              {token.creator.slice(0, 4)}...{token.creator.slice(-4)}
            </span>
          </div>
          <span className="text-gray-500 text-xs">{getTimeAgo(token.createdAt)}</span>
        </div>
      </div>

      {/* 社交媒体图标 */}
      <div className="relative z-10 flex items-center justify-center gap-2 pt-3 border-t border-white/10">
        <SocialIcon href={token.twitter} icon={<TwitterIcon />} label="Twitter" />
        <SocialIcon href={token.telegram} icon={<TelegramIcon />} label="Telegram" />
        <SocialIcon href={token.website} icon={<WebsiteIcon />} label="Website" />
        <SocialIcon href="#" icon={<DiscordIcon />} label="Discord" />
      </div>
      </div>
    </Link>
  );
}
