"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits } from "viem";
import { notifySuccess, notifyError, notifyInfo } from "@/lib/notify";
import { ImageUploader } from "@/components/create/ImageUploader";
import { OKBChecker } from "@/components/create/OKBChecker";

// 合约配置
const CONTRACT_ADDRESSES = {
  tokenFactory: "0x2750db4d488841Ef49F21D47093Ce7F7B93Ef236",
  okbToken: "0xDF021922E0Be7f7dCeF2Cb4809e7D2c28C4133fe",
} as const;

// TokenFactory ABI (只包含需要的函数)
const TOKEN_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string", "name": "imageUrl", "type": "string"},
      {"internalType": "string", "name": "website", "type": "string"},
      {"internalType": "string", "name": "twitter", "type": "string"},
      {"internalType": "string", "name": "telegram", "type": "string"},
      {"internalType": "uint256", "name": "okbAmount", "type": "uint256"}
    ],
    "name": "createTokenWithPurchase",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// OKB Token ABI (包含 approve 和 balanceOf 函数)
const OKB_TOKEN_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface FormData {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  website: string;
  twitter: string;
  telegram: string;
  initialPurchase: string;
}

const initialFormData: FormData = {
  name: "",
  symbol: "",
  description: "",
  imageUrl: "",
  website: "",
  twitter: "",
  telegram: "",
  initialPurchase: "1", // 默认1 OKB
};

