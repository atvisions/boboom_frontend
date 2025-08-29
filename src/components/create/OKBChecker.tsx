"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { notifySuccess, notifyError, notifyInfo } from "@/lib/notify";
import { CONTRACT_ADDRESSES, OKB_TOKEN_ABI } from "@/config/contracts";

// OKB 代币配置
const OKB_TOKEN_CONFIG = {
  address: "0xDF021922E0Be7f7dCeF2Cb4809e7D2c28C4133fe" as const,
  symbol: "OKB",
  decimals: 18,
  image: "https://assets.coingecko.com/coins/images/4463/large/WeChat_Image_20220118095654.png",
};

// ERC20 ABI (只需要 balanceOf)
const ERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface OKBCheckerProps {
  requiredAmount: string; // 所需的 OKB 数量
}

export function OKBChecker({ requiredAmount }: OKBCheckerProps) {
  const { address, isConnected } = useAccount();
  const [isAddingToken, setIsAddingToken] = useState(false);

  // 简化版本，暂时不检查余额
  // 读取 OKB 余额
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.okbToken,
    abi: OKB_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });

  const balanceInEther = balance ? parseFloat(formatEther(balance)) : 0;
  const requiredInEther = parseFloat(requiredAmount);
  const hasEnoughBalance = balanceInEther >= requiredInEther;

  // 添加代币到钱包
  const addTokenToWallet = async () => {
    if (!window.ethereum) {
      notifyError('MetaMask Required', 'Please install MetaMask to add tokens');
      return;
    }

    setIsAddingToken(true);
    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: [{
          type: 'ERC20',
          options: {
            address: OKB_TOKEN_CONFIG.address,
            symbol: OKB_TOKEN_CONFIG.symbol,
            decimals: OKB_TOKEN_CONFIG.decimals,
            image: OKB_TOKEN_CONFIG.image,
          },
        }],
      });

      if (wasAdded) {
        notifySuccess('Token Added', 'OKB token has been added to your wallet');
        // 重新获取余额 - 暂时注释掉
        // setTimeout(() => refetch(), 1000);
      }
    } catch (error) {
      console.error('Error adding token:', error);
      notifyError('Failed to Add Token', 'Could not add OKB token to wallet');
    } finally {
      setIsAddingToken(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  // 暂时移除加载和错误状态检查
  // if (isLoading) {
  //   return (
  //     <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
  //       <div className="flex items-center gap-3">
  //         <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
  //         <span className="text-blue-400">Checking OKB balance...</span>
  //       </div>
  //     </div>
  //   );
  // }

  // 暂时移除错误状态检查
  // if (isError) {
  //   return (
  //     <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
  //       <div className="flex items-center justify-between">
  //         <div className="flex items-center gap-3">
  //           <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  //           </svg>
  //           <div>
  //             <p className="text-red-400 font-medium">Unable to check OKB balance</p>
  //             <p className="text-red-300 text-sm">Make sure you have the OKB token added to your wallet</p>
  //           </div>
  //         </div>
  //         <button
  //           onClick={addTokenToWallet}
  //           disabled={isAddingToken}
  //           className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors disabled:opacity-50"
  //         >
  //           {isAddingToken ? 'Adding...' : 'Add OKB Token'}
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className={`p-4 border rounded-xl ${
      hasEnoughBalance 
        ? 'bg-green-500/10 border-green-500/20' 
        : 'bg-yellow-500/10 border-yellow-500/20'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${
            hasEnoughBalance ? 'bg-green-400' : 'bg-yellow-400'
          }`} />
          <div>
            <p className={`font-medium ${
              hasEnoughBalance ? 'text-green-400' : 'text-yellow-400'
            }`}>
              OKB Balance: {balanceInEther.toFixed(4)} OKB
            </p>
            <p className="text-sm text-gray-400">
              Required: {requiredAmount} OKB
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!hasEnoughBalance && (
            <div className="text-right">
              <p className="text-yellow-400 text-sm font-medium">
                Need {(requiredInEther - balanceInEther).toFixed(4)} more OKB
              </p>
            </div>
          )}
          
          <button
            onClick={addTokenToWallet}
            disabled={isAddingToken}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isAddingToken ? (
              <>
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add to Wallet
              </>
            )}
          </button>
        </div>
      </div>
      
      {!hasEnoughBalance && (
        <div className="mt-3 pt-3 border-t border-yellow-500/20">
          <p className="text-yellow-300 text-sm">
            💡 If you don't see your OKB balance, try adding the token to your wallet first, then refresh the page.
          </p>
        </div>
      )}
    </div>
  );
}
