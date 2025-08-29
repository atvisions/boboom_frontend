"use client";
import Link from "next/link";
import { Token } from "@/types/token";
import { useToggleFavorite, useFavoriteStatus } from "@/hooks/useFavorites";
import { useAccount } from "wagmi";
import { notifyInfo } from "@/lib/notify";
import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
      className="h-8 w-8 p-0 hover:bg-white/10 text-gray-300 hover:text-white rounded-md flex items-center justify-center transition-colors"
      title={label}
      onClick={(e) => {
        e.stopPropagation();
      }}
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
    
    if (isDisabled) return;
    
    if (!userAddress) {
      notifyInfo('Connect Wallet', 'Please connect your wallet to favorite tokens');
      return;
    }

    setIsClicking(true);
    
    try {
      await toggleFavoriteMutation.mutateAsync({
        tokenAddress: token.address,
        network: token.network || 'sepolia',
      });
    } catch (error) {
      // 错误已在 useFavorites hook 中处理
    } finally {
      setTimeout(() => setIsClicking(false), 500);
    }
  }, [isDisabled, userAddress, toggleFavoriteMutation, token.address, token.network]);

  const FavoriteIcon = () => (
    <Button
      onClick={handleFavoriteClick}
      disabled={isDisabled}
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-white/10 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
      title={
        !userAddress 
          ? "Connect wallet first" 
          : isFavorited 
            ? "Remove from favorites" 
            : "Add to favorites"
      }
    >
      {isDisabled ? (
        <div className="w-4 h-4 border-2 border-gray-400 border-t-yellow-400 rounded-full animate-spin" />
      ) : (
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
    </Button>
  );

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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'CREATED': return 'On Curve';
      case 'CURVE': return 'Trading';
      case 'GRADUATING': return 'Graduating';
      case 'GRADUATED': return 'Graduated';
      default: return phase;
    }
  };

  const getPriceChange = () => {
    const change = (token.graduationProgress - 50) * 0.5;
    return change;
  };

  const priceChange = getPriceChange();

  const getProgressBarClass = () => {
    if (isNearGraduation) {
      return "bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 h-full rounded-full transition-all duration-500";
    }
    return "bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500";
  };

  return (
    <Link href={`/token/${token.address}`} className="block">
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-[#17182D] border-0 shadow-none">
        <CardContent className="p-6 space-y-5">
          {/* 项目头部：Logo + 名称 + 区块链 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative">
                <img 
                  src={avatarSrc} 
                  alt={token.name} 
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = `https://avatar.vercel.sh/${token.address}.png?size=56`;
                  }}
                />
                {isNearGraduation && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-500 rounded-full animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg md:text-xl font-bold text-white truncate group-hover:text-primary transition-colors">
                    {token.name}
                  </h3>
                  <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  ${token.symbol} • {token.network || 'Ethereum'}
                </div>
              </div>
            </div>
            <FavoriteIcon />
          </div>

          {/* 关键指标：价格和涨跌幅 */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-extrabold text-white tracking-tight">
                ${Number(token.currentPrice).toFixed(6)}
              </div>
              <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% (24h)
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Market Cap</div>
              <div className="text-base font-semibold text-white">
                ${formatNumber(Number(token.marketCap))}
              </div>
            </div>
          </div>

          {/* 项目描述：固定两行高度并隐藏 */}
          {token.description && (
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 overflow-hidden min-h-[40px] max-h-[40px]">
              {token.description}
            </p>
          )}

          {/* 阶段和进度 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className={
                isNearGraduation 
                  ? 'bg-yellow-500/10 text-yellow-400 border-0 text-xs' 
                  : 'bg-primary/10 text-primary border-0 text-xs'
              }>
                {getPhaseText(token.phase)}
              </Badge>
              <span className={`font-semibold text-sm ${isNearGraduation ? 'text-yellow-400' : 'text-white'}`}>
                {Math.floor(token.graduationProgress)}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className={getProgressBarClass()}
                style={{ width: `${Math.min(token.graduationProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* 统计数据网格 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg p-3 text-center bg-white/5">
              <div className="text-gray-400 text-xs mb-1">FDV</div>
              <div className="text-white font-semibold text-sm">
                ${formatNumber(Number(token.fdv || 0))}
              </div>
            </div>
            <div className="rounded-lg p-3 text-center bg-white/5">
              <div className="text-gray-400 text-xs mb-1">Holders</div>
              <div className="text-white font-semibold text-sm">
                {token.holderCount}
              </div>
            </div>
            <div className="rounded-lg p-3 text-center bg-white/5">
              <div className="text-gray-400 text-xs mb-1">Age</div>
              <div className="text-white font-semibold text-sm">
                {getTimeAgo(token.createdAt)}
              </div>
            </div>
          </div>

          {/* 底部操作栏（无边框，按需显示社交图标） */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <img 
                src={creatorAvatarSrc} 
                alt="Creator" 
                className="w-5 h-5 rounded-full bg-white/10 object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://avatar.vercel.sh/${token.creator}.png?size=20`;
                }}
              />
              <span className="text-gray-400 text-xs font-mono">
                {token.creator.slice(0, 4)}...{token.creator.slice(-4)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <SocialIcon href={token.twitter} icon={<TwitterIcon />} label="Twitter" />
              <SocialIcon href={token.telegram} icon={<TelegramIcon />} label="Telegram" />
              <SocialIcon href={token.website} icon={<WebsiteIcon />} label="Website" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
