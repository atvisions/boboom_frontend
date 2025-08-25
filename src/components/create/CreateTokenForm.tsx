"use client"

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from 'wagmi';
import { useRouter } from 'next/navigation';
import { decodeEventLog, ParseAbiItem, parseUnits, formatUnits, erc20Abi, MaxUint256 } from 'viem';
import { Loader2, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { tokenFactoryV3Address, tokenFactoryV3Abi, okbTokenAddress, bondingCurveV3Address, bondingCurveV3Abi } from '@/lib/contracts';

// --- Form Schema and Type ---
const schema = z.object({
  name: z.string().min(1, 'Token name is required').max(50),
  symbol: z.string().min(1, 'Token symbol is required').max(10),
  description: z.string().min(1, 'Description is required').max(500),
  website: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  telegram: z.string().url().optional().or(z.literal('')),
  okbAmount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().gt(0, { message: 'Initial purchase must be greater than 0' })
  ),
});
type FormData = z.infer<typeof schema>;

// --- Component ---
export function CreateTokenForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' });
  const { address, isConnected } = useAccount();
  const { data: hash, writeContractAsync, isPending: isWritePending, reset: resetWriteContract } = useWriteContract();

  // State Management
  const [status, setStatus] = useState<'idle' | 'uploading' | 'approving' | 'creating' | 'syncing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  // Wagmi hooks for approval flow
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: okbTokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, tokenFactoryV3Address],
    query: { enabled: !!address },
  });

  // Wait for transaction confirmation
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });



  // --- Handlers ---
    const handleFileSelect = (file: File | null) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File is too large. Maximum size is 5MB.');
        return;
      }
      setError(null);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  // Effect to handle transaction confirmations and orchestrate the creation flow
  useEffect(() => {
    if (!isConfirmed || !receipt) return;

    const processConfirmation = async () => {
      // Approval transaction was successful
      if (status === 'approving') {
        await refetchAllowance();
        if (submittedData) {
          console.log('Approval confirmed, proceeding to create token...');
          handleCreateToken(submittedData);
        }
        return;
      }

      // Creation transaction was successful
      if (status === 'creating' && submittedData && address && hash) {
        // First, check if the transaction was successful
        if (receipt.status !== 'success') {
            setError('Transaction failed. Please check your wallet for details.');
            setStatus('error');
            return;
        }

        setStatus('syncing');
        try {
          // 1. Find and decode both TokenCreated and TokenPurchased events.
          // Their order in the logs is not guaranteed, so we find them independently.
          const tokenCreatedEventAbi = tokenFactoryV3Abi.find(item => item.name === 'TokenCreated' && item.type === 'event');
          const tokenPurchasedEventAbi = bondingCurveV3Abi.find(item => item.name === 'TokenPurchased' && item.type === 'event');
          if (!tokenCreatedEventAbi || !tokenPurchasedEventAbi) {
            throw new Error('Could not find necessary event ABIs.');
          }

          // Step 1: Find and decode the TokenCreated event to get the new token's address.
          const tokenCreatedLog = receipt.logs.find(l => l.address.toLowerCase() === tokenFactoryV3Address.toLowerCase());
          if (!tokenCreatedLog) throw new Error('TokenCreated event log not found in transaction receipt.');
          const decodedTokenCreatedEvent = decodeEventLog({ abi: [tokenCreatedEventAbi], data: tokenCreatedLog.data, topics: tokenCreatedLog.topics });
          const newTokenAddress = (decodedTokenCreatedEvent.args as any).token;
          if (!newTokenAddress) throw new Error('Could not decode token address from event.');

          // Step 2: With the new token address, find the TokenPurchased event emitted from it.
          let tokens_out, new_price;
          const tokenPurchasedLog = receipt.logs.find(l => l.address.toLowerCase() === newTokenAddress.toLowerCase());
          if (!tokenPurchasedLog) throw new Error('TokenPurchased event log not found in transaction receipt.');

          try {
            const decodedTokenPurchasedEvent = decodeEventLog({ abi: [tokenPurchasedEventAbi], data: tokenPurchasedLog.data, topics: tokenPurchasedLog.topics });
            tokens_out = (decodedTokenPurchasedEvent.args as any).tokens_out;
            new_price = (decodedTokenPurchasedEvent.args as any).new_price;
          } catch (e) {
            console.error("Failed to decode TokenPurchased event:", e);
            throw new Error('Could not decode initial purchase details from event logs.');
          }

          if (!newTokenAddress) throw new Error('Could not decode token address from event logs.');
          if (tokens_out === undefined || new_price === undefined) {
            throw new Error('Could not decode initial purchase details from event logs.');
          }

          if (tokens_out === undefined || new_price === undefined) {
            throw new Error('Could not decode initial purchase details from event.');
          }

          console.log(`Token created at address: ${newTokenAddress}. Syncing with backend...`);

          // 3. Sync with backend, now including purchase details
          const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
          const response = await fetch(`${apiUrl}/api/tokens/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...submittedData,
              address: newTokenAddress,
              creator_address: address,
              blockchain_tx_hash: hash,
              image_url: imageUrl,
              okbAmount: submittedData.okbAmount.toString(),
              // Add initial purchase details, formatted as strings
              tokensOut: formatUnits(tokens_out, 18),
              newPrice: formatUnits(new_price, 18),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to sync token with backend.');
          }

          const result = await response.json();
          if (!result.success) throw new Error(result.error || 'Backend sync failed.');

          setStatus('success');
          router.push(`/token/${newTokenAddress}`);

        } catch (e) {
          setError(e instanceof Error ? e.message : 'An unknown error occurred during sync.');
          setStatus('error');
        }
      }
    };

    processConfirmation();

  }, [isConfirmed, receipt, status, refetchAllowance, submittedData, address, hash, imageUrl, router]);



  const handleApprove = async () => {
    if (!submittedData) return;
    setError(null);
    setStatus('approving');
    try {
      await writeContractAsync({
        address: okbTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [tokenFactoryV3Address, MaxUint256], // Approve max uint256 for a better UX
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval transaction failed. Please try again.');
      setStatus('idle');
    }
  };

  const handleCreateToken = async (data: FormData) => {
    let uploadedImageUrl = imageUrl;
    if (imageFile && !uploadedImageUrl) {
      setStatus('uploading');
      try {
        const formData = new FormData();
        formData.append('image', imageFile);
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/tokens/upload-image/`, { method: 'POST', body: formData });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Image upload failed');
        uploadedImageUrl = result.image_url;
        setImageUrl(uploadedImageUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Image upload failed.');
        setStatus('error');
        return;
      }
    }

    setStatus('creating');
    try {
      const amount = parseUnits(data.okbAmount.toString(), 18);
      await writeContractAsync({
        address: tokenFactoryV3Address,
        abi: tokenFactoryV3Abi,
        functionName: 'createTokenWithPurchase',
        args: [data.name, data.symbol, data.description, uploadedImageUrl, data.website || '', data.twitter || '', data.telegram || '', amount],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Token creation transaction failed. Please try again.');
      setStatus('idle');
    }
  };

  const onSubmit = (data: FormData) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first.');
      return;
    }
    setError(null);
    setSubmittedData(data);
    resetWriteContract(); // Reset previous transaction states

    const requiredAmount = parseUnits(data.okbAmount.toString(), 18);

    if ((allowance ?? BigInt(0)) < requiredAmount) {
      setStatus('idle'); // Explicitly set status before action
      handleApprove();
    } else {
      setStatus('idle'); // Explicitly set status before action
      handleCreateToken(data);
    }
  };

  const getButtonContent = () => {
    // In-progress states take precedence
    if (status === 'uploading') return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>;
    if (isWritePending) return 'Check Wallet...';
    if (isConfirming) return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming Tx...</>;
    if (status === 'syncing') return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing with DB...</>;
    if (status === 'success') return 'Token Created!';

    // Determine the next action based on allowance
    if (submittedData) {
      const amount = parseUnits(submittedData.okbAmount.toString(), 18);
      if ((allowance ?? BigInt(0)) < amount) {
        return 'Approve OKB';
      }
    }

    return 'Create Token';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Token</h1>
        <p className="text-gray-400">Deploy your token to the blockchain and start your journey</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ... (All input fields, labels, and error messages are the same as before) */}
        {/* Token Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Token Name *</label>
          <Input id="name" {...register('name')} placeholder="Enter token name" />
          {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>}
        </div>

        {/* Token Symbol */}
        <div>
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-2">Token Symbol *</label>
          <Input id="symbol" {...register('symbol')} placeholder="Enter token symbol" />
          {errors.symbol && <p className="mt-1 text-sm text-red-400">{errors.symbol.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
          <Textarea id="description" {...register('description')} placeholder="Describe your token" rows={4} />
          {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>}
        </div>

        {/* Token Image */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Token Image</label>
                    <div
            className="border-2 border-dashed rounded-lg p-6 text-center border-gray-600"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileSelect(e.dataTransfer.files ? e.dataTransfer.files[0] : null);
            }}
          >
            {imagePreview ? (
              <div className="relative w-32 h-32 mx-auto">
                <img src={imagePreview} alt="Token preview" className="w-full h-full rounded-lg object-cover" />
                <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-400">Drag and drop or click to select</p>
                                <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">Select Image</label>
              </div>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">Website</label>
          <Input id="website" {...register('website')} placeholder="https://yourwebsite.com" />
          {errors.website && <p className="mt-1 text-sm text-red-400">{errors.website.message}</p>}
        </div>
        <div>
          <label htmlFor="twitter" className="block text-sm font-medium text-gray-300 mb-2">Twitter</label>
          <Input id="twitter" {...register('twitter')} placeholder="https://twitter.com/yourhandle" />
          {errors.twitter && <p className="mt-1 text-sm text-red-400">{errors.twitter.message}</p>}
        </div>
        <div>
          <label htmlFor="telegram" className="block text-sm font-medium text-gray-300 mb-2">Telegram</label>
          <Input id="telegram" {...register('telegram')} placeholder="https://t.me/yourchannel" />
          {errors.telegram && <p className="mt-1 text-sm text-red-400">{errors.telegram.message}</p>}
        </div>

        {/* Initial Purchase */}
        <div>
          <label htmlFor="okbAmount" className="block text-sm font-medium text-gray-300 mb-2">Initial Purchase (OKB) *</label>
          <Input id="okbAmount" type="number" step="any" {...register('okbAmount')} placeholder="e.g., 100" />
          {errors.okbAmount && <p className="mt-1 text-sm text-red-400">{errors.okbAmount.message}</p>}
          <p className="mt-1 text-xs text-gray-500">This amount of OKB will be used to make the first purchase and establish the initial price.</p>
        </div>

        {/* Error & Status Display */}
        {error && <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg text-red-400">{error}</div>}
        {hash && <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg text-blue-400">Transaction sent: {`${hash.slice(0, 10)}...${hash.slice(-8)}`}</div>}

        {/* Submit Button */}
        <div>
          <Button type="submit" className="w-full" disabled={isWritePending || isConfirming || status === 'syncing' || status === 'uploading'}>
            {getButtonContent()}
          </Button>
        </div>
      </form>
    </div>
  );
}

