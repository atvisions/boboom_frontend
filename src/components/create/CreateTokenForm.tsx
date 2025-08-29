"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { sepolia } from 'wagmi/chains';
import { notifySuccess, notifyError, notifyInfo } from "@/lib/notify";
import { ImageUploader } from "@/components/create/ImageUploader";
import { OKBChecker } from "@/components/create/OKBChecker";
import { CONTRACT_ADDRESSES, OKB_TOKEN_ABI } from "@/config/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Rocket, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Info,
  Globe,
  Coins,
  Shield,
  Zap
} from "lucide-react";

// TokenFactory ABI
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
  initialPurchase: "1",
};

export function CreateTokenForm() {
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'approve' | 'create'>('form');

  const { writeContract: writeApprove, data: approveHash, error: approveError } = useWriteContract();
  const { writeContract: writeCreate, data: createHash, error: createError } = useWriteContract();

  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const { isLoading: isCreateLoading, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleImageUpload = useCallback((imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  }, []);

  const validateForm = useCallback((): string | null => {
    if (!isConnected) return "Please connect your wallet first";
    
    if (chain?.id !== 11155111) {
      return "Please switch to Sepolia Testnet (Chain ID: 11155111)";
    }
    
    if (!formData.name.trim()) return "Token name is required";
    if (!formData.symbol.trim()) return "Token symbol is required";
    if (!formData.description.trim()) return "Token description is required";
    if (!formData.imageUrl.trim()) return "Please upload token logo";
    
    const amount = parseFloat(formData.initialPurchase);
    if (isNaN(amount) || amount <= 0) return "Initial purchase amount must be greater than 0";
    if (amount < 0.1) return "Minimum initial purchase is 0.1 OKB";

    return null;
  }, [isConnected, chain?.id, formData]);

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
      const okbAmount = parseUnits(formData.initialPurchase, 18);
      
      notifyInfo('Step 1/2', 'Authorizing OKB...');
      
      writeApprove({
        address: CONTRACT_ADDRESSES.okbToken,
        abi: OKB_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.tokenFactory, okbAmount],
        chain: sepolia,
        account: address,
      });
      
    } catch (error) {
      console.error('Submit error:', error);
      notifyError('Transaction Failed', 'OKB approval failed');
      setIsSubmitting(false);
      setStep('form');
    }
  }, [formData, validateForm, writeApprove, address]);

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
        chain: sepolia,
        account: address,
      });
    }
  }, [isApproveSuccess, step, formData, writeCreate, address]);

  React.useEffect(() => {
    if (isCreateSuccess && step === 'create') {
      notifySuccess('Token Created!', `${formData.name} was created successfully`);
      setIsSubmitting(false);
      setStep('form');
      
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }, [isCreateSuccess, step, formData.name, router]);

  React.useEffect(() => {
    if (approveError || createError) {
      const error = approveError || createError;
      console.error('Contract error:', error);
      notifyError('Transaction Failed', error?.message || 'Unknown error occurred');
      setIsSubmitting(false);
      setStep('form');
    }
  }, [approveError, createError]);

  const getStatusText = () => {
    if (!isSubmitting) return 'Create Token';
    switch (step) {
      case 'approve':
        return 'Authorizing OKB...';
      case 'create':
        return 'Creating Token...';
      default:
        return 'Create Token';
    }
  };

  return (
    <div className="min-h-screen bg-background py-14">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Rocket className="h-9 w-9 text-primary mr-3" />
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                Create New Token
              </h1>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Launch your own token on a bonding curve. Creators need an initial purchase to kickstart the project.
            </p>
          </div>

          {/* Network Warning */}
          {isConnected && chain?.id !== 11155111 && (
            <Card className="mb-8 border-red-500/20 bg-red-500/5 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-red-500">
                      ⚠️ Wrong network detected!
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>Current Network:</strong> {chain?.name || 'Unknown'} (ID: {chain?.id})</p>
                      <p><strong>Required Network:</strong> Sepolia Testnet (ID: 11155111)</p>
                      <p>Please switch to Sepolia Testnet in MetaMask to continue safely.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Form */}
            <div className="lg:col-span-2">
              <Card className="border-border/50 bg-card/60 backdrop-blur rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Zap className="h-5 w-5 text-primary" />
                    Token Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleSubmit} className="space-y-7">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        Token Logo *
                      </label>
                      <ImageUploader
                        currentImageUrl={formData.imageUrl}
                        onImageUpload={handleImageUpload}
                      />
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">
                          Token Name *
                        </label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="e.g. My Super Token"
                          className="h-11 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">
                          Token Symbol *
                        </label>
                        <Input
                          type="text"
                          value={formData.symbol}
                          onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                          placeholder="e.g. MST"
                          className="h-11 text-base"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        Description *
                      </label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your token and its purpose..."
                        rows={5}
                        className="text-base"
                      />
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Social Links (optional)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Website
                          </label>
                          <Input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Twitter
                          </label>
                          <Input
                            type="text"
                            value={formData.twitter}
                            onChange={(e) => handleInputChange('twitter', e.target.value)}
                            placeholder="@yourhandle"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Telegram
                          </label>
                          <Input
                            type="text"
                            value={formData.telegram}
                            onChange={(e) => handleInputChange('telegram', e.target.value)}
                            placeholder="@yourgroup"
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Initial Purchase */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">
                          Initial Purchase (OKB) *
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={formData.initialPurchase}
                            onChange={(e) => handleInputChange('initialPurchase', e.target.value)}
                            placeholder="1.0"
                            className="pr-16 h-11 text-base"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                            OKB
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          As the creator, you must make an initial purchase. Minimum: 0.1 OKB
                        </p>
                      </div>
                      <OKBChecker requiredAmount={formData.initialPurchase} />
                    </div>

                    <Separator />

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={isSubmitting || !isConnected || chain?.id !== 11155111}
                      size="lg"
                      className="w-full text-lg py-6"
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      )}
                      {getStatusText()}
                    </Button>

                    {!isConnected ? (
                      <p className="text-center text-destructive text-sm">
                        Please connect your wallet to create a token
                      </p>
                    ) : chain?.id !== 11155111 ? (
                      <p className="text-center text-destructive text-sm">
                        ⚠️ Please switch to Sepolia Testnet to create safely
                      </p>
                    ) : null}
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-24 self-start">
              {/* How it works */}
              <Card className="border-border/50 bg-card/60 backdrop-blur rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    How it works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">Token launches on a bonding curve</p>
                        <p className="text-muted-foreground">Initial price around $0.00005</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">Graduate to DEX after 200 OKB collected</p>
                        <p className="text-muted-foreground">Auto liquidity management</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">1% platform fee on every trade</p>
                        <p className="text-muted-foreground">Sustains platform development</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">Creators must make an initial purchase</p>
                        <p className="text-muted-foreground">Signals commitment</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Tips */}
              <Card className="border-border/50 bg-card/60 backdrop-blur rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Security Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Ensure you are on Sepolia Testnet</p>
                    <p>• Double-check all inputs</p>
                    <p>• Token basics cannot be changed after creation</p>
                    <p>• Test on testnet first if possible</p>
                  </div>
                </CardContent>
              </Card>

              {/* Fees */}
              <Card className="border-border/50 bg-card/60 backdrop-blur rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    Fees
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Initial Purchase</span>
                      <span className="font-medium">≥ 0.1 OKB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Trading Fee</span>
                      <span className="font-medium">1%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Network Fee</span>
                      <span className="font-medium">~$0.01-0.05</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}