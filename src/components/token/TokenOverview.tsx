import { Users, TrendingUp, Lock, Coins, Target } from 'lucide-react';

interface TokenOverviewProps {
  token: any;
  okbPrice?: number;
}

export function TokenOverview({ token, okbPrice = 177.6 }: TokenOverviewProps) {
  if (!token) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#70E000] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading overview...</p>
        </div>
      </div>
    );
  }

  // 计算各种指标 - 使用API实际返回的字段
  const totalSupply = parseFloat(token?.total_supply || '0');

  // 毕业进度 - 使用API返回的字段，支持多种字段名格式
  const graduationThreshold = parseFloat(token?.graduation_threshold || token?.graduationThreshold || '80');
  const currentCollected = parseFloat(token?.okb_collected || '0');
  // 支持多种字段名格式：graduationProgress, graduation_progress, bonding_progress
  const graduationProgress = parseFloat(
    token?.graduationProgress ||
    token?.graduation_progress ||
    token?.bonding_progress ||
    '0'
  );



  // 供应量信息 - 使用合约设计的固定值
  const tokensTraded = parseFloat(token?.tokens_traded || '0');
  // 根据合约设计：总供应10亿，流通8亿（80%），LP锁仓2亿（20%）
  const circulatingSupply = 800_000_000; // 8亿流通供应量
  const lockedSupply = 200_000_000; // 2亿LP锁仓

  // 交易统计
  const initialPurchaseAmount = parseFloat(token?.initial_purchase_amount || '0');

  // 格式化数字
  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };



  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-6">{/* 移除背景和边框，因为已经在Tab容器内 */}
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Basic Information</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Token Name</span>
              <span className="text-white font-medium">{token?.name || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Symbol</span>
              <span className="text-white font-medium">{token?.symbol || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Creator</span>
              <span className="text-white font-mono text-sm">{token?.creator ? formatAddress(token.creator) : 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Network</span>
              <span className="text-white font-medium capitalize">{token?.network || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {token?.description && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">About {token?.symbol || 'Token'}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{token.description}</p>
          </div>
        )}

        {/* Creator Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Creator Information</h3>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Creator Address</span>
              <span className="text-white font-mono text-sm">{token?.creator ? formatAddress(token.creator) : 'N/A'}</span>
            </div>

            {initialPurchaseAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Initial Purchase</span>
                <span className="text-white font-medium">{initialPurchaseAmount.toFixed(4)} OKB</span>
              </div>
            )}

            {token?.blockchain_tx_hash && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Creation Tx</span>
                <span className="text-white font-mono text-sm">{formatAddress(token.blockchain_tx_hash)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Supply Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Supply Information</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Coins className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Total Supply</span>
              </div>
              <span className="text-white font-medium">{formatNumber(totalSupply, 0)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Circulating Supply</span>
              </div>
              <span className="text-white font-medium">{formatNumber(circulatingSupply, 0)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400 text-sm">LP Locked</span>
              </div>
              <span className="text-white font-medium">{formatNumber(lockedSupply, 0)}</span>
            </div>
          </div>
        </div>



        {/* Graduation Progress */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Graduation Progress</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Graduation Threshold</span>
              <span className="text-white font-medium">{graduationThreshold.toFixed(0)} OKB</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Current Collected</span>
              <span className="text-white font-medium">{currentCollected.toFixed(2)} OKB</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Can Graduate</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                token?.can_graduate
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {token?.can_graduate ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Progress</span>
                <span className="text-[#70E000] font-medium">{graduationProgress.toFixed(1)}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#70E000] to-[#5BC000] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(graduationProgress, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Status */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Status & Timeline</h3>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Current Phase</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              token?.phase === 'GRADUATED'
                ? 'bg-green-500/20 text-green-400'
                : token?.phase === 'GRADUATING'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {token?.phase === 'CURVE_TRADING' ? 'BONDING CURVE' : token?.phase || 'CURVE'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Created</span>
            <span className="text-white font-medium text-sm">
              {token?.created_at ? new Date(token.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'N/A'}
            </span>
          </div>

          {token?.graduated_at && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Graduated</span>
              <span className="text-green-400 font-medium text-sm">
                {new Date(token.graduated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Active</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              token?.is_active
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {token?.is_active ? 'YES' : 'NO'}
            </span>
          </div>

          {token?.ath && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">All-Time High</span>
              <span className="text-white font-medium text-sm">
                ${parseFloat(token.ath).toFixed(8)}
              </span>
            </div>
          )}
        </div>
    </div>
  );
}
