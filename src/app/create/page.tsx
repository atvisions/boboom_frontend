"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/common/SearchHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Rocket, Upload, Image, X } from "lucide-react";
import { useTokenFactoryWorking as useTokenFactory } from "@/hooks/useTokenFactoryWorking";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { toast } from "sonner";
import { TokenCreationFlow } from "../../components/ui/token-creation-flow";
// 删除旧的 TokenCreationStepsModal 引用
// 定义本地类型，满足 TokenCreationFlow 要求
export type ModalTokenData = {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  website: string;
  twitter: string;
  telegram: string;
  initialPurchase: number;
};

// 客户端专用组件
function CreateTokenForm() {
  const { address, isConnected, isClient } = useWalletAuth();
  const {
    // 配置状态
    isConfigLoading,
    configError,
    // 方法
    createToken,
    createTokenWithPurchase,
    approveOKB,
    // 授权独立状态
    approvalHash,
    isApprovalPending,
    isApprovalConfirming,
    // 创建独立状态
    createHash,
    actualCreateHash,
    isCreatePending,
    isCreateConfirming,
    // 数据
    okbBalance,
    okbAllowance,
    refetchOkbAllowance
  } = useTokenFactory();

  const [formData, setFormData] = useState({
    tokenName: "",
    tokenSymbol: "",
    description: "",
    imageUrl: "",
    website: "",
    twitter: "",
    telegram: ""
  });

  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [initialPurchase, setInitialPurchase] = useState<number>(0.1);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [pendingTokenData, setPendingTokenData] = useState<ModalTokenData | null>(null);

  // 表单验证逻辑
  const isFormValid = () => {
    if (!formData.tokenName.trim() || !formData.tokenSymbol.trim()) return false;
    if (!uploadedImage && !formData.imageUrl.trim()) return false;
    if (!isConnected || !address) return false;
    if (initialPurchase < 0.1) return false;
    if (okbBalance === 0 || initialPurchase > okbBalance) return false;
    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image size must be less than 5MB'); return; }

    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => { setImagePreview(e.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const removeImage = () => { setUploadedImage(null); setImagePreview(""); };

  const uploadImageToServer = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/tokens/upload-image', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      console.log('📤 Upload response:', data);
      if (data.success) {
        console.log('🖼️ Image URL returned:', data.data.url);
        return data.data.url;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    } finally { setIsUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) { toast.error('Please fill in all required fields correctly'); return; }

    try {
      let finalImageUrl = formData.imageUrl;
      if (uploadedImage) {
        try {
          finalImageUrl = await uploadImageToServer(uploadedImage);
          console.log('✅ Image uploaded successfully:', finalImageUrl);
        }
        catch (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          toast.error('Image upload failed, please try again');
          return; // 停止创建流程，要求用户重新上传
        }
      }
      if (!finalImageUrl) {
        toast.error('Please upload an image or provide an image URL');
        return;
      }

      // 处理社交媒体链接，确保格式正确
      const processUrl = (url: string, defaultValue: string = '') => {
        if (!url || url.trim() === '') return defaultValue;
        const trimmed = url.trim();
        // 如果没有协议，添加https://
        if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          return `https://${trimmed}`;
        }
        return trimmed;
      };

      const tokenData: ModalTokenData = {
        name: formData.tokenName,
        symbol: formData.tokenSymbol,
        description: formData.description || formData.tokenName, // 如果没有描述，使用代币名称
        imageUrl: finalImageUrl,
        website: processUrl(formData.website),
        twitter: processUrl(formData.twitter),
        telegram: processUrl(formData.telegram),
        initialPurchase
      };

      console.log('🎯 Token data prepared:', tokenData);

      // 记录开始创建新代币的时间戳，用于验证交易哈希的有效性
      console.log('Starting new token creation flow for:', tokenData.name);
      console.log('Current createHash before starting:', createHash);
      
      setPendingTokenData(tokenData);
      setShowStepsModal(true);
    } catch (error) {
      console.error('Token creation preparation error:', error);
      toast.error('Failed to prepare token creation. Please try again.');
    }
  };

  if (!isClient) {
    return (
      <div className="flex-1 px-6 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Token</h1>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // 处理授权OKB（改为调用hook）
  const handleApproveOKB = async (amount: number) => {
    await approveOKB(amount);
    // 轻量refetch，避免UI不同步
    setTimeout(() => { refetchOkbAllowance(); }, 3000);
  };

  // 处理创建代币
  const handleCreateToken = async (tokenData: ModalTokenData) => {
    if (!pendingTokenData) { toast.error('No pending token data found'); return; }
    const finalTokenData = pendingTokenData;
    try {
      if (finalTokenData.initialPurchase > 0) {
        await createTokenWithPurchase({
          name: finalTokenData.name,
          symbol: finalTokenData.symbol,
          description: finalTokenData.description,
          imageUrl: finalTokenData.imageUrl,
          website: finalTokenData.website,
          twitter: finalTokenData.twitter,
          telegram: finalTokenData.telegram,
          initialPurchase: finalTokenData.initialPurchase
        });
      } else {
        await createToken({
          name: finalTokenData.name,
          symbol: finalTokenData.symbol,
          description: finalTokenData.description,
          imageUrl: finalTokenData.imageUrl,
          website: finalTokenData.website,
          twitter: finalTokenData.twitter,
          telegram: finalTokenData.telegram,
        });
      }
    } catch (error) { throw error; }
  };

  // 检查代币地址
  const handleCheckTokenAddress = async (txHash: string): Promise<string | null> => {
    try {
      console.log('handleCheckTokenAddress called with txHash:', txHash);
      console.log('User address:', address);
      
      if (!txHash || !address) {
        console.error('Missing txHash or address:', { txHash, address });
        return null;
      }
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
      const apiUrl = `${backendUrl}/api/tokens/creators/${address?.toLowerCase()}/latest-token/?network=sepolia&tx_hash=${txHash}`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('API response text:', responseText);
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('API response data:', data);
          
          if (data.success && data.data && data.data.address) {
            console.log('✅ Found token address:', data.data.address);
            console.log('Token found by:', data.data.found_by);
            return data.data.address;
          } else {
            console.warn('⚠️ API returned success=false or no address:', data);
            return null;
          }
        } catch (parseError) {
          console.error('❌ Failed to parse JSON response:', parseError);
          console.error('Response text was:', responseText);
          return null;
        }
      } else {
        console.error('❌ API response not ok:', response.status, responseText);
        
        // 尝试解析错误响应
        try {
          const errorData = JSON.parse(responseText);
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response as JSON');
        }
        
        return null;
      }
    } catch (error) { 
      console.error('❌ Exception in handleCheckTokenAddress:', error); 
      return null; 
    }
  };

  return (
    <div className="flex-1 px-6 py-6">
      {/* 全自动创建流程弹窗 */}
      {pendingTokenData && (
        <TokenCreationFlow
          isOpen={showStepsModal}
          onClose={() => { setShowStepsModal(false); setPendingTokenData(null); }}
          tokenData={pendingTokenData}
          okbAllowance={okbAllowance}
          onApproveOKB={handleApproveOKB}
          onCreateToken={handleCreateToken}
          onCheckTokenAddress={handleCheckTokenAddress}
          isApproving={isApprovalPending || isApprovalConfirming}
          isCreating={isCreatePending || isCreateConfirming}
          approvalHash={approvalHash}
          txHash={actualCreateHash}
        />
      )}
      
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Token</h1>
        <p className="text-gray-400">Launch your next viral token project</p>
      </div>

      {/* Configuration Loading Check */}
      {isConfigLoading && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <p className="text-blue-400 text-center">Loading contract configuration...</p>
        </div>
      )}

      {/* Configuration Error Check */}
      {configError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-center">Failed to load contract configuration: {configError}</p>
        </div>
      )}

      {/* Wallet Connection Check */}
      {!isConnected && !isConfigLoading && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <p className="text-yellow-400 text-center">Please connect your wallet to create a token</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Basic Information */}
        <div className="bg-[#151515] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Rocket className="mr-2 h-5 w-5 text-[#70E000]" />
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Token Name *</label>
              <Input type="text" placeholder="e.g., ShibaBNB" value={formData.tokenName} onChange={(e) => handleInputChange("tokenName", e.target.value)} className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Token Symbol *</label>
              <Input type="text" placeholder="e.g., SHIB" value={formData.tokenSymbol} onChange={(e) => handleInputChange("tokenSymbol", e.target.value)} className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <Textarea placeholder="Describe your token project..." value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000] min-h-[100px]" rows={4} />
            </div>
          </div>
        </div>

        {/* Token Image */}
        <div className="bg-[#151515] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Image className="mr-2 h-5 w-5 text-[#70E000]" />
            Token Image *
          </h2>
          <div className="space-y-4">
            {!imagePreview ? (
              <label htmlFor="image-upload" className="block cursor-pointer">
                <div className="border-2 border-dashed border-[#232323] rounded-lg p-8 text-center hover:border-[#70E000] transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-gray-400 mb-2"><span className="text-[#70E000] hover:text-[#5BC000]">Click to upload</span> or drag and drop</div>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            ) : (
              <div className="relative">
                <div className="w-full h-48 rounded-lg overflow-hidden bg-[#0a0a0a] flex items-center justify-center">
                  <img src={imagePreview} alt="Token preview" className="w-full h-full object-contain rounded-lg" />
                </div>
                <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Or provide image URL</label>
              <Input type="url" placeholder="https://example.com/token-image.png" value={formData.imageUrl} onChange={(e) => handleInputChange("imageUrl", e.target.value)} className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]" />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-[#151515] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Rocket className="mr-2 h-5 w-5 text-[#70E000]" />
            Social Links (Optional)
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
              <Input type="url" placeholder="https://yourwebsite.com" value={formData.website} onChange={(e) => handleInputChange("website", e.target.value)} className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Twitter/X</label>
              <Input type="url" placeholder="https://twitter.com/yourhandle" value={formData.twitter} onChange={(e) => handleInputChange("twitter", e.target.value)} className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Telegram</label>
              <Input type="url" placeholder="https://t.me/yourgroup" value={formData.telegram} onChange={(e) => handleInputChange("telegram", e.target.value)} className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]" />
            </div>
          </div>
        </div>

        {/* Initial Purchase */}
        <div className="bg-[#151515] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Rocket className="mr-2 h-5 w-5 text-[#70E000]" />
            Initial Purchase (Required)
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Initial OKB Purchase</label>
                {isConnected && (
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>Balance: <span className={`font-medium ${(okbBalance || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>{(okbBalance || 0).toFixed(4)} OKB</span></div>
                    <div>Authorized: <span className={`font-medium ${(okbAllowance || 0) > 0 ? 'text-blue-400' : 'text-yellow-400'}`}>{(okbAllowance || 0).toFixed(4)} OKB</span></div>
                  </div>
                )}
              </div>
              <Input type="number" placeholder="0.1" value={initialPurchase.toString()} onChange={(e) => setInitialPurchase(Number(e.target.value) || 0.1)} className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]" min="0.1" step="0.1" required />
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-400">Required. Minimum initial purchase: 0.1 OKB.</p>
                {isConnected && (okbBalance || 0) === 0 && (<p className="text-sm text-red-400 flex items-center"><span className="mr-1">⚠️</span>You have no OKB tokens. You cannot create a token.</p>)}
                {isConnected && initialPurchase > 0 && initialPurchase < 0.1 && (<p className="text-sm text-red-400 flex items-center"><span className="mr-1">⚠️</span>Minimum initial purchase amount is 0.1 OKB.</p>)}
                {isConnected && initialPurchase > (okbBalance || 0) && (okbBalance || 0) > 0 && (<p className="text-sm text-red-400 flex items-center"><span className="mr-1">⚠️</span>Insufficient OKB balance. You need {initialPurchase.toFixed(4)} OKB but have {(okbBalance || 0).toFixed(4)} OKB.</p>)}
                {isConnected && initialPurchase > 0 && initialPurchase <= (okbBalance || 0) && (okbAllowance || 0) < initialPurchase && (<p className="text-sm text-yellow-400 flex items-center"><span className="mr-1">⚠️</span>Authorization required. You need to authorize {initialPurchase.toFixed(4)} OKB but only {(okbAllowance || 0).toFixed(4)} OKB is authorized.</p>)}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={!isFormValid() || isUploading || isCreatePending || isCreateConfirming || isApprovalPending || isApprovalConfirming} className="font-semibold px-8 py-3 rounded-lg flex items-center disabled:opacity-50 bg-[#70E000] hover:bg-[#5BC000] text-black disabled:bg-gray-600 disabled:text-gray-400">
            {isUploading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>Uploading...</>) : (<><Rocket className="mr-2 h-5 w-5" />Create Token</>)}
          </Button>
        </div>
      </form>

    </div>
  );
}

// 主页面组件
export default function CreateTokenPage() {
  return (
    <div className="flex h-screen bg-[#0E0E0E]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Search Header */}
        <SearchHeader />
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <CreateTokenForm />
        </div>
      </div>
    </div>
  );
}
