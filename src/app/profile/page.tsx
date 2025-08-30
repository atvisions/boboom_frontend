"use client";
import { useState } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/home/SearchHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink, Edit, Check, Star, X, Heart } from "lucide-react";

export default function ProfilePage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("balances");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true); // 假设是自己的主页
  
  // 编辑表单数据
  const [editForm, setEditForm] = useState({
    avatar: "🐸",
    nickname: "hctd2j2",
    bio: "Lucas"
  });

  const handleCopy = () => {
    navigator.clipboard.writeText("HCtD2...270P");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 保存编辑数据
    setShowEditModal(false);
  };

  const suggestedUsers = [
    { id: 1, username: "9x9hwuqq", avatar: "🐸", followers: 1658, verified: false },
    { id: 2, username: "idosol99", avatar: "🪙", followers: 1655, verified: false },
    { id: 3, username: "regbtc", avatar: "🐸", followers: 1652, verified: false },
    { id: 4, username: "4bot", avatar: "🐸", followers: 1645, verified: true },
    { id: 5, username: "crypto_dev", avatar: "🐸", followers: 1634, verified: false },
  ];

  const balances = [
    { coin: "SOL", name: "Solana balance", amount: "4.1928", value: "$878", logo: "🟣" },
    { coin: "ETH", name: "Ethereum balance", amount: "0.2456", value: "$456", logo: "🔵" },
    { coin: "OKB", name: "OKB balance", amount: "12.5678", value: "$1,234", logo: "🟢" },
  ];

  const following = [
    { id: 1, username: "crypto_whale", avatar: "🐋", followers: 12500, verified: true },
    { id: 2, username: "defi_master", avatar: "⚡", followers: 8900, verified: false },
    { id: 3, username: "nft_collector", avatar: "🎨", followers: 6700, verified: true },
  ];

  const createdTokens = [
    { 
      id: 1, 
      name: "MyToken", 
      symbol: "MTK", 
      logo: "/tokens/bnb.png", 
      marketCap: "$45M", 
      volume: "$5,234", 
      progress: 45,
      address: "0xMyT...1234",
      createdAgo: "3d ago"
    },
    { 
      id: 2, 
      name: "TestCoin", 
      symbol: "TEST", 
      logo: "/tokens/doge.png", 
      marketCap: "$12M", 
      volume: "$1,890", 
      progress: 23,
      address: "0xTes...5678",
      createdAgo: "1w ago"
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
      progress: 35,
      address: "0xC02a...6Cc2",
      createdAgo: "2h ago"
    },
    { 
      id: 2, 
      name: "RocketInu", 
      symbol: "ROCKET", 
      logo: "/tokens/eth.png", 
      marketCap: "$89M", 
      volume: "$8,456", 
      progress: 67,
      address: "0xBtc0...0001",
      createdAgo: "5h ago"
    },
    { 
      id: 3, 
      name: "GeoToken", 
      symbol: "GEO", 
      logo: "/tokens/usdt.png", 
      marketCap: "$156M", 
      volume: "$23,789", 
      progress: 78,
      address: "0xKaW...9876",
      createdAgo: "1d ago"
    },
  ];

  return (
    <div className="flex h-screen bg-[#0E0E0E]">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Search Header */}
        <SearchHeader />
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-[#0E0E0E]">
          <div className="flex">
            {/* Left Content - 减小宽度 */}
            <div className="flex-1 px-6 py-6 max-w-4xl">
              {/* Profile Header */}
              <div className="bg-[#151515] rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Profile Picture */}
                    <div className="w-20 h-20 bg-[#70E000] rounded-full flex items-center justify-center text-2xl">
                      {editForm.avatar}
                    </div>
                    
                    {/* Profile Info */}
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-white mb-2">{editForm.nickname}</h1>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-gray-400">HCtD2...270P</span>
                        <button
                          onClick={handleCopy}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <a
                          href="#"
                          className="text-[#70E000] hover:text-[#5BC000] flex items-center space-x-1 transition-colors"
                        >
                          <span>View on solscan</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex space-x-6 mb-3">
                        <div className="text-center">
                          <div className="text-white font-semibold">0</div>
                          <div className="text-gray-400 text-sm">Followers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-semibold">0</div>
                          <div className="text-gray-400 text-sm">Following</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-semibold">0</div>
                          <div className="text-gray-400 text-sm">Created coins</div>
                        </div>
                      </div>
                      
                      <div className="text-white font-medium">{editForm.bio}</div>
                    </div>
                  </div>
                  
                  {/* 只有自己的主页才显示编辑按钮 */}
                  {isOwnProfile && (
                    <Button 
                      onClick={() => setShowEditModal(true)}
                      className="bg-[#70E000] hover:bg-[#5BC000] text-black font-semibold"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex space-x-8 mb-6 border-b border-[#232323]">
                {[
                  { id: "balances", label: "Balances" },
                  { id: "create", label: "Create" },
                  { id: "favorites", label: "Favorites" },
                  // 只有自己的主页才显示following标签
                  ...(isOwnProfile ? [{ id: "following", label: "Following" }] : [])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 px-1 font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-[#70E000] border-b-2 border-[#70E000]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content - 左对齐 */}
              {activeTab === "balances" && (
                <div className="bg-[#151515] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 text-left">Token Balances</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-400 font-medium text-left">
                    <div>Coins</div>
                    <div>MCap</div>
                    <div>Value</div>
                  </div>
                  
                  <div className="space-y-4">
                    {balances.map((balance, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-[#232323] last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{balance.logo}</span>
                          <div>
                            <div className="text-white font-medium">{balance.name}</div>
                            <div className="text-gray-400 text-sm">{balance.amount} {balance.coin}</div>
                          </div>
                        </div>
                        <div className="text-gray-400">-</div>
                        <div className="text-white font-semibold">{balance.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "create" && (
                <div className="bg-[#151515] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 text-left">Created Tokens</h3>
                  {createdTokens.length > 0 ? (
                    <div>
                      {/* Table Header */}
                      <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-400 font-medium text-left">
                        <div>Coin</div>
                        <div>MCap</div>
                        <div>Value</div>
                      </div>
                      
                      {/* Token List */}
                      <div className="space-y-3">
                        {createdTokens.map((token) => (
                          <div 
                            key={token.id} 
                            className="bg-[#0E0E0E] rounded-lg p-4 border border-[#232323] cursor-pointer hover:border-[#70E000] transition-colors"
                            onClick={() => {
                              // TODO: 跳转到代币详情页面
                              console.log('Navigate to token:', token.address);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <img src={token.logo} alt={token.name} className="w-10 h-10 rounded-lg" />
                                <div>
                                  <div className="text-white font-semibold">{token.name} ({token.symbol})</div>
                                  <div className="text-gray-400 text-sm">{token.address} • {token.createdAgo}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-semibold">{token.marketCap}</div>
                                <div className="text-gray-400 text-sm">{token.volume} 24h VOL</div>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">{token.progress}% MC: {token.marketCap}</span>
                                <span className="text-gray-400">{token.volume} 24h VOL</span>
                              </div>
                              <div className="w-full bg-black/90 rounded-full h-3">
                                <div 
                                  className="bg-[#70E000] h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${token.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">No tokens created yet</div>
                      <Button className="bg-[#70E000] hover:bg-[#5BC000] text-black font-semibold">
                        Create Your First Token
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "favorites" && (
                <div className="bg-[#151515] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 text-left">Favorite Tokens</h3>
                  {favoriteTokens.length > 0 ? (
                    <div>
                      {/* Table Header */}
                      <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-400 font-medium text-left">
                        <div>Coin</div>
                        <div>MCap</div>
                        <div>Value</div>
                      </div>
                      
                      {/* Token List */}
                      <div className="space-y-3">
                        {favoriteTokens.map((token) => (
                          <div 
                            key={token.id} 
                            className="bg-[#0E0E0E] rounded-lg p-4 border border-[#232323] cursor-pointer hover:border-[#70E000] transition-colors"
                            onClick={() => {
                              // TODO: 跳转到代币详情页面
                              console.log('Navigate to token:', token.address);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <img src={token.logo} alt={token.name} className="w-10 h-10 rounded-lg" />
                                <div>
                                  <div className="text-white font-semibold">{token.name} ({token.symbol})</div>
                                  <div className="text-gray-400 text-sm">{token.address} • {token.createdAgo}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <div className="text-white font-semibold">{token.marketCap}</div>
                                  <div className="text-gray-400 text-sm">{token.volume} 24h VOL</div>
                                </div>
                                <button 
                                  className="text-[#70E000] hover:text-[#5BC000]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: 取消收藏
                                    console.log('Unfavorite token:', token.id);
                                  }}
                                >
                                  <Heart className="h-5 w-5 fill-current" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">{token.progress}% MC: {token.marketCap}</span>
                                <span className="text-gray-400">{token.volume} 24h VOL</span>
                              </div>
                              <div className="w-full bg-black/90 rounded-full h-3">
                                <div 
                                  className="bg-[#70E000] h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${token.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-8">No favorite tokens yet</div>
                  )}
                </div>
              )}

              {activeTab === "following" && isOwnProfile && (
                <div className="bg-[#151515] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 text-left">Following</h3>
                  <div className="space-y-4">
                    {following.map((user) => (
                      <div key={user.id} className="flex items-center justify-between py-3 border-b border-[#232323] last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#70E000] rounded-full flex items-center justify-center text-sm">
                            {user.avatar}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="text-white font-medium">{user.username}</div>
                              <div className="text-gray-400 text-sm">{user.followers} followers</div>
                            </div>
                            {user.verified && (
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            )}
                          </div>
                        </div>
                        
                        <Button className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-1 h-8">
                          Unfollow
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - 增加宽度 */}
            <div className="w-96 px-6 py-6">
              <div className="bg-[#151515] rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Who to follow</h3>
                
                <div className="space-y-4">
                  {suggestedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#70E000] rounded-full flex items-center justify-center text-sm">
                          {user.avatar}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="text-white font-medium">{user.username}</div>
                            <div className="text-gray-400 text-sm">{user.followers} followers</div>
                          </div>
                          {user.verified && (
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          )}
                        </div>
                      </div>
                      
                      <Button className="bg-[#70E000] hover:bg-[#5BC000] text-black text-sm font-semibold px-4 py-1 h-8">
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom padding */}
          <div className="pb-8"></div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#151515] rounded-lg p-6 w-96 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Avatar Emoji
                </label>
                <Input
                  type="text"
                  value={editForm.avatar}
                  onChange={(e) => setEditForm({...editForm, avatar: e.target.value})}
                  className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]"
                  placeholder="🐸"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nickname
                </label>
                <Input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                  className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]"
                  placeholder="Enter nickname"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000] min-h-[80px]"
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-[#232323] hover:bg-[#2A2A2A] text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#70E000] hover:bg-[#5BC000] text-black font-semibold"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
