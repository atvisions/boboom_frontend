'use client';

import { tokenFactoryV3Address, bondingCurveV3Address, okbTokenAddress } from '@/lib/contracts';

export default function TestEnvPage() {
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8">环境变量测试页面</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">合约地址配置</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-400">TokenFactoryV3:</span>
              <span className="ml-2 font-mono text-green-400">{tokenFactoryV3Address || '未配置'}</span>
            </div>
            <div>
              <span className="text-gray-400">BondingCurveV3:</span>
              <span className="ml-2 font-mono text-green-400">{bondingCurveV3Address || '未配置'}</span>
            </div>
            <div>
              <span className="text-gray-400">OKB Token:</span>
              <span className="ml-2 font-mono text-green-400">{okbTokenAddress || '未配置'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">环境变量状态</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-400">NODE_ENV:</span>
              <span className="ml-2 font-mono text-blue-400">{process.env.NODE_ENV}</span>
            </div>
            <div>
              <span className="text-gray-400">NEXT_PUBLIC_BACKEND_URL:</span>
              <span className="ml-2 font-mono text-blue-400">{process.env.NEXT_PUBLIC_BACKEND_URL}</span>
            </div>
            <div>
              <span className="text-gray-400">NEXT_PUBLIC_NETWORK_NAME:</span>
              <span className="ml-2 font-mono text-blue-400">{process.env.NEXT_PUBLIC_NETWORK_NAME}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">配置验证</h2>
          <div className="space-y-2">
            <div className={`p-3 rounded ${tokenFactoryV3Address ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
              {tokenFactoryV3Address ? '✅ TokenFactoryV3 地址已配置' : '❌ TokenFactoryV3 地址未配置'}
            </div>
            <div className={`p-3 rounded ${bondingCurveV3Address ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
              {bondingCurveV3Address ? '✅ BondingCurveV3 地址已配置' : '❌ BondingCurveV3 地址未配置'}
            </div>
            <div className={`p-3 rounded ${okbTokenAddress ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
              {okbTokenAddress ? '✅ OKB Token 地址已配置' : '❌ OKB Token 地址未配置'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 