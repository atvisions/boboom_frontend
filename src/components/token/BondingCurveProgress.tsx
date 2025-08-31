import { Zap } from 'lucide-react';

interface BondingCurveProgressProps {
  token: any;
}

export function BondingCurveProgress({ token }: BondingCurveProgressProps) {
  // 根据进度确定当前阶段
  const getCurrentPhase = (progress: number) => {
    if (progress >= 100) return "Graduated";
    if (progress >= 80) return "Late Stage";
    if (progress >= 60) return "Mid Stage";
    if (progress >= 40) return "Early Stage";
    if (progress >= 20) return "Seed Stage";
    return "Launch Stage";
  };

  const currentPhase = getCurrentPhase(token.graduationProgress);

  return (
    <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
      {/* 标题和进度 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Bonding Curve Progress</h3>
        <span className="text-white font-bold text-lg">{token.graduationProgress.toFixed(1)}%</span>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-4">
        <div 
          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${token.graduationProgress}%` }}
        ></div>
      </div>

      {/* 当前阶段 */}
      <div className="text-gray-400 text-sm mb-2">
        {token.graduationProgress >= 100 ? 'Coin has graduated!' : `Current Phase: ${currentPhase}`}
      </div>
    </div>
  );
}