export default function CreateTokenPage() {
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'approve' | 'create'>('form');

  // 合约写入hooks
  const { writeContract: writeApprove, data: approveHash, error: approveError } = useWriteContract();
  const { writeContract: writeCreate, data: createHash, error: createError } = useWriteContract();

  // 交易等待hooks
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const { isLoading: isCreateLoading, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  // 处理表单输入
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 处理logo上传成功
  const handleImageUpload = useCallback((imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }));
    // 成功提示已在 ImageUploader 组件中处理，避免重复
  }, []);

  // 表单验证
  const validateForm = useCallback((): string | null => {
    if (!isConnected) return "Please connect your wallet";
    
    // 🚨 网络检查 - 防止在主网操作！
    if (chain?.id !== 11155111) {
      return "Please switch to Sepolia test network (Chain ID: 11155111)";
    }
    
    if (!formData.name.trim()) return "Token name is required";
    if (!formData.symbol.trim()) return "Token symbol is required";
    if (!formData.description.trim()) return "Token description is required";
    if (!formData.imageUrl.trim()) return "Token logo is required";
    
    // 验证初始购买金额
    const amount = parseFloat(formData.initialPurchase);
    if (isNaN(amount) || amount <= 0) return "Initial purchase must be greater than 0";
    if (amount < 0.1) return "Initial purchase must be at least 0.1 OKB";

    return null;
  }, [isConnected, chain?.id, formData]);

  // 提交创建代币
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      notifyError('Validation Error', error);
      return;
    }

    setIsSubmitting(true);
    setStep('approve');

    try {
      // 步骤1：授权OKB代币
      const okbAmount = parseUnits(formData.initialPurchase, 18);
      
      console.log('Approving OKB:', {
        okbTokenAddress: CONTRACT_ADDRESSES.okbToken,
        tokenFactoryAddress: CONTRACT_ADDRESSES.tokenFactory,
        amount: formData.initialPurchase,
        amountWei: okbAmount.toString(),
      });
      
      notifyInfo('Step 1/2', 'Approving OKB tokens...');
      
      writeApprove({
        address: CONTRACT_ADDRESSES.okbToken,
        abi: OKB_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.tokenFactory, okbAmount],
      });

    } catch (error) {
      console.error('Submit error:', error);
      notifyError('Transaction Failed', 'Failed to start token creation');
      setIsSubmitting(false);
      setStep('form');
    }
  }, [formData, validateForm, writeApprove]);

  // 监听授权完成，自动执行创建
  React.useEffect(() => {
    if (isApproveSuccess && step === 'approve') {
      setStep('create');
      
      const okbAmount = parseUnits(formData.initialPurchase, 18);
      
      notifyInfo('Step 2/2', 'Creating token...');
      
      writeCreate({
        address: CONTRACT_ADDRESSES.tokenFactory,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'createTokenWithPurchase',
        args: [
          formData.name,
          formData.symbol,
          formData.description,
          formData.imageUrl,
          formData.website,
          formData.twitter,
          formData.telegram,
          okbAmount,
        ],
      });
    }
  }, [isApproveSuccess, step, formData, writeCreate]);

  // 监听创建完成
  React.useEffect(() => {
    if (isCreateSuccess && step === 'create') {
      notifySuccess('Token Created!', `${formData.name} has been created successfully`);
      setIsSubmitting(false);
      setStep('form');
      
      // 3秒后跳转到首页
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }, [isCreateSuccess, step, formData.name, router]);

  // 处理错误
  React.useEffect(() => {
    if (approveError || createError) {
      const error = approveError || createError;
      console.error('Contract error:', error);
      notifyError('Transaction Failed', error?.message || 'Unknown error occurred');
      setIsSubmitting(false);
      setStep('form');
    }
  }, [approveError, createError]);

  // 获取当前状态文本
  const getStatusText = () => {
    if (!isSubmitting) return 'Create Token';
    switch (step) {
      case 'approve':
        return isApproveLoading ? 'Approving OKB...' : 'Waiting for approval...';
      case 'create':
        return isCreateLoading ? 'Creating Token...' : 'Waiting for creation...';
      default:
        return 'Create Token';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#090A1A' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">Create New Token</h1>
            <p className="text-gray-400">
              Launch your own token on the bonding curve. Creators must make an initial purchase.
            </p>
          </div>

          {/* 网络检查警告 */}
          {isConnected && chain?.id !== 11155111 && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-semibold text-red-400">⚠️ Wrong Network Detected!</h3>
              </div>
              <div className="space-y-2 text-red-300">
                <p><strong>Current Network:</strong> {chain?.name || 'Unknown'} (ID: {chain?.id})</p>
                <p><strong>Required Network:</strong> Sepolia test network (ID: 11155111)</p>
                <p className="text-sm">Please switch to Sepolia test network in MetaMask to continue safely.</p>
              </div>
            </div>
          )}

          {/* 创建表单 */}
          <div className="rounded-2xl border border-white/10 p-6" style={{ backgroundColor: '#17182D' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Logo上传 */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Token Logo *
                </label>
                <ImageUploader
                  currentImageUrl={formData.imageUrl}
                  onImageUpload={handleImageUpload}
                />
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Token Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. My Awesome Token"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Token Symbol *
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                    placeholder="e.g. MAT"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your token and its purpose..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                />
              </div>

              {/* 社交媒体链接 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Social Links (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={formData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      placeholder="@yourhandle"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telegram
                    </label>
                    <input
                      type="text"
                      value={formData.telegram}
                      onChange={(e) => handleInputChange('telegram', e.target.value)}
                      placeholder="@yourgroup"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 初始购买金额 */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Initial Purchase Amount (OKB) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.initialPurchase}
                    onChange={(e) => handleInputChange('initialPurchase', e.target.value)}
                    placeholder="1.0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent pr-16"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    OKB
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  As the creator, you must make an initial purchase. Minimum: 0.1 OKB
                </p>
                
                {/* OKB 余额检查 */}
                <div className="mt-3">
                  <OKBChecker requiredAmount={formData.initialPurchase} />
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={isSubmitting || !isConnected || chain?.id !== 11155111}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
              >
                {isSubmitting && (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {getStatusText()}
              </button>

              {!isConnected ? (
                <p className="text-center text-red-400 text-sm">
                  Please connect your wallet to create a token
                </p>
              ) : chain?.id !== 11155111 ? (
                <p className="text-center text-red-400 text-sm">
                  ⚠️ Please switch to Sepolia test network to create tokens safely
                </p>
              ) : null}
            </form>
          </div>

          {/* 创建说明 */}
          <div className="mt-8 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">How it works</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Your token will be deployed on the bonding curve</li>
              <li>• Initial price starts at ~$0.00005</li>
              <li>• Token graduates to DEX after collecting 200 OKB</li>
              <li>• 1% fee on all trades goes to platform</li>
              <li>• You must make an initial purchase as the creator</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}