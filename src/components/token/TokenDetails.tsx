import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Share2, Copy, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { FaXTwitter, FaTelegram, FaDiscord, FaGithub, FaGlobe } from 'react-icons/fa6';
import { userAPI, favoriteAPI } from '@/services/api';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from '@/components/ui/toast-notification';

interface TokenDetailsProps {
  token: any;
}

export function TokenDetails({ token }: TokenDetailsProps) {
  const router = useRouter();
  const { address, isAuthenticated } = useWalletAuth();
  const [creator, setCreator] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [okbPrice, setOkbPrice] = useState<number>(177.6);

  // 加载创作者信息
  useEffect(() => {
    const loadCreatorInfo = async () => {
      try {
        if (token.creator && typeof token.creator === 'string') {
          const response = await userAPI.getUser(token.creator);
          setCreator(response);
        }
      } catch (error) {
        console.error('Failed to load creator info:', error);
      }
    };

    loadCreatorInfo();
  }, [token.creator]);

  // 加载收藏状态
  useEffect(() => {
    const loadFavoriteStatus = async () => {
      if (!address || !isAuthenticated) return;
      
      try {
        const response = await favoriteAPI.checkFavoriteStatus(address, token.address, 'sepolia');
        setIsFavorited(response.data.is_favorited);
      } catch (error) {
        console.error('Failed to load favorite status:', error);
      }
    };

    loadFavoriteStatus();
  }, [address, isAuthenticated, token.address]);

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

  // 切换收藏状态
  const toggleFavorite = async () => {
    if (!address || !isAuthenticated) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsFavoriteLoading(true);
    try {
      const response = await favoriteAPI.toggleFavorite(address, {
        token_address: token.address,
        network: 'sepolia'
      });

      if (response.success) {
        setIsFavorited(response.data.is_favorited);
        toast.success(response.data.is_favorited ? 'Added to favorites' : 'Removed from favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorite status');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // 复制合约地址
  const copyAddress = () => {
    navigator.clipboard.writeText(token.address);
    toast.success('Address copied to clipboard');
  };

  // 跳转到区块浏览器
  const openBlockExplorer = () => {
    const explorerUrl = `https://sepolia.etherscan.io/address/${token.address}`;
    window.open(explorerUrl, '_blank');
  };

  // 计算创建时间
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // 检查是否有社交媒体链接
  const hasSocialLinks = token.website || token.twitter || token.telegram || token.discord || token.github;

  // 计算价格变化
  const priceChange = parseFloat(token.priceChange24h || '0') || 0;
  const isPriceUp = priceChange > 0;
  const isPriceDown = priceChange < 0;

  // 计算ATH进度
  const athValue = 839900; // 假设ATH值
  const currentMarketCap = parseFloat(token.marketCap);
  const athProgress = Math.min((currentMarketCap / athValue) * 100, 100);

  return (
    <div className="space-y-6">
      {/* 代币基本信息 */}
      <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-8">
        {/* 代币基本信息 - 简约时尚布局 */}
        <div className="flex items-start justify-between">
          {/* 左侧内容 */}
          <div className="flex items-start space-x-6">
            {/* 1. 代币图标 */}
            <div className="w-20 h-20 rounded-3xl overflow-hidden bg-gradient-to-br from-[#1B1B1B] to-[#232323] flex items-center justify-center border-2 border-orange-400 shadow-lg">
              {token.imageUrl ? (
                <Image 
                  src={token.imageUrl} 
                  alt={`${token.name} logo`} 
                  width={80} 
                  height={80} 
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-3xl font-bold text-white">${token.symbol.slice(0, 2)}</span>`;
                    }
                  }}
                  unoptimized={true}
                />
              ) : (
                <span className="text-3xl font-bold text-white">{token.symbol.slice(0, 2)}</span>
              )}
            </div>
            
            {/* 2. 代币信息 */}
            <div className="space-y-4">
              {/* 代币名称 */}
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{token.name}</h1>
                <p className="text-gray-400 text-lg font-medium">{token.symbol}</p>
              </div>
              
              {/* 3. 代币介绍 */}
              {token.description && (
                <p className="text-gray-300 text-base leading-relaxed max-w-lg">
                  {token.description}
                </p>
              )}
              
              {/* 4. 创建者信息 */}
              {token.creator && (
                <div className="flex items-center space-x-3">
                  <button 
                    className="flex items-center space-x-3 hover:bg-[#232323] rounded-xl px-4 py-2 transition-all duration-200 group"
                    onClick={() => {
                      if (typeof token.creator === 'string') {
                        router.push(`/profile/${token.creator}`);
                      }
                    }}
                    disabled={typeof token.creator !== 'string'}
                  >
                    {/* 创建者头像 */}
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center overflow-hidden border border-[#70E000]/30">
                      {creator?.avatar_url ? (
                        creator.avatar_url.startsWith('/media/') ? (
                          <Image 
                            src={creator.avatar_url} 
                            alt="Creator avatar" 
                            width={28} 
                            height={28} 
                            className="w-7 h-7 rounded-full object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <span className="text-sm">{creator.avatar_url}</span>
                        )
                      ) : (
                        <span className="text-sm">👤</span>
                      )}
                    </div>
                    
                    {/* 创建者昵称/地址 */}
                    <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
                      {creator?.username || (typeof token.creator === 'string' ? `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}` : 'Unknown')}
                    </span>
                    
                    {/* 时间 */}
                    <span className="text-gray-400 text-xs">
                      • {getTimeAgo(token.createdAt)}
                    </span>
                  </button>
                </div>
              )}
              
              {/* 5. 合约地址和社交媒体 - 一行显示 */}
              <div className="flex items-center space-x-4">
                {/* 合约地址 */}
                <div className="flex items-center space-x-2 bg-gray-700/50 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-600/30 h-12">
                  <span className="text-white text-sm font-mono">
                    {token.address.slice(0, 6)}...{token.address.slice(-4)}
                  </span>
                  
                  {/* 复制按钮 */}
                  <button
                    onClick={copyAddress}
                    className="p-1.5 hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                    title="Copy address"
                  >
                    <Copy className="h-3.5 w-3.5 text-gray-400 hover:text-white" />
                  </button>
                  
                  {/* 跳转按钮 */}
                  <button
                    onClick={openBlockExplorer}
                    className="p-1.5 hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                    title="View on Etherscan"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-white" />
                  </button>
                </div>
                
                {/* 社交媒体图标 */}
                {hasSocialLinks && (
                  <div className="flex items-center space-x-2">
                    {token.website && (
                      <a 
                        href={token.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-700/50 hover:bg-[#70E000] rounded-xl transition-all duration-200 border border-gray-600/30 hover:border-[#70E000]/50"
                        title="Website"
                      >
                        <FaGlobe className="h-4 w-4 text-blue-400 hover:text-white transition-colors" />
                      </a>
                    )}
                    {token.twitter && (
                      <a 
                        href={token.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-700/50 hover:bg-[#70E000] rounded-xl transition-all duration-200 border border-gray-600/30 hover:border-[#70E000]/50"
                        title="Twitter"
                      >
                        <FaXTwitter className="h-4 w-4 text-blue-400 hover:text-white transition-colors" />
                      </a>
                    )}
                    {token.telegram && (
                      <a 
                        href={token.telegram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-700/50 hover:bg-[#70E000] rounded-xl transition-all duration-200 border border-gray-600/30 hover:border-[#70E000]/50"
                        title="Telegram"
                      >
                        <FaTelegram className="h-4 w-4 text-blue-500 hover:text-white transition-colors" />
                      </a>
                    )}
                    {token.discord && (
                      <a 
                        href={token.discord} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-700/50 hover:bg-[#70E000] rounded-xl transition-all duration-200 border border-gray-600/30 hover:border-[#70E000]/50"
                        title="Discord"
                      >
                        <FaDiscord className="h-4 w-4 text-purple-400 hover:text-white transition-colors" />
                      </a>
                    )}
                    {token.github && (
                      <a 
                        href={token.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-700/50 hover:bg-[#70E000] rounded-xl transition-all duration-200 border border-gray-600/30 hover:border-[#70E000]/50"
                        title="GitHub"
                      >
                        <FaGithub className="h-4 w-4 text-gray-400 hover:text-white transition-colors" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 右侧按钮组 */}
          <div className="flex items-center space-x-3">
            {/* 分享按钮 */}
            <button className="p-3 rounded-xl bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50 border border-gray-600/30 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Share2 className="h-5 w-5" />
            </button>
            
            {/* 收藏按钮 */}
            <button
              onClick={toggleFavorite}
              disabled={isFavoriteLoading}
              className={`p-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                isFavorited
                  ? 'bg-[#70E000] text-black hover:bg-[#5BC000] hover:shadow-[#70E000]/25'
                  : 'bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50 border border-gray-600/30'
              } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Star className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 市值信息 */}
      <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
        <div className="flex items-start justify-between">
          {/* 左侧：Market Cap信息 */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">Market Cap</h2>
            <div className="text-2xl font-bold text-white">
              ${parseFloat(token.marketCap).toFixed(4)}
            </div>
            <div className={`flex items-center space-x-1 text-sm ${
              isPriceUp ? 'text-green-500' : isPriceDown ? 'text-red-500' : 'text-gray-400'
            }`}>
              {isPriceUp && <TrendingUp className="h-4 w-4" />}
              {isPriceDown && <TrendingDown className="h-4 w-4" />}
              <span>{priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}% 24hr</span>
            </div>
          </div>
          
          {/* 右侧：ATH进度 */}
          <div className="text-right space-y-2">
            <div className="text-sm text-gray-400">ATH</div>
            <div className="text-lg font-bold text-white">${athValue.toLocaleString()}</div>
            <div className="w-32 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#70E000] to-[#5BC000] h-2 rounded-full transition-all duration-500"
                style={{ width: `${athProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-400">{athProgress.toFixed(1)}% of ATH</div>
          </div>
        </div>
      </div>
    </div>
  );
}
