"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/home/SearchHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink, Edit, Check, Star, X, Heart, TrendingUp, TrendingDown, Eye, MoreHorizontal, Rocket, UserPlus, UserMinus } from "lucide-react";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";
import { AvatarSelectorInline } from "@/components/ui/avatar-selector-inline";
import { userAPI, followAPI, favoriteAPI, tokenAPI } from "@/services/api";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useRouter } from "next/navigation";

export default function ProfilePage({ params }: { params?: { address?: string } }) {
  const router = useRouter();
  const { user, isAuthenticated, address, isLoading: authLoading } = useWalletAuth();
  const [copied, setCopied] = useState(false);
  // 客户端状态，避免hydration错误
  const [isClient, setIsClient] = useState(false);
  
  // 从URL参数获取tab状态，如果没有则默认为overview
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  
  // 获取要查看的用户地址（从URL参数或当前登录用户）
  const targetAddress = params?.address || address;
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // 用户数据
  const [userData, setUserData] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [userPortfolio, setUserPortfolio] = useState<any>(null);
  const [userTokens, setUserTokens] = useState<any>(null);
  const [userFavorites, setUserFavorites] = useState<any>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [okbPrice, setOkbPrice] = useState<number>(177.6); // 默认OKB价格
  
  // 关注状态
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingList, setFollowingList] = useState<any[]>([]);
  
  // 编辑表单数据
  const [editForm, setEditForm] = useState({
    avatar: "",
    nickname: "",
    bio: ""
  });

  const [isCopyLoading, debouncedHandleCopy] = useDebounce(() => {
    if (address && isClient) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(toastMessages.common.copied);
    }
  }, 1000);

  const handleCopy = () => {
    debouncedHandleCopy();
  };

  const [isEditLoading, debouncedHandleEditSubmit] = useDebounce(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    try {
      await userAPI.updateUser(address, {
        username: editForm.nickname,
        bio: editForm.bio,
        avatar_url: editForm.avatar
      });
      setShowEditModal(false);
      toast.success(toastMessages.user.profileUpdated);
      // 重新加载用户数据
      loadUserData();
    } catch (error) {
      toast.error(toastMessages.user.profileUpdateError);
    }
  }, 1000);

  const handleEditSubmit = (e: React.FormEvent) => {
    debouncedHandleEditSubmit(e);
  };

  // 处理tab切换，更新URL参数
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // 更新URL参数
    if (isClient) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // 检查是否为本人主页
  useEffect(() => {
    if (address && targetAddress) {
      setIsOwnProfile(address.toLowerCase() === targetAddress.toLowerCase());
    }
  }, [address, targetAddress]);

  // 客户端初始化
  useEffect(() => {
    setIsClient(true);
    
    // 从URL参数获取tab状态
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  // 监听URL参数变化，更新tab状态
  useEffect(() => {
    if (isClient) {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && tabParam !== activeTab) {
        setActiveTab(tabParam);
      }
    }
  }, [isClient, activeTab]);

  // 监听浏览器历史变化
  useEffect(() => {
    if (!isClient) return;

    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && tabParam !== activeTab) {
        setActiveTab(tabParam);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isClient, activeTab]);

  // 加载关注状态
  const loadFollowStatus = async () => {
    if (!targetAddress) return;
    
    try {
      const [followersResponse, followingResponse] = await Promise.all([
        followAPI.getFollowers(targetAddress),
        followAPI.getFollowing(targetAddress)
      ]);
      
      setFollowerCount(followersResponse.data.count);
      setFollowingCount(followingResponse.data.count);
      setFollowingList(followingResponse.data.following);
      
      // 如果是查看其他用户的主页，检查当前用户是否关注了目标用户
      if (address && !isOwnProfile) {
        const followStatus = await followAPI.checkFollowStatus(address, targetAddress);
        setIsFollowing(followStatus.data.is_following);
      }
    } catch (error) {
      console.error('Failed to load follow status:', error);
    }
  };

  // 加载用户数据
  const loadUserData = async () => {
    if (!targetAddress) return;
    
    try {
      // 并行加载所有用户数据
      const [userResponse, statsResponse, portfolioResponse, tokensResponse, favoritesResponse, suggestedResponse, okbPriceResponse] = await Promise.all([
        userAPI.getUser(targetAddress),
        userAPI.getUserStats(targetAddress),
        userAPI.getUserPortfolio(targetAddress),
        userAPI.getUserTokens(targetAddress),
        favoriteAPI.getUserFavorites(targetAddress),
        followAPI.getSuggestedUsers(address || targetAddress),
        tokenAPI.getOKBPrice()
      ]);

      setUserData(userResponse);
      setUserStats(statsResponse);
      setUserPortfolio(portfolioResponse);
      setUserTokens(tokensResponse);
      setUserFavorites(favoritesResponse.data);
      setSuggestedUsers(suggestedResponse.data.suggested_users);
      setOkbPrice(parseFloat(okbPriceResponse.data.price));

      // 更新编辑表单
      setEditForm({
        avatar: userResponse.avatar_url || "",
        nickname: userResponse.username || "",
        bio: userResponse.bio || ""
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // 关注/取消关注用户
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());

  const handleFollowToggle = async (userAddress: string) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (followLoading.has(userAddress)) return;
    
    setFollowLoading(prev => new Set(prev).add(userAddress));
    try {
      const response = await followAPI.followUser(address, {
        following_address: userAddress
      });
      
      if (response.success) {
        // 更新推荐用户列表中的关注状态
        setSuggestedUsers(prev => prev.map(user => 
          user.address === userAddress 
            ? { ...user, is_following: response.data.is_following }
            : user
        ));
        
        toast.success(response.data.is_following 
          ? toastMessages.user.followSuccess(userData?.username || 'User')
          : toastMessages.user.unfollowSuccess(userData?.username || 'User')
        );
      }
    } catch (error) {
      toast.error(toastMessages.user.followError);
    } finally {
      setFollowLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userAddress);
        return newSet;
      });
    }
  };

  // 关注/取消关注目标用户
  const handleTargetUserFollowToggle = async () => {
    if (!address || !targetAddress || isOwnProfile) return;
    
    if (followLoading.has(targetAddress)) return;
    
    setFollowLoading(prev => new Set(prev).add(targetAddress));
    try {
      const response = await followAPI.followUser(address, {
        following_address: targetAddress
      });
      
      if (response.success) {
        setIsFollowing(response.data.is_following);
        setFollowerCount(response.data.follower_count);
        
        toast.success(response.data.is_following 
          ? toastMessages.user.followSuccess(userData?.username || 'User')
          : toastMessages.user.unfollowSuccess(userData?.username || 'User')
        );
      }
    } catch (error) {
      toast.error(toastMessages.user.followError);
    } finally {
      setFollowLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetAddress);
        return newSet;
      });
    }
  };

  // 头像选择
  const handleAvatarSelect = (avatar: any) => {
    setEditForm(prev => ({ ...prev, avatar: avatar.url }));
  };

  // 初始化加载
  useEffect(() => {
    if (targetAddress) {
      loadUserData();
      if (address && isAuthenticated) {
        loadFollowStatus();
      }
    }
  }, [targetAddress, address, isAuthenticated]);

  // 如果钱包未连接，显示连接提示
  if (!address && !targetAddress) {
    return (
      <div className="flex h-screen bg-[#0E0E0E]">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col">
          <SearchHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">Please connect your wallet to view your profile</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果正在加载认证状态
  if (authLoading) {
    return (
      <div className="flex h-screen bg-[#0E0E0E]">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col">
          <SearchHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#70E000] mx-auto mb-4"></div>
              <p className="text-gray-400">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 获取真实价格
  const ethPrice = 2000; // 这里应该从API获取实时ETH价格
  const okbPriceReal = okbPrice; // 使用从API获取的OKB价格
  
  const balances = userPortfolio ? [
    { coin: "ETH", name: "Ethereum", amount: parseFloat(userPortfolio.eth).toFixed(4), value: `$${(parseFloat(userPortfolio.eth) * ethPrice).toFixed(2)}`, change: "0.00%", logo: "🔵", isPositive: true },
    { coin: "OKB", name: "OKB", amount: parseFloat(userPortfolio.okb).toFixed(4), value: `$${(parseFloat(userPortfolio.okb) * okbPriceReal).toFixed(2)}`, change: "0.00%", logo: "🟢", isPositive: true },
  ] : [];

  const portfolioStats = userStats ? {
    totalValue: `$${(parseFloat(userPortfolio?.eth || '0') * 2000 + parseFloat(userPortfolio?.okb || '0') * 100).toFixed(2)}`,
    totalChange: "+3.45%",
    isPositive: true,
    tokens: userStats.tokens_created,
    transactions: 12
  } : null;


  
  const createdTokens = userTokens?.created?.map((token: any, index: number) => {
    // 前端转换OKB数量为USD
    const okbVolume = parseFloat(token.volume24h);
    const volumeUSD = okbVolume * okbPrice;
    

    
    return {
      id: index + 1,
      name: token.name,
      symbol: token.symbol,
      logo: token.imageUrl || "/tokens/default.png",
      marketCap: parseFloat(token.marketCap).toFixed(4),
      volume: `$${volumeUSD.toFixed(2)}`,
      price: token.currentPrice,
      priceChange: "0%", // 暂时设为0%，后续可以从priceChange24h获取
      isPositive: true,
      progress: token.graduationProgress,
      address: token.address,
      createdAgo: isClient ? new Date(token.createdAt).toLocaleDateString() : token.createdAt,
      holders: token.holderCount,
      phase: token.phase,
      isVerified: token.isVerified,
      isFeatured: token.isFeatured
    };
  }) || [];
  


  // 处理持有代币数据
  const holdingTokens = userTokens?.holding?.map((token: any, index: number) => {
    // 前端转换OKB数量为USD
    const okbVolume = parseFloat(token.volume24h);
    const volumeUSD = okbVolume * okbPrice;
    
    return {
      id: index + 1,
      name: token.name,
      symbol: token.symbol,
      logo: token.imageUrl || "/tokens/default.png",
      marketCap: parseFloat(token.marketCap).toFixed(4),
      volume: `$${volumeUSD.toFixed(2)}`,
      price: token.currentPrice,
      priceChange: "0%", // 暂时设为0%，后续可以从priceChange24h获取
      isPositive: true,
      progress: token.graduationProgress,
      address: token.address,
      createdAgo: isClient ? new Date(token.createdAt).toLocaleDateString() : token.createdAt,
      holders: token.holderCount,
      phase: token.phase,
      isVerified: token.isVerified,
      isFeatured: token.isFeatured
    };
  }) || [];

  const favoriteTokens = userFavorites?.favorites?.map((favorite: any, index: number) => ({
    id: index + 1,
    name: favorite.token.name,
    symbol: favorite.token.symbol,
    logo: favorite.token.imageUrl || "/tokens/btc.png",
    marketCap: parseFloat(favorite.token.marketCap).toFixed(4),
    volume: "$5,234",
    price: favorite.token.currentPrice,
    priceChange: "+12.5%",
    isPositive: true,
    progress: favorite.token.graduationProgress,
    address: favorite.token.address,
    createdAgo: "3d ago",
    holders: favorite.token.holderCount
  })) || [];

  const tabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "balances", label: "Balances", icon: TrendingUp },
    { id: "create", label: "Created", icon: Rocket },
    { id: "favorites", label: "Favorites", icon: Star },
    { id: "following", label: "Following", icon: UserPlus }
  ];

  return (
    <div className="flex h-screen bg-[#0E0E0E]">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        <SearchHeader />
        
        <div className="flex-1 overflow-y-auto bg-[#0E0E0E]">
          <div className="px-6 py-6">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-6">
                  {/* Avatar */}
                  <div className="relative">
                                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center text-2xl">
                    {userData?.avatar_url ? (
                      userData.avatar_url.startsWith('/media/') ? (
                        <img 
                          src={userData.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">{userData.avatar_url}</span>
                      )
                    ) : (
                      "👤"
                    )}
                  </div>
                    {isOwnProfile && (
                      <button
                        onClick={() => setShowAvatarSelector(true)}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#70E000] rounded-full flex items-center justify-center text-black text-xs hover:bg-[#5BC000] transition-colors"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-2xl font-bold text-white">
                        {userData?.username || "User"}
                      </h1>
                      {userData?.is_verified && (
                        <div className="w-5 h-5 bg-[#70E000] rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-black" />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-400 mb-3">
                      {userData?.bio || "No bio yet"}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span><span className="text-[#70E000] font-bold">{userStats?.tokens_created || 0}</span> tokens created</span>
                      <span>•</span>
                      <span><span className="text-[#70E000] font-bold">{userStats?.reputation_score || 0}</span> reputation</span>
                      <span>•</span>
                      <span><span className="text-[#70E000] font-bold">{followerCount}</span> followers</span>
                      <span>•</span>
                      <span><span className="text-[#70E000] font-bold">{followingCount}</span> following</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <span>{targetAddress?.slice(0, 6)}...{targetAddress?.slice(-4)}</span>
                        <button
                          onClick={handleCopy}
                          disabled={isCopyLoading}
                          className={`text-gray-400 hover:text-white transition-colors p-1 rounded ${isCopyLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className={`h-4 w-4 ${isCopyLoading ? 'animate-pulse' : ''}`} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  {isOwnProfile ? (
                    <Button
                      onClick={() => setShowEditModal(true)}
                      className="bg-[#70E000] text-black hover:bg-[#5BC000]"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : address && isAuthenticated ? (
                    <Button
                      onClick={handleTargetUserFollowToggle}
                      disabled={followLoading.has(targetAddress || '')}
                      className={`${
                        isFollowing 
                          ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                          : 'bg-[#70E000] hover:bg-[#5BC000] text-black'
                      } transition-colors`}
                    >
                      {followLoading.has(targetAddress || '') ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : isFollowing ? (
                        <UserMinus className="h-4 w-4 mr-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => toast.info('Please connect your wallet to follow users')}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#70E000] text-black'
                        : 'text-gray-400 hover:text-white hover:bg-[#232323]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Portfolio Stats */}
                    {portfolioStats && (
                      <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Overview</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-gray-400 text-sm">Total Value</p>
                            <p className="text-white font-semibold">{portfolioStats.totalValue}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">24h Change</p>
                            <p className={`font-semibold ${portfolioStats.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {portfolioStats.totalChange}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Tokens</p>
                            <p className="text-white font-semibold">{portfolioStats.tokens}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Transactions</p>
                            <p className="text-white font-semibold">{portfolioStats.transactions}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Activity */}
                    <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#70E000]/20 rounded-full flex items-center justify-center">
                              <Rocket className="h-4 w-4 text-[#70E000]" />
                            </div>
                            <div>
                              <p className="text-white text-sm">Created new token</p>
                              <p className="text-gray-400 text-xs">2 hours ago</p>
                            </div>
                          </div>
                          <span className="text-[#70E000] text-sm">+1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "balances" && (
                  <div className="space-y-4">
                    {/* 原生代币余额 */}
                    {balances.map((balance, index) => (
                      <div key={index} className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center text-2xl">
                              {balance.logo}
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">{balance.name}</h3>
                              <p className="text-gray-400 text-sm">{balance.coin}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{balance.amount}</p>
                            <p className="text-gray-400 text-sm">{balance.value}</p>
                            <p className={`text-sm ${balance.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {balance.change}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* 持有代币 */}
                    {holdingTokens.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Holding Tokens</h3>
                        <div className="space-y-4">
                          {holdingTokens.map((token) => (
                            <div key={token.id} className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <img src={token.logo} alt={token.name} className="w-12 h-12 rounded-full" />
                                  <div>
                                    <h3 className="text-white font-semibold">{token.name}</h3>
                                    <p className="text-gray-400 text-sm">{token.symbol}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-semibold">{token.marketCap}</p>
                                  <p className="text-gray-400 text-sm">Market Cap</p>
                                  <div className="flex items-center justify-end space-x-2 mt-1">
                                    <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-[#70E000] to-[#5BC000] rounded-full"
                                        style={{ width: `${token.progress}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-[#70E000] text-sm font-bold">{token.progress}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "create" && (
                  <div className="space-y-4">

                    {createdTokens.map((token) => (
                      <div key={token.id} className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img src={token.logo} alt={token.name} className="w-12 h-12 rounded-full" />
                            <div>
                              <h3 className="text-white font-semibold">{token.name}</h3>
                              <p className="text-gray-400 text-sm">{token.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{token.marketCap}</p>
                            <p className="text-gray-400 text-sm">Market Cap</p>
                            <div className="flex items-center justify-end space-x-2 mt-1">
                              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#70E000] to-[#5BC000] rounded-full"
                                  style={{ width: `${token.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-[#70E000] text-sm font-bold">{token.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "favorites" && (
                  <div className="space-y-4">
                    {favoriteTokens.map((token) => (
                      <div key={token.id} className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img src={token.logo} alt={token.name} className="w-12 h-12 rounded-full" />
                            <div>
                              <h3 className="text-white font-semibold">{token.name}</h3>
                              <p className="text-gray-400 text-sm">{token.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{token.marketCap}</p>
                            <p className="text-gray-400 text-sm">Market Cap</p>
                            <div className="flex items-center justify-end space-x-2 mt-1">
                              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#70E000] to-[#5BC000] rounded-full"
                                  style={{ width: `${token.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-[#70E000] text-sm font-bold">{token.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "following" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Following ({followingCount})</h3>
                      {followingList.length > 0 ? (
                        <div className="space-y-4">
                          {followingList.map((follow) => (
                            <div key={follow.following_id} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-[#232323]">
                              <div 
                                className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-[#232323] rounded-lg p-2 transition-colors"
                                onClick={() => router.push(`/profile/${follow.user.address}`)}
                              >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center">
                                  {follow.user.avatar_url ? (
                                    follow.user.avatar_url.startsWith('/media/') ? (
                                      <img 
                                        src={follow.user.avatar_url} 
                                        alt="Avatar" 
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-xl">{follow.user.avatar_url}</span>
                                    )
                                  ) : (
                                    "👤"
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="text-white font-medium">{follow.user.username}</h4>
                                    {follow.user.is_verified && (
                                      <div className="w-4 h-4 bg-[#70E000] rounded-full flex items-center justify-center">
                                        <Check className="h-2.5 w-2.5 text-black" />
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-gray-400 text-sm">{follow.user.bio || "No bio"}</p>
                                  <p className="text-gray-500 text-xs"><span className="text-[#70E000] font-bold">{follow.user.tokens_created}</span> tokens created</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400 text-sm">
                                  {isClient ? new Date(follow.followed_at).toLocaleDateString() : follow.followed_at}
                                </span>
                                {isOwnProfile && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFollowToggle(follow.user.address);
                                    }}
                                    disabled={followLoading.has(follow.user.address)}
                                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No following yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 max-w-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Who to follow</h3>
                  <div className="space-y-4">
                    {suggestedUsers.map((user) => (
                      <div key={user.address} className="flex items-center justify-between">
                        <div 
                          className="flex items-center space-x-2 flex-1 cursor-pointer hover:bg-[#232323] rounded-lg p-2 transition-colors"
                          onClick={() => router.push(`/profile/${user.address}`)}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center flex-shrink-0">
                            {user.avatar_url ? (
                              user.avatar_url.startsWith('/media/') ? (
                                <img 
                                  src={user.avatar_url} 
                                  alt="Avatar" 
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm">{user.avatar_url}</span>
                              )
                            ) : (
                              "👤"
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{user.username}</p>
                            <p className="text-gray-400 text-xs truncate"><span className="text-[#70E000] font-bold">{user.follower_count}</span> followers</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowToggle(user.address);
                          }}
                          disabled={followLoading.has(user.address)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                            user.is_following
                              ? 'bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white'
                              : 'bg-[#70E000] text-black hover:bg-[#5BC000]'
                          } ${followLoading.has(user.address) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {followLoading.has(user.address) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                          ) : user.is_following ? (
                            <>
                              <UserMinus className="h-3 w-3" />
                              <span className="hidden sm:inline">Unfollow</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3" />
                              <span className="hidden sm:inline">Follow</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#151515] border border-[#232323] rounded-2xl p-8 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 flex items-center justify-center">
                    {editForm.avatar ? (
                      editForm.avatar.startsWith('/media/') ? (
                        <img 
                          src={editForm.avatar} 
                          alt="Avatar" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">{editForm.avatar}</span>
                      )
                    ) : (
                      "👤"
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowAvatarSelector(true)}
                    variant="outline"
                    className="border-[#232323] text-gray-400 hover:text-white"
                  >
                    Choose Avatar
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nickname</label>
                <Input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                  className="bg-[#1a1a1a] border-[#232323] text-white"
                  placeholder="Enter your nickname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-[#1a1a1a] border-[#232323] text-white"
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="border-[#232323] text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isEditLoading}
                  className="bg-[#70E000] text-black hover:bg-[#5BC000] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avatar Selector */}
      {showAvatarSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <AvatarSelectorInline
            currentAvatar={editForm.avatar}
            onSelect={handleAvatarSelect}
            onClose={() => setShowAvatarSelector(false)}
          />
        </div>
      )}
    </div>
  );
}
