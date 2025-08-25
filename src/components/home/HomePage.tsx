'use client';

import { TokenList } from './TokenList';

export function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
          The Ultimate Meme Coin Launchpad
        </h1>
        <p className="text-xl text-gray-400 mt-4">Create, trade, and graduate the next generation of meme coins.</p>
        <div className="mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            Create a Token
          </button>
        </div>
      </div>

      {/* Token List Section */}
      <TokenList />
    </div>
  );
}
