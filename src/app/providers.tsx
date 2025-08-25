"use client";

import * as React from "react";
import {
  RainbowKitProvider,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { type State, WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const config = getDefaultConfig({
  appName: "BoBoom",
  projectId: "045c35f9cac6983287389108398a344c", // My WalletConnect project ID
  chains: [sepolia],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export function Providers({
  children,
  initialState
}: {
  children: React.ReactNode;
  initialState?: State;
 }) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

