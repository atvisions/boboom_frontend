'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, ArrowLeft } from 'lucide-react';
import { notifySuccess } from '@/lib/notify';
import Link from 'next/link';

export function ProfileDetail() {
  const params = useParams();
  const address = params.address as string;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    notifySuccess('Address copied to clipboard');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="relative">
            <img 
              src={`https://avatar.vercel.sh/${address}.png?size=80`}
              alt="Profile"
              className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://avatar.vercel.sh/${address}.png?size=80`;
              }}
            />
          </div>
          
          {/* Profile Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <div className="flex items-center space-x-2 mb-3">
              <span className="font-mono text-lg text-white">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <Button variant="ghost" size="sm" onClick={copyAddress} className="h-6 w-6 p-0">
                <Copy className="w-3 h-3" />
              </Button>
              <a 
                href={`https://sepolia.etherscan.io/address/${address}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              Creator
            </Badge>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-[#17182D] border-0">
          <CardHeader>
            <CardTitle className="text-white">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Tokens Created</span>
                <span className="text-white font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Volume</span>
                <span className="text-white font-medium">$0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Followers</span>
                <span className="text-white font-medium">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#17182D] border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Created Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-400 py-8">
              <p>No tokens created yet</p>
              <p className="text-sm mt-2">This profile page is under development</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


