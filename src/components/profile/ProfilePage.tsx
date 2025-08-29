"use client";
import { useAccount, useBalance, useEnsName, useEnsAvatar } from "wagmi";

export function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address, chainId: 1 });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName ?? undefined, chainId: 1 });
  const { data: ethBalance } = useBalance({ address, chainId: 11155111 });

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Profile</h1>
        <p className="text-gray-400">Please connect your wallet first.</p>
      </div>
    );
  }

  const avatarSrc = ensAvatar || `https://avatar.vercel.sh/${address}.png?size=80`;
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-start gap-6">
        <img src={avatarSrc} alt="avatar" className="w-20 h-20 rounded-full" />
        <div>
          <h1 className="text-2xl font-semibold">{ensName ?? address}</h1>
          <div className="text-gray-400">{address}</div>
          <div className="mt-3 text-sm">
            <span className="text-gray-400">ETH (Sepolia): </span>
            <span>{ethBalance ? Number(ethBalance.formatted).toFixed(4) : '0.0000'}</span>
          </div>
        </div>
      </div>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl border border-white/10">
          <h2 className="font-semibold mb-2">Created Tokens</h2>
          <div className="text-gray-400 text-sm">Coming soon</div>
        </div>
        <div className="p-4 rounded-xl border border-white/10">
          <h2 className="font-semibold mb-2">Holding Tokens</h2>
          <div className="text-gray-400 text-sm">Coming soon</div>
        </div>
      </div>
    </div>
  );
}


