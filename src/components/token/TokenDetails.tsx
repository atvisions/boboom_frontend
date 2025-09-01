import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Share2, Copy, ExternalLink, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
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
        let creatorAddress = null;
        
        // 获取创作者地址
        if (token.creator && typeof token.creator === 'object' && token.creator.address) {
          creatorAddress = token.creator.address;
        } else if (token.creator && typeof token.creator === 'string') {
          creatorAddress = token.creator;
        }
        
        // 如果有创作者地址，调用API获取完整信息
        if (creatorAddress) {
          console.log('Loading creator info for:', creatorAddress);
          try {
            // 直接调用后端API
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${backendUrl}/api/users/${creatorAddress.toLowerCase()}/`);
            if (response.ok) {
              const data = await response.json();
              console.log('Creator response:', data);
              setCreator(data);
            } else {
              console.error('Failed to fetch creator info:', response.status);
              // 如果API调用失败，使用token.creator中的基本信息作为备用
              if (token.creator && typeof token.creator === 'object') {
                setCreator(token.creator);
              }
            }
          } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            // 如果API调用失败，使用token.creator中的基本信息作为备用
            if (token.creator && typeof token.creator === 'object') {
              setCreator(token.creator);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load creator info:', error);
        // 如果API调用失败，使用token.creator中的基本信息作为备用
        if (token.creator && typeof token.creator === 'object') {
          setCreator(token.creator);
        }
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
        // 直接调用后端API，避免Next.js API路由的重定向问题
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${backendUrl}/api/tokens/okb-price/`);
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

  return (
    <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">

      {/* 回退按钮 */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* 主要内容 */}
      <div className="flex items-start justify-between">
        {/* 左侧内容 */}
        <div className="flex items-start space-x-5">
          {/* 1. 代币图标 */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1B1B1B] to-[#232323] flex items-center justify-center border-2 border-orange-400 shadow-lg flex-shrink-0">
            {token.imageUrl ? (
              <Image 
                src={token.imageUrl} 
                alt={`${token.name} logo`} 
                width={96} 
                height={96} 
                className="w-24 h-24 object-contain"
                style={{ width: 'auto', height: 'auto' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-2xl font-bold text-white">${token.symbol.slice(0, 2)}</span>`;
                  }
                }}
                unoptimized={true}
              />
            ) : (
              <span className="text-2xl font-bold text-white">{token.symbol.slice(0, 2)}</span>
            )}
          </div>
          
          {/* 2. 代币信息 */}
          <div className="space-y-3">
            {/* 代币名称 */}
            <div>
              <h1 className="text-2xl font-bold text-white">{token.name}</h1>
              <p className="text-gray-400 text-base font-medium">{token.symbol}</p>
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
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center overflow-hidden border border-[#5BC000]/30">
                    {creator?.avatar_url ? (
                      creator.avatar_url.startsWith('/media/') ? (
                        <Image 
                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}${creator.avatar_url}`}
                          alt="Creator avatar" 
                          width={24} 
                          height={24} 
                          className="w-6 h-6 rounded-full object-cover"
                          style={{ width: 'auto', height: 'auto' }}
                          unoptimized={true}
                        />
                      ) : (
                        <span className="text-xs">
                          {(() => {
                            try {
                              // 处理Unicode编码的emoji
                              if (creator.avatar_url.includes('\\u')) {
                                return JSON.parse(`"${creator.avatar_url}"`);
                              }
                              // 处理直接的Unicode字符
                              if (creator.avatar_url.startsWith('\\u')) {
                                return String.fromCodePoint(parseInt(creator.avatar_url.slice(2), 16));
                              }
                              return creator.avatar_url;
                            } catch (e) {
                              console.error('Error parsing avatar emoji:', e);
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
                      className="p-1.5 bg-gray-700/50 hover:bg-[#70E000] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#70E000]/50 group"
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
                      className="p-1.5 bg-gray-700/50 hover:bg-[#70E000] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#70E000]/50 group"
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
                      className="p-1.5 bg-gray-700/50 hover:bg-[#70E000] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#70E000]/50 group"
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
                      className="p-1.5 bg-gray-700/50 hover:bg-[#70E000] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#70E000]/50 group"
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
                      className="p-1.5 bg-gray-700/50 hover:bg-[#70E000] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#70E000]/50 group"
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
            className="p-2.5 bg-gray-700/50 hover:bg-[#70E000] rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-[#70E000]/50"
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
                ? 'bg-[#70E000] border-[#70E000] text-black' 
                : 'bg-gray-700/50 border-gray-600/30 text-gray-400 hover:bg-[#70E000] hover:border-[#70E000] hover:text-black'
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
