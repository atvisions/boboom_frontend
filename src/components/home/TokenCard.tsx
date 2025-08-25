'use client';

import { motion } from 'framer-motion';

// Define the shape of our token data, consistent with TokenList
interface Token {
  address: string;
  name: string;
  symbol: string;
  phase: 'CREATED' | 'CURVE' | 'GRADUATED';
  currentPrice: string;
  priceChange24h: string;
  marketCap: string;
  volume24h: string;
  fundingProgress: number;
  creator: string;
  isVerified: boolean;
  imageUrl: string;
}

// --- Mappings for Display ---
const phaseColors: { [key: string]: string } = {
  CREATED: 'bg-green-500',
  CURVE: 'bg-blue-500',
  GRADUATED: 'bg-purple-500',
};

const phaseLabels: { [key: string]: string } = {
  CREATED: 'New',
  CURVE: 'Live',
  GRADUATED: 'Graduated',
};

// --- Formatting Helpers ---
const formatPrice = (priceStr: string) => {
  const price = parseFloat(priceStr);
  if (price === 0) return '$0.00';
  if (price < 0.0001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
};

const formatStat = (statStr: string) => {
  const stat = parseFloat(statStr);
  if (stat === 0) return '$0';
  if (stat >= 1e9) return `$${(stat / 1e9).toFixed(2)}B`;
  if (stat >= 1e6) return `$${(stat / 1e6).toFixed(2)}M`;
  if (stat >= 1e3) return `$${(stat / 1e3).toFixed(1)}K`;
  return `$${stat.toFixed(2)}`;
};

const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

// --- Main Component ---
export function TokenCard({ token }: { token: Token }) {
  const priceChange = parseFloat(token.priceChange24h);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-gray-900 rounded-lg p-5 border border-gray-800 hover:border-blue-700 transition-all duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={token.imageUrl || `https://avatar.vercel.sh/${token.address}.png?size=40`}
            alt={`${token.name} logo`}
            className="w-10 h-10 rounded-full bg-gray-700 object-cover"
          />
          <div>
            <h3 className="font-bold text-lg truncate">{token.name}</h3>
            <p className="text-gray-400 text-sm">${token.symbol}</p>
          </div>
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded-full ${phaseColors[token.phase]}`}>
          {phaseLabels[token.phase]}
        </div>
      </div>

      {/* Price Info */}
      <div className="my-4">
        <p className="text-3xl font-bold">{formatPrice(token.currentPrice)}</p>
        <p className={`text-sm font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
        </p>
      </div>

      {/* Graduation Progress (only for 'CURVE' phase) */}
      {token.phase === 'CURVE' && (
        <div className="my-4">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${token.fundingProgress}%` }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{token.fundingProgress.toFixed(0)}% to Graduation</p>
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-gray-400 space-y-2 mt-auto">
        <div className="flex justify-between">
          <span>Market Cap</span>
          <span className="font-medium text-white">{formatStat(token.marketCap)}</span>
        </div>
        <div className="flex justify-between">
          <span>Volume (24h)</span>
          <span className="font-medium text-white">{formatStat(token.volume24h)}</span>
        </div>
      </div>

      {/* Creator Info */}
      <div className="border-t border-gray-800 mt-4 pt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src={`https://avatar.vercel.sh/${token.creator}.png?size=24`}
            alt={`${token.creator} avatar`}
            className="w-6 h-6 rounded-full bg-gray-600"
          />
          <span className="text-xs font-mono">{truncateAddress(token.creator)}</span>
          {token.isVerified && <span className="text-blue-400 text-xs">✓ Verified</span>}
        </div>
      </div>
    </motion.div>
  );
}
