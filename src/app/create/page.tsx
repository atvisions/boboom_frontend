"use client";
import { useState } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/home/SearchHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Rocket, Upload, Image, X } from "lucide-react";

export default function CreateTokenPage() {
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
      
      // TODO: Call smart contract to create token
      // This would typically involve:
      // 1. Connecting to wallet
      // 2. Calling the createToken function on TokenFactoryV3
      // 3. Handling the transaction
      
      alert('Token creation initiated! Check your wallet for transaction confirmation.');
      
    } catch (error) {
      console.error('Token creation error:', error);
      alert('Failed to create token. Please try again.');
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

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isUploading}
                  className="bg-[#70E000] hover:bg-[#5BC000] text-black font-semibold px-8 py-3 rounded-lg flex items-center disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Uploading...
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
          </div>
        </div>
      </div>
    </div>
  );
}
