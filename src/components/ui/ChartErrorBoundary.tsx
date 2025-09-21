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

  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-[380px] bg-[#1a1a1a] rounded-lg border border-gray-700">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-4">📊</div>
            <div className="text-lg mb-2">Chart temporarily unavailable</div>
            <div className="text-sm text-gray-500 mb-4">
              Chart component is being fixed, please refresh the page and try again
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple chart loading component
export function ChartLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[380px] bg-[#1a1a1a] rounded-lg border border-gray-700">
      <div className="text-center text-gray-400">
        <div className="animate-spin text-2xl mb-4">⏳</div>
        <div>Loading chart...</div>
      </div>
    </div>
  );
}

// Chart error fallback component
export function ChartErrorFallback() {
  return (
    <div className="flex items-center justify-center h-[380px] bg-[#1a1a1a] rounded-lg border border-gray-700">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-lg mb-2">Chart failed to load</div>
        <div className="text-sm text-gray-500 mb-4">
          Please check your network connection or try again later
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
