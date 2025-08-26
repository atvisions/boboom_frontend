"use client";
import { useMemo, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useEnsAvatar, useEnsName, useBalance, useReconnect } from "wagmi";
import { toast } from "sonner";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/notify";

function short(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function WalletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2h-5a3 3 0 0 0 0 6h5v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M22 12h-6a2 2 0 1 0 0 4h6v-4z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M14 5h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 14L19 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 14v5H5V5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 20c1.5-3.5 5-5 8-5s6.5 1.5 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M15 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function isInjectedConnector(connector: any): boolean {
  const id: string = connector?.id ?? "";
  const name: string = (connector?.name ?? "").toString().toLowerCase();
  return (
    id.includes("injected") ||
    id.includes("meta") ||
    name.includes("injected") ||
    name.includes("metamask") ||
    (connector as any)?.type === "injected"
  );
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  // no inline error; only global toast
  const timeoutRef = useRef<number | null>(null);

  const { reconnect } = useReconnect();
  const { data: ensName } = useEnsName({ address, chainId: 1 });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName ?? undefined, chainId: 1 });
  const { data: ethBalance } = useBalance({ address, chainId: 11155111 });

  const explorerUrl = useMemo(() => address ? `https://sepolia.etherscan.io/address/${address}` : "#", [address]);

  if (!isConnected) {
    const injected = connectors.find(c => isInjectedConnector(c));
    const primary = injected ?? connectors[0];

    const ready = primary?.ready !== false; // treat undefined as ready
    const isConnecting = connecting || isPending;

    const onConnect = async () => {
      if (!primary || isConnecting) return;
      setConnecting(true);
      // safety timeout to avoid endless spinner
      timeoutRef.current = window.setTimeout(() => {
        setConnecting(false);
        notifyError('Connection timed out', 'Please retry.');
      }, 15000);
      try {
        await connectAsync({ connector: primary });
        if (isInjectedConnector(primary)) {
          try { window.localStorage.setItem('wagmi-last-connector', 'injected'); } catch {}
        }
        notifySuccess('Wallet connected');
      } catch (err: any) {
        const msg = err?.shortMessage || err?.message || 'Failed to connect';
        if (/already connected/i.test(msg) || /already pending/i.test(msg)) {
          // 对于已连接或重复请求，静默处理
          try { reconnect(); } catch {}
          if (isInjectedConnector(primary)) {
            try { window.localStorage.setItem('wagmi-last-connector', 'injected'); } catch {}
          }
          notifySuccess('Wallet connected');
        } else if (!msg.includes('User rejected')) {
          // 只显示非用户拒绝的错误
          notifyError('Connection failed', msg);
        }
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setConnecting(false);
      }
    };

    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={onConnect}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-white to-white text-black font-semibold shadow-sm hover:shadow transition-shadow disabled:opacity-60"
          disabled={!ready || isConnecting}
          title={!ready ? 'Wallet not detected' : undefined}
        >
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-black/10">
            {isConnecting ? (
              <span className="inline-block w-3 h-3 border-2 border-black/60 border-t-transparent rounded-full animate-spin" />
            ) : (
              <WalletIcon />
            )}
          </span>
          {!ready ? 'Install Wallet' : isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    );
  }

  const avatarSrc = ensAvatar || `https://avatar.vercel.sh/${address}.png?size=40`;
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors">
        <img src={avatarSrc} alt="avatar" className="w-7 h-7 rounded-full" />
        <span className="text-sm font-medium">{ensName ?? short(address)}</span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-black/90 backdrop-blur p-4 text-sm shadow-xl">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/0">
            <img src={avatarSrc} alt="avatar" className="w-12 h-12 rounded-full" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate text-base">{ensName ?? short(address)}</div>
              <div className="mt-1 text-gray-300 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-white/10 text-xs">Sepolia</span>
                <span className="text-gray-400">{short(address)}</span>
                <button
                  onClick={async () => {
                    if (!address) return;
                    await navigator.clipboard.writeText(address);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10"
                  title="Copy address"
                >
                  <CopyIcon />
                  <span className="sr-only">Copy</span>
                </button>
                <a href={explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10" title="View on Etherscan">
                  <ExternalLinkIcon />
                  <span className="sr-only">Explorer</span>
                </a>
                {copied && <span className="text-green-400">Copied</span>}
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center justify-between px-3 py-2 rounded-xl border border-white/10 bg-white/5">
              <span className="text-gray-300">ETH (Sepolia)</span>
              <span className="text-white font-medium">{ethBalance ? Number(ethBalance.formatted).toFixed(4) : '0.0000'}</span>
            </div>
            <a href="/create" onClick={() => setOpen(false)} className="col-span-2 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white text-black font-semibold hover:bg-white/90">
              <PlusIcon />
              <span>Create Token</span>
            </a>
            <a href="/profile" onClick={() => setOpen(false)} className="col-span-2 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10">
              <ProfileIcon />
              <span>Profile</span>
            </a>
          </div>
          <div className="mt-3">
            <button onClick={() => { disconnect(); setOpen(false); setConnecting(false); try { window.localStorage.removeItem('wagmi-last-connector'); } catch {} notifyInfo('Disconnected'); }} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-500/90 text-white font-semibold">
              <LogoutIcon />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


