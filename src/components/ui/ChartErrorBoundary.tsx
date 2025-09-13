'use client';

import React from 'react';

interface ChartErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ChartErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ChartErrorBoundary extends React.Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Chart component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-[380px] bg-[#1a1a1a] rounded-lg border border-gray-700">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-4">📊</div>
            <div className="text-lg mb-2">图表暂时无法加载</div>
            <div className="text-sm text-gray-500 mb-4">
              正在修复图表组件，请稍后刷新页面重试
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 简单的图表加载组件
export function ChartLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[380px] bg-[#1a1a1a] rounded-lg border border-gray-700">
      <div className="text-center text-gray-400">
        <div className="animate-spin text-2xl mb-4">⏳</div>
        <div>加载图表中...</div>
      </div>
    </div>
  );
}

// 图表错误回退组件
export function ChartErrorFallback() {
  return (
    <div className="flex items-center justify-center h-[380px] bg-[#1a1a1a] rounded-lg border border-gray-700">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-lg mb-2">图表加载失败</div>
        <div className="text-sm text-gray-500 mb-4">
          请检查网络连接或稍后重试
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          重新加载
        </button>
      </div>
    </div>
  );
}
