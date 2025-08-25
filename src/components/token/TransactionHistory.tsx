'use client';

import { useTokenTransactions } from '../../hooks/useTokenTransactions';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface TransactionHistoryProps {
  tokenAddress: string;
}

const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

export function TransactionHistory({ tokenAddress }: TransactionHistoryProps) {
  const { data: transactions, isLoading, error } = useTokenTransactions(tokenAddress);

  if (isLoading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin inline-block" /></div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error.message}</div>;
  if (!transactions || transactions.length === 0) {
    return <div className="text-center py-8 text-gray-500">No transactions yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th scope="col" className="py-3.5 px-4 text-left text-sm font-semibold text-gray-300">Type</th>
            <th scope="col" className="py-3.5 px-4 text-left text-sm font-semibold text-gray-300">Amount</th>
            <th scope="col" className="py-3.5 px-4 text-left text-sm font-semibold text-gray-300">Price (OKB)</th>
            <th scope="col" className="py-3.5 px-4 text-left text-sm font-semibold text-gray-300">Trader</th>
            <th scope="col" className="py-3.5 px-4 text-left text-sm font-semibold text-gray-300">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-gray-900">
          {transactions.map((tx) => (
            <tr key={tx.tx_hash}>
              <td className={`whitespace-nowrap py-4 px-4 text-sm font-medium ${tx.transaction_type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.transaction_type}
              </td>
              <td className="whitespace-nowrap py-4 px-4 text-sm text-gray-300">{parseFloat(tx.token_amount).toFixed(2)}</td>
              <td className="whitespace-nowrap py-4 px-4 text-sm text-gray-300">{parseFloat(tx.price).toPrecision(6)}</td>
              <td className="whitespace-nowrap py-4 px-4 text-sm text-gray-300">{formatAddress(tx.user_address)}</td>
              <td className="whitespace-nowrap py-4 px-4 text-sm text-gray-500">{formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

