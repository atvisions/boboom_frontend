"use client";
import React from 'react';
import { TokenDetail } from '@/types/tokenDetail';
import { TokenDetailService } from '@/services/tokenDetailService';

interface GraduationProgressProps {
  token: TokenDetail;
}

export function GraduationProgress({ token }: GraduationProgressProps) {
  const progress = Math.min(token.graduation_progress, 100);
  const isCompleted = progress >= 100 || token.phase === 'GRADUATED';
  
  // 计算还需要多少OKB才能毕业
  const graduationThreshold = 200;
  const okbCollected = parseFloat(token.okb_collected);
  const okbNeeded = Math.max(0, graduationThreshold - okbCollected);
  
  const getProgressColor = (): string => {
    if (isCompleted) return 'from-purple-500 to-pink-500';
    if (progress >= 80) return 'from-yellow-500 to-orange-500';
    if (progress >= 50) return 'from-blue-500 to-cyan-500';
    return 'from-green-500 to-blue-500';
  };

  return (
    <div className="bg-white/5 rounded-xl p-4">
      {/* 标题和进度 */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-300">Graduation</h3>
        <span className="text-sm font-semibold text-white">
          {progress.toFixed(1)}%
        </span>
      </div>
      
      {/* 简化进度条 */}
      <div className="w-full bg-gray-700/50 rounded-full h-2 mb-3">
        <div
          className={`bg-gradient-to-r ${getProgressColor()} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* 基本信息 */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">
          {TokenDetailService.formatNumber(token.okb_collected)} / {graduationThreshold} OKB
        </span>
        {!isCompleted && (
          <span className="text-blue-400">
            {okbNeeded.toFixed(2)} OKB needed
          </span>
        )}
      </div>
    </div>
  );
}
