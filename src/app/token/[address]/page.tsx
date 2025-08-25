'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { useParams } from 'next/navigation';
import { TradePanel } from '@/components/token/TradePanel';
import { TokenChart } from '@/components/token/TokenChart';
import { TransactionHistory } from '@/components/token/TransactionHistory';
import { BondingCurveProgress } from '@/components/token/BondingCurveProgress';
import { useTokenData } from '@/hooks/useTokenData';
import { Loader2, ArrowUp, ArrowDown } from 'lucide-react';

// Helper to format large numbers
const formatLargeNumber = (num: number) => {
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const TokenMetrics = ({ token }: { token: any }) => {
  const priceChange = parseFloat(token.price_change_24h);
  const isPriceUp = priceChange >= 0;

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
      <div className="flex items-center gap-4 mb-6">
        <img src={token.image_url || `https://avatar.vercel.sh/${token.address}.png`} alt={token.name} className="w-16 h-16 rounded-full" />
        <div>
          <h1 className="text-3xl font-bold text-white">{token.name}</h1>
          <p className="text-xl text-gray-400">${token.symbol}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-white">
        <div>
          <p className="text-sm text-gray-400">Market Cap</p>
          <p className="text-2xl font-bold">{formatLargeNumber(parseFloat(token.market_cap))}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Price</p>
          <p className="text-2xl font-bold">${parseFloat(token.current_price).toPrecision(6)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">24h Volume</p>
          <p className="text-2xl font-bold">{formatLargeNumber(parseFloat(token.volume_24h))}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">24h Change</p>
          <div className={`flex items-center text-2xl font-bold ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
            {isPriceUp ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
            <span>{Math.abs(priceChange).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TokenDetailPage() {
  const params = useParams();
  const address = params.address as `0x${string}`;

  const { data: token, isLoading, error } = useTokenData(address);

  if (isLoading) return <MainLayout><div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin" /></div></MainLayout>;
  if (error) return <MainLayout><div className="text-center text-red-400 mt-10">Error: {error.message}</div></MainLayout>;
  if (!token) return <MainLayout><div className="text-center mt-10">Token not found.</div></MainLayout>;

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TokenMetrics token={token} />
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <TokenChart tokenAddress={address} />
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Transactions</h2>
            <TransactionHistory tokenAddress={address} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="sticky top-8 space-y-8">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 h-fit">
              <TradePanel tokenAddress={address} />
            </div>
            <BondingCurveProgress progress={token.graduation_progress} status={token.phase} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

