import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Share2, Copy, ExternalLink, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { FaXTwitter, FaTelegram, FaDiscord, FaGithub, FaGlobe } from 'react-icons/fa6';
import { userAPI, favoriteAPI, tokenAPI } from '@/services/api';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from '@/components/ui/toast-notification';
import { SafeImage } from '@/components/ui/SafeImage';

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
    if (!token || !token.creator) return;
    if (token.creator) {
      const loadCreator = async () => {
        try {
          // 确保我们不使用代币合约地址作为创建者地址
          // 如果token.creator是字符串且与token.address相同，则可能是错误的
          const creatorAddress = typeof token.creator === 'string' 
            ? (token.creator.toLowerCase() === token.address.toLowerCase() ? '' : token.creator)
            : token.creator.address;
          
          if (creatorAddress) {
            const creatorData = await userAPI.getUser(creatorAddress.toLowerCase());
            setCreator(creatorData);
          } else {
            // 如果创建者地址与代币地址相同，则显示为未知创建者
            setCreator({
              address: '',
              username: 'Unknown Creator',
              avatar_url: '👤'
            });
          }
        } catch (error) {
          // 静默处理创作者信息加载失败
          // 如果API调用失败，使用token.creator中的基本信息作为备用
          if (token.creator && typeof token.creator === 'object') {
            setCreator(token.creator);
          } else if (typeof token.creator === 'string' && token.creator.toLowerCase() !== token.address.toLowerCase()) {
            // 提供默认创建者信息，确保UI不会因为API错误而崩溃
            // 同时确保不使用代币合约地址作为创建者地址
            setCreator({
              address: token.creator,
              username: `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}`,
              avatar_url: '👤'
            });
          } else {
            // 如果创建者地址与代币地址相同，则显示为未知创建者
            setCreator({
              address: '',
              username: 'Unknown Creator',
              avatar_url: '👤'
            });
          }
        }
      };
      
      loadCreator();
    }
  }, [token?.creator, token?.address]);

  // 加载收藏状态
  useEffect(() => {
    const loadFavoriteStatus = async () => {
      if (!address || !isAuthenticated) return;
      
      try {
        const response = await favoriteAPI.checkFavoriteStatus(address, token.address, 'sepolia');
        setIsFavorited(response.data.is_favorited);
      } catch (error) {
        // 静默处理收藏状态加载失败
      }
    };

    loadFavoriteStatus();
  }, [address, isAuthenticated, token?.address]);

  // 加载OKB价格
  useEffect(() => {
    const loadOKBPrice = async () => {
      try {
        const response = await tokenAPI.getOKBPrice();
        if (response.success) {
          setOkbPrice(parseFloat(response.data.price));
        }
      } catch (error) {
        // 静默处理OKB价格加载失败
      }
    };

    loadOKBPrice();
  }, []);

  // 早期返回检查 - 如果token不存在，显示加载状态
  if (!token) {
    return (
      <div className="bg-[#1B1B1B] rounded-2xl p-6 border border-gray-700/50">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

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
        
        // 重新检查收藏状态以确保同步
        setTimeout(async () => {
          try {
            const statusResponse = await favoriteAPI.checkFavoriteStatus(address, token.address, 'sepolia');
            if (statusResponse.success) {
              setIsFavorited(statusResponse.data.is_favorited);
            }
          } catch (error) {

          }
        }, 500);
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

  return (
    <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">

      {/* 主要内容 */}
      <div className="flex items-start justify-between">
        {/* 左侧内容 */}
        <div className="flex items-start space-x-5">
          {/* 1. 代币图标 */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-orange-400 shadow-lg flex-shrink-0">
            <SafeImage
              src={token?.image_url}
              alt={`${token?.name || 'Token'} logo`}
              width={96}
              height={96}
              className="w-24 h-24 object-contain"
              fallbackText={token?.symbol?.slice(0, 2) || '??'}
            />
          </div>
          
          {/* 2. 代币信息 */}
          <div className="space-y-3">
            {/* 代币名称 */}
            <div>
              <h1 className="text-2xl font-bold text-white">{token?.name || 'Loading...'}</h1>
              <p className="text-gray-400 text-base font-medium">{token?.symbol || 'Loading...'}</p>
            </div>
            
            {/* 3. 代币介绍 */}
            {token.description && (
              <p className="text-gray-300 text-sm leading-relaxed max-w-lg">
                {token.description}
              </p>
            )}
            
            {/* 4. 创建者信息 */}
            {token.creator && (
              <div className="flex items-center space-x-3">
                <button 
                  className="flex items-center space-x-2 hover:bg-[#232323] rounded-lg px-3 py-1.5 transition-all duration-200 group"
                  onClick={() => {
                    const creatorAddress = typeof token.creator === 'string' 
                      ? token.creator 
                      : token.creator.address;
                    if (creatorAddress) {
                      router.push(`/profile/${creatorAddress}`);
                    }
                  }}
                  disabled={!token.creator}
                >
                  {/* 创建者头像 */}
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D7FE11]/20 to-[#5BC000]/20 flex items-center justify-center overflow-hidden border border-[#5BC000]/30">
                    {creator?.avatar_url ? (
                      creator.avatar_url.startsWith('/media/') ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${creator.avatar_url}`}
                          alt="Creator avatar"
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                          style={{ width: '24px', height: '24px' }}
                          unoptimized={true}
                        />
                      ) : (
                        <span className="text-xs">
                          {(() => {
                            try {
                              // Handle Unicode encoded emoji from backend
                              if (creator.avatar_url.includes('\\u')) {
                                const decoded = JSON.parse(`"${creator.avatar_url}"`);
                                return decoded;
                              }
                              // Handle direct emoji or other formats
                              return creator.avatar_url;
                            } catch (e) {
                              // 静默处理头像emoji解析错误
                              return creator.avatar_url;
                            }
                          })()}
                        </span>
                      )
                    ) : (
                      <span className="text-xs">👤</span>
                    )}
                  </div>
                  
                  {/* 创建者昵称/地址 */}
                  <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
                    {creator?.username || creator?.display_name || (typeof token.creator === 'string' ? `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}` : (token.creator?.address ? `${token.creator.address.slice(0, 6)}...${token.creator.address.slice(-4)}` : 'Unknown'))}
                  </span>
                  
                  {/* 时间 */}
                  <span className="text-gray-400 text-xs">
                    • {getTimeAgo(token.createdAt)}
                  </span>
                </button>
              </div>
            )}
            
            {/* 5. 合约地址和社交媒体 - 一行显示 */}
            <div className="flex items-center space-x-3">
              {/* 合约地址 */}
              <div className="flex items-center space-x-2 bg-gray-700/50 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-600/30">
                <span className="text-white text-sm font-mono">
                  {token.address.slice(0, 6)}...{token.address.slice(-4)}
                </span>
                
                {/* 复制按钮 */}
                <button
                  onClick={copyAddress}
                  className="p-1 hover:bg-gray-600/50 rounded transition-all duration-200"
                  title="Copy address"
                >
                  <Copy className="h-3 w-3 text-gray-400 hover:text-white" />
                </button>
                
                {/* 跳转按钮 */}
                <button
                  onClick={openBlockExplorer}
                  className="p-1 hover:bg-gray-600/50 rounded transition-all duration-200"
                  title="View on Etherscan"
                >
                  <ExternalLink className="h-3 w-3 text-gray-400 hover:text-white" />
                </button>
              </div>
              
              {/* 社交媒体图标 */}
              {hasSocialLinks && (
                <div className="flex items-center space-x-1.5">
                  {token.website && (
                    <a 
                      href={token.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 bg-gray-700/50 hover:bg-[#D7FE11] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#D7FE11]/50 group"
                      title="Website"
                    >
                      <FaGlobe className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors" />
                    </a>
                  )}
                  {token.twitter && (
                    <a 
                      href={token.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 bg-gray-700/50 hover:bg-[#D7FE11] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#D7FE11]/50 group"
                      title="Twitter"
                    >
                      <FaXTwitter className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors" />
                    </a>
                  )}
                  {token.telegram && (
                    <a 
                      href={token.telegram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 bg-gray-700/50 hover:bg-[#D7FE11] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#D7FE11]/50 group"
                      title="Telegram"
                    >
                      <FaTelegram className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors" />
                    </a>
                  )}
                  {token.discord && (
                    <a 
                      href={token.discord} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 bg-gray-700/50 hover:bg-[#D7FE11] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#D7FE11]/50 group"
                      title="Discord"
                    >
                      <FaDiscord className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors" />
                    </a>
                  )}
                  {token.github && (
                    <a 
                      href={token.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 bg-gray-700/50 hover:bg-[#D7FE11] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#D7FE11]/50 group"
                      title="GitHub"
                    >
                      <FaGithub className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：分享和收藏按钮 */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* 分享按钮 */}
          <button
            onClick={() => {
              navigator.share ? navigator.share({
                title: token.name,
                text: `Check out ${token.name} (${token.symbol})`,
                url: window.location.href
              }) : navigator.clipboard.writeText(window.location.href).then(() => {
                toast.success('Link copied to clipboard');
              });
            }}
            className="p-2.5 bg-gray-700/50 hover:bg-[#D7FE11] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#D7FE11]/50"
            title="Share"
          >
            <Share2 className="h-4 w-4 text-gray-400 hover:text-white transition-colors" />
          </button>
          
          {/* 收藏按钮 */}
          <button
            onClick={toggleFavorite}
            disabled={isFavoriteLoading}
            className={`p-2.5 rounded-lg transition-all duration-200 border ${
              isFavorited 
                ? 'bg-[#D7FE11] border-[#D7FE11] text-black' 
                : 'bg-gray-700/50 border-gray-600/30 text-gray-400 hover:bg-[#D7FE11] hover:border-[#D7FE11] hover:text-black'
            }`}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`h-4 w-4 ${isFavoriteLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
