import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface TokenMetricsProps {
  token: any;
  okbPrice: number;
  showCurrentPrice?: boolean;
  stats24h?: any; // 24h 统计数据
}

export function TokenMetrics({ token, okbPrice, showCurrentPrice = true, stats24h }: TokenMetricsProps) {
  // 计算价格相关数据
  const currentPrice = parseFloat(token.currentPrice || '0'); // 后端返回的已经是USD价格
  // 尝试多种ATH字段来源
  const athRaw = token.ath || token.athPrice || token.ath_price || '0';
  const athPrice = parseFloat(athRaw); // 后端返回的已经是USD价格
  const marketCap = parseFloat(token.marketCap || '0');
  const athDrop = athPrice > 0 ? ((currentPrice - athPrice) / athPrice) * 100 : 0;
  const athProgress = athPrice > 0 ? Math.min((currentPrice / athPrice) * 100, 100) : 0;

  // 临时调试ATH问题
  if (token.address === '0x1858087bbb90d274ffb1833c7a3346249bcd0ffe') {
    console.log('ATH问题调试:', {
      'token.ath (raw)': token.ath,
      'athRaw': athRaw,
      'athPrice (parsed)': athPrice,
      'currentPrice': currentPrice,
      'athPrice > 0': athPrice > 0,
      'athPrice.toFixed(6)': athPrice > 0 ? athPrice.toFixed(6) : 'N/A'
    });
  }





  // 使用通用的价格格式化函数

  // 根据是否显示当前价格决定列数 - 现在显示3列
  const gridCols = showCurrentPrice ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-1 lg:grid-cols-2';



  return (
    <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
      <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
        {/* 当前价格 */}
        {showCurrentPrice && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">Current Price</h3>
            <div className="text-2xl font-bold text-white">
              ${formatPrice(currentPrice)}
            </div>
            <div className="flex items-center space-x-2">
              {(() => {
                // 优先使用 stats24h 的数据，回退到 token 的数据
                const priceChange = parseFloat(stats24h?.priceChange24h || token.priceChange24h || '0');
                return (
                  <>
                    {priceChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      priceChange > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* 市值 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">Market Cap</h3>
          <div className="text-2xl font-bold text-white">
            ${marketCap.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">
            {token.holderCount || 0} holders
          </div>
        </div>

        {/* ATH信息 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">ATH (All Time High)</h3>
          <div className="text-2xl font-bold text-white">
            ${athPrice > 0 ? athPrice.toFixed(6) : currentPrice.toFixed(6)}
          </div>
          {athPrice > 0 ? (
            <div className="flex items-center space-x-2">
              {athDrop >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                athDrop >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {athDrop >= 0 ? '+' : ''}{athDrop.toFixed(2)}% from ATH
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              Current price (ATH not available)
            </div>
          )}
        </div>
      </div>

      {/* ATH进度条 */}
      {athPrice > 0 && (
        <div className="mt-6 pt-6 border-t border-[#232323]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Current vs ATH</span>
            <span className="text-sm font-medium text-white">{athProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#70E000] to-[#5BC000] h-2 rounded-full transition-all duration-500"
              style={{ width: `${athProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
