'use client';

interface BondingCurveProgressProps {
  progress: number;
  status: string;
}

export function BondingCurveProgress({ progress, status }: BondingCurveProgressProps) {
  const isGraduated = status === 'GRADUATED';

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-white">Bonding Curve Progress</h3>
        <span className="text-lg font-bold text-white">{progress.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      {isGraduated && (
        <p className="text-center mt-3 font-semibold text-green-400">Graduated!</p>
      )}
    </div>
  );
}

