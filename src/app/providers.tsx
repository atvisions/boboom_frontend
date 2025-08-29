"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { Toaster } from "sonner";

// 定义 Xlayer 网络 - 根据 OKX 官方文档配置
const xlayer = {
  id: 196,
  name: 'X Layer Mainnet',
  network: 'xlayer',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    public: { http: ['https://rpc.xlayer.tech'] },
    default: { http: ['https://rpc.xlayer.tech'] },
  },
  blockExplorers: {
    etherscan: { name: 'OKLink Xlayer', url: 'https://www.oklink.com/xlayer' },
    default: { name: 'OKLink Xlayer', url: 'https://www.oklink.com/xlayer' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 1,
    },
  },
  iconUrl: '/icons/xlayer.png', // OKX 官方图标
} as const;

// 只支持 Sepolia 和 Xlayer 的配置
const config = createConfig({
  chains: [sepolia, xlayer],
  transports: {
    [sepolia.id]: http(),
    [xlayer.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Toaster
            position="top-center"
            richColors
            closeButton
            expand={true}
            toastOptions={{
              unstyled: true,
              duration: 3000,
            }}
          />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

