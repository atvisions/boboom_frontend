'use client';

// Mock data for top holders
const mockHolders = [
  { address: '0x2oWnAR...', percentage: 6.75 },
  { address: '0x9CTN8E...', percentage: 3.09 },
  { address: '0x7Bu5WD...', percentage: 1.90 },
  { address: '0xAEMxxF...', percentage: 1.87 },
  { address: '0x213fC...', percentage: 1.51 },
];

export function TopHolders() {
  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Top Holders</h3>
        <button className="text-sm text-gray-400 hover:text-white">Generate bubble map</button>
      </div>
      <ul className="space-y-3">
        {mockHolders.map((holder, index) => (
          <li key={index} className="flex justify-between items-center text-sm">
            <span className="text-gray-300">{index + 1}. {holder.address}</span>
            <span className="font-mono text-white">{holder.percentage.toFixed(2)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

