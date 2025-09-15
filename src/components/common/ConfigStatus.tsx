"use client";
import { useState } from 'react';
import { useContractConfig } from '@/hooks/useContractConfig';
import { AlertCircle, CheckCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export function ConfigStatus() {
  const { 
    contractAddresses, 
    platformConfig, 
    network, 
    isLoading, 
    error, 
    refetch, 
    isUsingFallback 
  } = useContractConfig();
  
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
          <span className="text-sm text-gray-300">Loading config...</span>
        </div>
      </div>
    );
  }

  const statusIcon = isUsingFallback ? (
    <AlertCircle className="h-4 w-4 text-yellow-400" />
  ) : (
    <CheckCircle className="h-4 w-4 text-green-400" />
  );

  const statusText = isUsingFallback ? 'Fallback Config' : 'Live Config';
  const statusColor = isUsingFallback ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-w-sm">
      {/* 状态栏 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          {statusIcon}
          <span className={`text-sm font-medium ${statusColor}`}>
            {statusText}
          </span>
          <span className="text-xs text-gray-400">
            {network}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              refetch();
            }}
            className="p-1 hover:bg-gray-600 rounded transition-colors"
            title="Refresh config"
          >
            <RefreshCw className="h-3 w-3 text-gray-400" />
          </button>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* 详细信息 */}
      {isExpanded && (
        <div className="border-t border-gray-600 p-3 space-y-3">
          {error && (
            <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {isUsingFallback && (
            <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded">
              <strong>Notice:</strong> Using environment variables as fallback. 
              Backend API is not available.
            </div>
          )}

          {contractAddresses && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-300">Contract Addresses:</h4>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-gray-400">Factory:</span>
                  <span className="ml-2 font-mono text-gray-300">
                    {contractAddresses.TOKEN_FACTORY_V3.slice(0, 8)}...
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Curve:</span>
                  <span className="ml-2 font-mono text-gray-300">
                    {contractAddresses.BONDING_CURVE_V3.slice(0, 8)}...
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Router:</span>
                  <span className="ml-2 font-mono text-gray-300">
                    {contractAddresses.LIQUIDITY_ROUTER.slice(0, 8)}...
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">OKB:</span>
                  <span className="ml-2 font-mono text-gray-300">
                    {contractAddresses.OKB_TOKEN.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          )}

          {platformConfig && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-300">Platform Config:</h4>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-gray-400">Graduation:</span>
                  <span className="ml-2 text-gray-300">
                    {platformConfig.GRADUATION_THRESHOLD} OKB
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Trading Fee:</span>
                  <span className="ml-2 text-gray-300">
                    {(Number(platformConfig.TRADING_FEE_RATE) / 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className={`ml-2 ${platformConfig.IS_PAUSED ? 'text-red-400' : 'text-green-400'}`}>
                    {platformConfig.IS_PAUSED ? 'Paused' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 简化版配置状态组件，只显示基本状态
 */
export function SimpleConfigStatus() {
  const { isLoading, isUsingFallback, network } = useContractConfig();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-xs text-gray-400">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-xs">
      {isUsingFallback ? (
        <>
          <AlertCircle className="h-3 w-3 text-yellow-400" />
          <span className="text-yellow-400">Fallback</span>
        </>
      ) : (
        <>
          <CheckCircle className="h-3 w-3 text-green-400" />
          <span className="text-green-400">Live</span>
        </>
      )}
      <span className="text-gray-400">{network}</span>
    </div>
  );
}
