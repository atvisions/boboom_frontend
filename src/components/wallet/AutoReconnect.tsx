"use client";
import * as React from "react";
import { useAccount, useConnect, useReconnect } from "wagmi";

const LAST_CONNECTOR_KEY = "wagmi-last-connector";

function isInjected(connector: any): boolean {
  const id: string = connector?.id ?? "";
  const name: string = (connector?.name ?? "").toString().toLowerCase();
  // 兼容不同实现：injected / metamask / browser
  return (
    id.includes("injected") ||
    id.includes("meta") ||
    name.includes("injected") ||
    name.includes("metamask") ||
    (connector as any)?.type === "injected"
  );
}

export function AutoReconnect() {
  const { isConnected } = useAccount();
  const { reconnect } = useReconnect();
  const { connectors, connectAsync, status } = useConnect();
  const triedRef = React.useRef(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    if (triedRef.current) return;
    if (isConnected) return;
    const last = window.localStorage.getItem(LAST_CONNECTOR_KEY);
    if (last !== 'injected') return; // 仅自动重连注入钱包，避免 WalletConnect 报错
    if (!Array.isArray(connectors) || connectors.length === 0) return;
    triedRef.current = true;

    // 延迟执行避免与其他初始化冲突
    const timer = setTimeout(async () => {
      try {
        await reconnect();
      } catch (err) {
        // 静默处理重连失败，避免控制台错误
        console.debug('Auto reconnect failed:', err);
      }
    }, 100);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isConnected, reconnect, connectors]);

  return null;
}


