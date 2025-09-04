import { Zap } from 'lucide-react';

interface BondingCurveProgressProps {
  token: any;
}

export function BondingCurveProgress({ token }: BondingCurveProgressProps) {
  // 详细调试日志
  console.log('[BondingCurveProgress] === 开始处理 ===');
  console.log('[BondingCurveProgress] Full token data:', JSON.stringify(token, null, 2));
  console.log('[BondingCurveProgress] graduationProgress:', token.graduationProgress, typeof token.graduationProgress);
  console.log('[BondingCurveProgress] graduation_progress:', token.graduation_progress, typeof token.graduation_progress);
  
  // 检查字段值
  const field1 = token.graduationProgress;
  const field2 = token.graduation_progress;
  const fallback = '0';
  
  console.log('[BondingCurveProgress] 字段检查:');
  console.log('  - token.graduationProgress:', field1, typeof field1);
  console.log('  - token.graduation_progress:', field2, typeof field2);
  console.log('  - 选择的值:', field1 || field2 || fallback);
  
  // 支持snake_case和camelCase两种格式
  const rawValue = (token.graduationProgress || token.graduation_progress || '0').toString();
  const progress = parseFloat(rawValue);
  
  console.log('[BondingCurveProgress] 解析结果:');
  console.log('  - 原始值:', rawValue);
  console.log('  - parseFloat结果:', progress);
  console.log('[BondingCurveProgress] === 处理完成 ===');

  // 根据进度确定当前阶段
  const getCurrentPhase = (progress: number) => {
    if (progress >= 100) return "Graduated";
    if (progress >= 80) return "Late Stage";
    if (progress >= 60) return "Mid Stage";
    if (progress >= 40) return "Early Stage";
    if (progress >= 20) return "Seed Stage";
    return "Launch Stage";
  };

  const currentPhase = getCurrentPhase(progress);
  console.log('[BondingCurveProgress] Current phase:', currentPhase, 'Progress:', progress);

  return (
    <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6">
      {/* 标题和进度 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Bonding Curve Progress</h3>
        <span className="text-white font-bold text-lg">{progress.toFixed(1)}%</span>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-4">
        <div 
          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* 当前阶段 */}
      <div className="text-gray-400 text-sm mb-2">
        {progress >= 100 ? 'Coin has graduated!' : `Current Phase: ${currentPhase}`}
      </div>
    </div>
  );
}
