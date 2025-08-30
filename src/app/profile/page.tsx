"use client";
import { useState } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/home/SearchHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink, Edit, Check, Star, X, Heart, TrendingUp, TrendingDown, Eye, MoreHorizontal, Rocket } from "lucide-react";
import { toast, toastMessages } from "@/components/ui/toast-notification";
import { useDebounce } from "@/hooks/useDebounce";

export default function ProfilePage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  
  // 编辑表单数据
  const [editForm, setEditForm] = useState({
    avatar: "🐸",
    nickname: "hctd2j2",
    bio: "Lucas - Crypto enthusiast and token creator"
  });

  const [isCopyLoading, debouncedHandleCopy] = useDebounce(() => {
    navigator.clipboard.writeText("HCtD2...270P");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(toastMessages.common.copied);
  }, 1000);

  const handleCopy = () => {
    debouncedHandleCopy();
  };

  const [isEditLoading, debouncedHandleEditSubmit] = useDebounce((e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 保存编辑数据
    setShowEditModal(false);
    toast.success(toastMessages.user.profileUpdated);
  }, 1000);

  const handleEditSubmit = (e: React.FormEvent) => {
    debouncedHandleEditSubmit(e);
  };

  const suggestedUsers = [
    { id: 1, username: "9x9hwuqq", avatar: "🐸", followers: 1658, verified: false, isFollowing: false },
    { id: 2, username: "idosol99", avatar: "🪙", followers: 1655, verified: false, isFollowing: true },
    { id: 3, username: "regbtc", avatar: "🐸", followers: 1652, verified: false, isFollowing: false },
    { id: 4, username: "4bot", avatar: "🐸", followers: 1645, verified: true, isFollowing: false },
    { id: 5, username: "crypto_dev", avatar: "🐸", followers: 1634, verified: false, isFollowing: true },
  ];

  const balances = [
    { coin: "SOL", name: "Solana", amount: "4.1928", value: "$878", change: "+2.34%", logo: "🟣", isPositive: true },
    { coin: "ETH", name: "Ethereum", amount: "0.2456", value: "$456", change: "-1.23%", logo: "🔵", isPositive: false },
    { coin: "OKB", name: "OKB", amount: "12.5678", value: "$1,234", change: "+5.67%", logo: "🟢", isPositive: true },
  ];

  const portfolioStats = {
    totalValue: "$2,568",
    totalChange: "+3.45%",
    isPositive: true,
    tokens: 3,
    transactions: 12
  };

  const createdTokens = [
    { 
      id: 1, 
      name: "MyToken", 
      symbol: "MTK", 
      logo: "/tokens/bnb.png", 
      marketCap: "$45M", 
      volume: "$5,234", 
      price: "$0.045",
      priceChange: "+12.5%",
      isPositive: true,
      progress: 45,
      address: "0xMyT...1234",
      createdAgo: "3d ago",
      holders: 1250
    },
    { 
      id: 2, 
      name: "TestCoin", 
      symbol: "TEST", 
      logo: "/tokens/doge.png", 
      marketCap: "$12M", 
      volume: "$1,890", 
      price: "$0.012",
      priceChange: "-3.2%",
      isPositive: false,
      progress: 23,
      address: "0xTes...5678",
      createdAgo: "1w ago",
      holders: 890
    },
  ];

  const favoriteTokens = [
    { 
      id: 1, 
      name: "ShibaBNB", 
      symbol: "SHIB", 
      logo: "/tokens/btc.png", 
      marketCap: "$125M", 
      volume: "$11,312", 
      price: "$0.00001234",
      priceChange: "+8.9%",
      isPositive: true,
      progress: 35,
      address: "0xC02a...6Cc2",
      createdAgo: "2h ago",
      holders: 45600
    },
    { 
      id: 2, 
      name: "RocketInu", 
      symbol: "ROCKET", 
      logo: "/tokens/eth.png", 
      marketCap: "$89M", 
      volume: "$8,456", 
      price: "$0.000089",
      priceChange: "+15.7%",
      isPositive: true,
      progress: 67,
      address: "0xBtc0...0001",
      createdAgo: "5h ago",
      holders: 23400
    },
    { 
      id: 3, 
      name: "GeoToken", 
      symbol: "GEO", 
      logo: "/tokens/usdt.png", 
      marketCap: "$156M", 
      volume: "$23,789", 
      price: "$0.156",
      priceChange: "-2.1%",
      isPositive: false,
      progress: 78,
      address: "0xKaW...9876",
      createdAgo: "1d ago",
      holders: 67800
    },
  ];

  const recentTransactions = [
    { id: 1, type: "buy", token: "MTK", amount: "1000", value: "$45", time: "2h ago", status: "completed" },
    { id: 2, type: "sell", token: "SHIB", amount: "50000", value: "$0.62", time: "5h ago", status: "completed" },
    { id: 3, type: "buy", token: "ROCKET", amount: "2000", value: "$0.18", time: "1d ago", status: "pending" },
  ];

  const following = [
    { id: 1, username: "crypto_whale", avatar: "🐋", followers: 12500, verified: true, lastActive: "2h ago" },
    { id: 2, username: "defi_master", avatar: "⚡", followers: 8900, verified: false, lastActive: "5h ago" },
    { id: 3, username: "nft_collector", avatar: "🎨", followers: 6700, verified: true, lastActive: "1d ago" },
  ];

  return (
    <div className="flex h-screen bg-[#0E0E0E]">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        <SearchHeader />
        
        <div className="flex-1 overflow-y-auto bg-[#0E0E0E]">
          <div className="flex">
            {/* Main Content */}
            <div className="flex-1 px-6 py-6 max-w-5xl">
              {/* Enhanced Profile Header */}
              <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] rounded-2xl p-8 mb-8 border border-[#232323]">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-6">
                    {/* Enhanced Profile Picture */}
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-[#70E000] to-[#5BC000] rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                        {editForm.avatar}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#70E000] rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Enhanced Profile Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h1 className="text-3xl font-bold text-white">{editForm.nickname}</h1>
                        <div className="px-2 py-1 bg-[#70E000]/20 text-[#70E000] text-xs font-medium rounded-full">
                          Creator
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-gray-400 font-mono">HCtD2...270P</span>
                        <button
                          onClick={handleCopy}
                          disabled={isCopyLoading}
                          className={`text-gray-400 hover:text-white transition-colors p-1 rounded ${isCopyLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className={`h-4 w-4 ${isCopyLoading ? 'animate-pulse' : ''}`} />}
                        </button>
                        <a
                          href="#"
                          className="text-[#70E000] hover:text-[#5BC000] flex items-center space-x-1 transition-colors text-sm"
                        >
                          <span>View on solscan</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      
                      {/* Enhanced Stats */}
                      <div className="grid grid-cols-4 gap-6 mb-4">
                        <div className="text-center">
                          <div className="text-white font-bold text-xl">0</div>
                          <div className="text-gray-400 text-sm">Followers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-bold text-xl">0</div>
                          <div className="text-gray-400 text-sm">Following</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-bold text-xl">2</div>
                          <div className="text-gray-400 text-sm">Created</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-bold text-xl">3</div>
                          <div className="text-gray-400 text-sm">Favorites</div>
                        </div>
                      </div>
                      
                      <div className="text-white/80 text-lg leading-relaxed">{editForm.bio}</div>
                    </div>
                  </div>
                  
                  {isOwnProfile && (
                    <Button 
                      onClick={() => setShowEditModal(true)}
                      className="bg-gradient-to-r from-[#70E000] to-[#5BC000] hover:from-[#5BC000] hover:to-[#4AA000] text-black font-semibold px-6 py-3 rounded-xl shadow-lg"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {/* Enhanced Navigation Tabs */}
              <div className="flex space-x-1 mb-8 bg-[#151515] rounded-xl p-1 border border-[#232323]">
                {[
                  { id: "overview", label: "Overview", icon: Eye },
                  { id: "balances", label: "Balances", icon: TrendingUp },
                  { id: "create", label: "Created", icon: Rocket },
                  { id: "favorites", label: "Favorites", icon: Star },
                  ...(isOwnProfile ? [{ id: "following", label: "Following", icon: TrendingUp }] : [])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-[#70E000] text-black shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-[#232323]"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Enhanced Tab Content */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Portfolio Summary */}
                  <div className="bg-[#151515] rounded-2xl p-6 border border-[#232323]">
                    <h3 className="text-xl font-bold text-white mb-4">Portfolio Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{portfolioStats.totalValue}</div>
                        <div className={`text-sm ${portfolioStats.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {portfolioStats.totalChange}
                        </div>
                        <div className="text-gray-400 text-xs">Total Value</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{portfolioStats.tokens}</div>
                        <div className="text-gray-400 text-xs">Tokens</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{portfolioStats.transactions}</div>
                        <div className="text-gray-400 text-xs">Transactions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">2</div>
                        <div className="text-gray-400 text-xs">Created</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-[#151515] rounded-2xl p-6 border border-[#232323]">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-[#0E0E0E] rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              tx.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {tx.type === 'buy' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.amount} {tx.token}
                              </div>
                              <div className="text-gray-400 text-sm">{tx.time}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">{tx.value}</div>
                            <div className={`text-xs ${tx.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                              {tx.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "balances" && (
                <div className="bg-[#151515] rounded-2xl p-6 border border-[#232323]">
                  <h3 className="text-xl font-bold text-white mb-6">Token Balances</h3>
                  <div className="space-y-4">
                    {balances.map((balance, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-[#0E0E0E] rounded-xl border border-[#232323] hover:border-[#70E000]/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#70E000]/20 to-[#5BC000]/20 rounded-xl flex items-center justify-center text-2xl">
                            {balance.logo}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{balance.name}</div>
                            <div className="text-gray-400 text-sm">{balance.amount} {balance.coin}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-lg">{balance.value}</div>
                          <div className={`text-sm font-medium ${balance.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {balance.change}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "create" && (
                <div className="bg-[#151515] rounded-2xl p-6 border border-[#232323]">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white">Created Tokens</h3>
                  </div>
                  
                  {createdTokens.length > 0 ? (
                    <div className="space-y-4">
                      {createdTokens.map((token) => (
                        <div 
                          key={token.id} 
                          className="bg-[#0E0E0E] rounded-xl p-6 border border-[#232323] hover:border-[#70E000]/50 transition-all duration-200 cursor-pointer group"
                          onClick={() => console.log('Navigate to token:', token.address)}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <img src={token.logo} alt={token.name} className="w-12 h-12 rounded-xl" />
                              <div>
                                <div className="text-white font-bold text-lg">{token.name} ({token.symbol})</div>
                                <div className="text-gray-400 text-sm">{token.address} • {token.createdAgo}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-white font-bold">{token.marketCap}</div>
                                <div className={`text-sm font-medium ${token.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                  {token.priceChange}
                                </div>
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-5 w-5 text-gray-400" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="text-gray-400 text-sm">Price</div>
                              <div className="text-white font-semibold">{token.price}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-sm">24h Volume</div>
                              <div className="text-white font-semibold">{token.volume}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-sm">Holders</div>
                              <div className="text-white font-semibold">{token.holders.toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div className="w-full bg-black/50 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[#70E000] to-[#5BC000] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${token.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4 text-lg">No tokens created yet</div>
                      <Button className="bg-[#70E000] hover:bg-[#5BC000] text-black font-semibold px-8 py-3">
                        Create Your First Token
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "favorites" && (
                <div className="bg-[#151515] rounded-2xl p-6 border border-[#232323]">
                  <h3 className="text-xl font-bold text-white mb-6">Favorite Tokens</h3>
                  {favoriteTokens.length > 0 ? (
                    <div className="space-y-4">
                      {favoriteTokens.map((token) => (
                        <div 
                          key={token.id} 
                          className="bg-[#0E0E0E] rounded-xl p-6 border border-[#232323] hover:border-[#70E000]/50 transition-all duration-200 cursor-pointer group"
                          onClick={() => console.log('Navigate to token:', token.address)}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <img src={token.logo} alt={token.name} className="w-12 h-12 rounded-xl" />
                              <div>
                                <div className="text-white font-bold text-lg">{token.name} ({token.symbol})</div>
                                <div className="text-gray-400 text-sm">{token.address} • {token.createdAgo}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-white font-bold">{token.marketCap}</div>
                                <div className={`text-sm font-medium ${token.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                  {token.priceChange}
                                </div>
                              </div>
                              <button 
                                className="text-[#70E000] hover:text-[#5BC000] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Unfavorite token:', token.id);
                                }}
                              >
                                <Heart className="h-5 w-5 fill-current" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="text-gray-400 text-sm">Price</div>
                              <div className="text-white font-semibold">{token.price}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-sm">24h Volume</div>
                              <div className="text-white font-semibold">{token.volume}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-sm">Holders</div>
                              <div className="text-white font-semibold">{token.holders.toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div className="w-full bg-black/50 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[#70E000] to-[#5BC000] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${token.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-12 text-lg">No favorite tokens yet</div>
                  )}
                </div>
              )}

              {activeTab === "following" && isOwnProfile && (
                <div className="bg-[#151515] rounded-2xl p-6 border border-[#232323]">
                  <h3 className="text-xl font-bold text-white mb-6">Following</h3>
                  <div className="space-y-4">
                    {following.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-[#0E0E0E] rounded-xl border border-[#232323] hover:border-[#70E000]/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#70E000] to-[#5BC000] rounded-xl flex items-center justify-center text-lg">
                            {user.avatar}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="text-white font-semibold">{user.username}</div>
                              <div className="text-gray-400 text-sm">{user.followers.toLocaleString()} followers • {user.lastActive}</div>
                            </div>
                            {user.verified && (
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            )}
                          </div>
                        </div>
                        
                        <Button className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                          Unfollow
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Right Sidebar */}
            <div className="w-96 px-6 py-6">
              <div className="bg-[#151515] rounded-2xl p-6 border border-[#232323] sticky top-6">
                <h3 className="text-xl font-bold text-white mb-6">Who to follow</h3>
                
                <div className="space-y-4">
                  {suggestedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-[#0E0E0E] rounded-xl border border-[#232323] hover:border-[#70E000]/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#70E000] to-[#5BC000] rounded-xl flex items-center justify-center text-base">
                          {user.avatar}
                        </div>
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="min-w-0 flex-1">
                            <div className="text-white font-medium truncate">{user.username}</div>
                            <div className="text-gray-400 text-sm">{user.followers.toLocaleString()} followers</div>
                          </div>
                          {user.verified && (
                            <Star className="h-4 w-4 text-yellow-400 fill-current flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        className={`text-sm font-semibold px-5 py-2 rounded-lg flex-shrink-0 ${
                          user.isFollowing 
                            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                            : 'bg-[#70E000] hover:bg-[#5BC000] text-black'
                        }`}
                      >
                        {user.isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="pb-8"></div>
        </div>
      </div>

      {/* Enhanced Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#151515] rounded-2xl p-8 w-96 max-w-md border border-[#232323] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-[#232323]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Avatar Emoji
                </label>
                <Input
                  type="text"
                  value={editForm.avatar}
                  onChange={(e) => setEditForm({...editForm, avatar: e.target.value})}
                  className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000] rounded-xl"
                  placeholder="🐸"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Nickname
                </label>
                <Input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                  className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000] rounded-xl"
                  placeholder="Enter nickname"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Bio
                </label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000] rounded-xl min-h-[100px]"
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-[#232323] hover:bg-[#2A2A2A] text-white rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isEditLoading}
                  className={`flex-1 bg-gradient-to-r from-[#70E000] to-[#5BC000] hover:from-[#5BC000] hover:to-[#4AA000] text-black font-semibold rounded-xl ${isEditLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isEditLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
