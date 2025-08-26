"use client";
import Link from "next/link";
import { Token } from "@/hooks/useTokens";

interface TokenCardProps {
  token: Token;
}

function formatNumber(num: string | number | undefined): string {
  if (!num) return "0";
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return "0";
  
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(2);
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getPhaseLabel(phase: string): { label: string; color: string } {
  switch (phase.toUpperCase()) {
    case 'CREATED':
      return { label: 'On Curve', color: 'bg-blue-500/20 text-blue-300' };
    case 'GRADUATING':
      return { label: 'Graduating', color: 'bg-yellow-500/20 text-yellow-300' };
    case 'GRADUATED':
      return { label: 'Graduated', color: 'bg-green-500/20 text-green-300' };
    default:
      return { label: phase, color: 'bg-gray-500/20 text-gray-300' };
  }
}

export function TokenCard({ token }: TokenCardProps) {
  const phase = getPhaseLabel(token.phase);
  const imageUrl = token.imageUrl || `https://avatar.vercel.sh/${token.address}.png?size=80`;
  
  return (
    <Link 
      href={`/token/${token.address}`}
      className="block rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-4"
    >
      <div className="flex items-start gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/10">
          <img 
            src={imageUrl} 
            alt={token.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://avatar.vercel.sh/${token.address}.png?size=80`;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold truncate">{token.name}</h3>
            <span className={`px-2 py-1 rounded text-xs ${phase.color}`}>
              {phase.label}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-1">${token.symbol}</p>
          <p className="text-xs text-gray-500 mb-2 overflow-hidden" style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>{token.description}</p>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Market Cap</span>
              <div className="font-medium">${formatNumber(token.marketCap)}</div>
            </div>
            <div>
              <span className="text-gray-400">Volume 24h</span>
              <div className="font-medium">{formatNumber(token.volume24h)} OKB</div>
            </div>
            {token.phase.toUpperCase() === 'CREATED' && (
              <>
                <div>
                  <span className="text-gray-400">Progress</span>
                  <div className="font-medium">{token.graduationProgress.toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-gray-400">OKB Collected</span>
                  <div className="font-medium">{formatNumber(token.okbCollected)}</div>
                </div>
              </>
            )}
          </div>
          
          {token.phase.toUpperCase() === 'CREATED' && (
            <div className="mt-2">
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(token.graduationProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-500">
            Created by {formatAddress(token.creator)}
          </div>
        </div>
      </div>
    </Link>
  );
}
