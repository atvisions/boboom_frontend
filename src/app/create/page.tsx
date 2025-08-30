"use client";
import { useState } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/home/SearchHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Rocket, Upload, Image, X } from "lucide-react";
import { useTokenFactory } from "@/hooks/useTokenFactory";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { toast } from "sonner";

export default function CreateTokenPage() {
  const { address, isConnected, isClient } = useWalletAuth();
  const { createToken, createTokenWithPurchase, isPending, isConfirming, isSuccess, okbBalance } = useTokenFactory();
  
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
  const [initialPurchase, setInitialPurchase] = useState<number>(0);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview("");
    setFormData(prev => ({ ...prev, imageUrl: "" }));
  };

  const uploadImageToServer = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/tokens/upload-image/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    // 验证OKB余额（如果有初始购买）
    if (initialPurchase > 0) {
      if (initialPurchase < 0.1) {
        toast.error('Minimum initial purchase amount is 0.1 OKB.');
        return;
      }
      if (okbBalance === 0) {
        toast.error('You have no OKB tokens. Cannot make initial purchase.');
        return;
      }
      if (initialPurchase > okbBalance) {
        toast.error(`Insufficient OKB balance. You need ${initialPurchase.toFixed(4)} OKB but have ${okbBalance.toFixed(4)} OKB.`);
        return;
      }
    }
    
    try {
      let finalImageUrl = formData.imageUrl;
      
      // Upload image if a new one was selected
      if (uploadedImage) {
        finalImageUrl = await uploadImageToServer(uploadedImage);
      }

      const tokenData = {
        ...formData,
        imageUrl: finalImageUrl
      };

      console.log("Token creation data:", tokenData);
      
      // Call smart contract to create token
      if (initialPurchase > 0) {
        await createTokenWithPurchase({
          name: tokenData.tokenName,
          symbol: tokenData.tokenSymbol,
          description: tokenData.description,
          imageUrl: tokenData.imageUrl,
          website: tokenData.website,
          twitter: tokenData.twitter,
          telegram: tokenData.telegram,
          initialPurchase
        });
      } else {
        await createToken({
          name: tokenData.tokenName,
          symbol: tokenData.tokenSymbol,
          description: tokenData.description,
          imageUrl: tokenData.imageUrl,
          website: tokenData.website,
          twitter: tokenData.twitter,
          telegram: tokenData.telegram,
        });
      }
      
    } catch (error) {
      console.error('Token creation error:', error);
      toast.error('Failed to create token. Please try again.');
    }
  };

  return (
    <div className="flex h-screen bg-[#0E0E0E]">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Search Header */}
        <SearchHeader />
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Left Content */}
          <div className="flex-1 px-6 py-6">
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Create New Token</h1>
              <p className="text-gray-400">Launch your next viral token project</p>
            </div>

            {/* Wallet Connection Check */}
            {!isConnected && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <p className="text-yellow-400 text-center">
                  Please connect your wallet to create a token
                </p>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                <p className="text-green-400 text-center">
                  Token created successfully! Check your wallet for transaction details.
                </p>
              </div>
            )}

            {isClient && (
              <form onSubmit={handleSubmit} className="max-w-2xl">
                {/* Basic Information */}
                <div className="bg-[#151515] rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Rocket className="mr-2 h-5 w-5 text-[#70E000]" />
                  Basic Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Token Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., ShibaBNB"
                      value={formData.tokenName}
                      onChange={(e) => handleInputChange("tokenName", e.target.value)}
                      className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Token Symbol *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., SHIB"
                      value={formData.tokenSymbol}
                      onChange={(e) => handleInputChange("tokenSymbol", e.target.value)}
                      className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <Textarea
                      placeholder="Describe your token project..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000] min-h-[100px]"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Token Image */}
              <div className="bg-[#151515] rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Image className="mr-2 h-5 w-5 text-[#70E000]" />
                  Token Image
                </h2>
                
                <div className="space-y-4">
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-[#232323] rounded-lg p-8 text-center hover:border-[#70E000] transition-colors">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-gray-400 mb-2">
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className="text-[#70E000] hover:text-[#5BC000]">Click to upload</span> or drag and drop
                        </label>
                      </div>
                      <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Token preview"
                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Or enter image URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com/token-image.png"
                      value={formData.imageUrl}
                      onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                      className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-[#151515] rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Rocket className="mr-2 h-5 w-5 text-[#70E000]" />
                  Social Links
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Website
                    </label>
                    <Input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Twitter/X
                    </label>
                    <Input
                      type="url"
                      placeholder="https://twitter.com/yourhandle"
                      value={formData.twitter}
                      onChange={(e) => handleInputChange("twitter", e.target.value)}
                      className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telegram
                    </label>
                    <Input
                      type="url"
                      placeholder="https://t.me/yourgroup"
                      value={formData.telegram}
                      onChange={(e) => handleInputChange("telegram", e.target.value)}
                      className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]"
                    />
                  </div>
                </div>
              </div>

              {/* Initial Purchase */}
              <div className="bg-[#151515] rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Rocket className="mr-2 h-5 w-5 text-[#70E000]" />
                  Initial Purchase (Optional)
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      OKB Amount for Initial Purchase
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={initialPurchase}
                      onChange={(e) => setInitialPurchase(Number(e.target.value) || 0)}
                      className="bg-[#0E0E0E] border-[#232323] text-white placeholder-gray-500 focus:border-[#70E000] focus:ring-[#70E000]"
                      min="0.1"
                      step="0.1"
                    />
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-400">
                        Leave empty to create token without initial purchase. Minimum purchase is 0.1 OKB.
                      </p>
                      {isClient && isConnected && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Your OKB Balance:</span>
                          <span className={`text-sm font-medium ${okbBalance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {okbBalance.toFixed(4)} OKB
                          </span>
                        </div>
                      )}
                      {isClient && isConnected && okbBalance === 0 && (
                        <p className="text-sm text-red-400 flex items-center">
                          <span className="mr-1">⚠️</span>
                          You have no OKB tokens. You cannot make an initial purchase.
                        </p>
                      )}
                      {isClient && isConnected && initialPurchase > 0 && initialPurchase < 0.1 && (
                        <p className="text-sm text-red-400 flex items-center">
                          <span className="mr-1">⚠️</span>
                          Minimum initial purchase amount is 0.1 OKB.
                        </p>
                      )}
                      {isClient && isConnected && initialPurchase > 0 && initialPurchase > okbBalance && (
                        <p className="text-sm text-red-400 flex items-center">
                          <span className="mr-1">⚠️</span>
                          Insufficient OKB balance. You need {initialPurchase.toFixed(4)} OKB but have {okbBalance.toFixed(4)} OKB.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isUploading || isPending || isConfirming}
                  className="bg-[#70E000] hover:bg-[#5BC000] text-black font-semibold px-8 py-3 rounded-lg flex items-center disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Uploading...
                    </>
                  ) : isPending || isConfirming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      {isPending ? 'Creating Token...' : 'Confirming...'}
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-5 w-5" />
                      Create Token
                    </>
                  )}
                </Button>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
