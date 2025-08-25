'use client';

import { useState, useEffect } from 'react';
import { TokenCard } from './TokenCard';
import Link from 'next/link';

// Define the shape of our token data
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

// Map backend phases to user-facing tabs
const phaseToTab: { [key: string]: string } = {
  'CREATED': 'New',
  'CURVE': 'Live',
  'GRADUATED': 'Graduated',
};

export function TokenList() {
  const [activeTab, setActiveTab] = useState('New');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch token data from the backend
  useEffect(() => {
    const fetchTokens = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/tokens/?show_inactive=false`);

        if (!response.ok) {
          throw new Error(`Failed to fetch tokens: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.data && Array.isArray(result.data.tokens)) {
          setTokens(result.data.tokens);
        } else {
          throw new Error(result.error || 'Invalid data format from API');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const tabs = ['New', 'Live', 'Graduated'];

  // Filter tokens based on the active tab
  const filteredTokens = tokens.filter(token => phaseToTab[token.phase] === activeTab);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading tokens...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-400">
          <p>Error: {error}</p>
        </div>
      );
    }

    if (filteredTokens.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No tokens in the '{activeTab}' category yet.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTokens.map((token) => (
          <Link key={token.address} href={`/token/${token.address}`} passHref>
            <TokenCard token={token} />
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Tabs for filtering */}
      <div className="flex justify-center space-x-4 border-b border-gray-800 mb-8">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 font-semibold transition-colors duration-200 ${
              activeTab === tab
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-white'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Display content based on state */}
      {renderContent()}
    </div>
  );
}
