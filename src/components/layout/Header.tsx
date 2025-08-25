"use client";

import Link from "next/link";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

export function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-700 p-4 relative z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white">
          BoBoom
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors">Trending</Link>
          <Link href="/create" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Create Token</Link>
        </nav>
        <div className="flex items-center gap-4">
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}

