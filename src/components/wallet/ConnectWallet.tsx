'use client';

import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Loader2, ChevronDown, User, LogOut, Wallet } from 'lucide-react';
import { okbTokenAddress } from '@/lib/contracts';
import Link from 'next/link';

const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

export function ConnectWallet() {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { isAuthenticated, login, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch balances
  const { data: ethBalance } = useBalance({ address });
  const { data: okbBalance } = useBalance({ address, token: okbTokenAddress });

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return <Button onClick={openConnectModal}>Connect Wallet</Button>;
  }

  if (!isAuthenticated) {
    return (
      <Button onClick={handleLogin} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign In to Verify
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2">
        <img src={`https://avatar.vercel.sh/${address}.png?size=24`} alt="Avatar" className="w-6 h-6 rounded-full" />
        {address && truncateAddress(address)}
        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <img src={`https://avatar.vercel.sh/${address}.png?size=40`} alt="Avatar" className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-semibold text-white">{address && truncateAddress(address)}</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between items-center text-gray-300">
              <span>ETH Balance:</span>
              <span className="font-mono text-white">{ethBalance ? parseFloat(ethBalance.formatted).toFixed(4) : '0.0000'}</span>
            </div>
            <div className="flex justify-between items-center text-gray-300">
              <span>OKB Balance:</span>
              <span className="font-mono text-white">{okbBalance ? parseFloat(okbBalance.formatted).toFixed(2) : '0.00'}</span>
            </div>
          </div>
          <div className="border-t border-gray-700 p-2">
            <Link href="/" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded">
              <User className="w-4 h-4" /> My Profile
            </Link>
            <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
