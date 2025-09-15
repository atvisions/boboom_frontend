"use client";
import { useContractConfig } from '@/hooks/useContractConfig';
import { RefreshCw, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { useState } from 'react';

export default function ConfigTestPage() {
  const { 
    contractAddresses, 
    platformConfig, 
    network, 
    isLoading, 
    error, 
    refetch, 
    isUsingFallback 
  } = useContractConfig();

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white text-lg">Loading contract configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Contract Configuration Test</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isUsingFallback ? (
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-400" />
              )}
              <span className={`font-medium ${isUsingFallback ? 'text-yellow-400' : 'text-green-400'}`}>
                {isUsingFallback ? 'Using Fallback Configuration' : 'Using Live Configuration'}
              </span>
            </div>
            <button
              onClick={refetch}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <h3 className="text-red-400 font-semibold mb-2">Configuration Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Addresses */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Contract Addresses</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Network</label>
                <div className="text-white font-mono bg-gray-700 p-2 rounded mt-1">
                  {network || 'Unknown'}
                </div>
              </div>
              
              {contractAddresses && Object.entries(contractAddresses).map(([key, address]) => (
                <div key={key}>
                  <label className="text-sm text-gray-400">{key.replace(/_/g, ' ')}</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 text-white font-mono bg-gray-700 p-2 rounded text-sm">
                      {address}
                    </div>
                    <button
                      onClick={() => copyToClipboard(address, key)}
                      className="p-2 hover:bg-gray-600 rounded transition-colors"
                      title="Copy address"
                    >
                      <Copy className="h-4 w-4 text-gray-400" />
                    </button>
                    {copiedAddress === key && (
                      <span className="text-green-400 text-sm">Copied!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Configuration */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Platform Configuration</h2>
            {platformConfig && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Creation Fee</label>
                  <div className="text-white bg-gray-700 p-2 rounded mt-1">
                    {platformConfig.CREATION_FEE} OKB
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Graduation Threshold</label>
                  <div className="text-white bg-gray-700 p-2 rounded mt-1">
                    {platformConfig.GRADUATION_THRESHOLD} OKB
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Trading Fee Rate</label>
                  <div className="text-white bg-gray-700 p-2 rounded mt-1">
                    {(Number(platformConfig.TRADING_FEE_RATE) / 100).toFixed(1)}%
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Migration Fee</label>
                  <div className="text-white bg-gray-700 p-2 rounded mt-1">
                    {platformConfig.MIGRATION_FEE} OKB
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Platform Status</label>
                  <div className={`p-2 rounded mt-1 ${platformConfig.IS_PAUSED ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                    {platformConfig.IS_PAUSED ? 'Paused' : 'Active'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Test */}
        <div className="mt-6 bg-gray-800 border border-gray-600 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">API Connection Test</h2>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Backend URL:</span>
              <span className="text-white font-mono">
                {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Config Endpoint:</span>
              <span className="text-white font-mono">
                {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/tokens/config/
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Status:</span>
              {isUsingFallback ? (
                <span className="text-yellow-400">API unavailable, using fallback</span>
              ) : (
                <span className="text-green-400">API connected successfully</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-[#70E000] text-black font-semibold rounded-lg hover:bg-[#5BC000] transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
