"use client";

import * as React from "react";
import { type State, WagmiProvider, cookieStorage, createStorage, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/context/I18nProvider";
import { ThemeProvider } from "@/context/ThemeProvider";
import { Toaster } from "sonner";
import { AutoReconnect } from "@/components/wallet/AutoReconnect";

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    // 可选：如果需要 WalletConnect，取消注释下面这行
    // walletConnect({ projectId: "045c35f9cac6983287389108398a344c" }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});

const queryClient = new QueryClient();

export function Providers({ children, initialState }: { children: React.ReactNode; initialState?: State }) {
  return (
    <WagmiProvider config={config} initialState={initialState} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ThemeProvider>
            <Toaster
              position="top-center"
              richColors
              closeButton
              expand={true}
              toastOptions={{
                unstyled: true, // 使用自定义样式
                duration: 3000,
              }}
            />
            <AutoReconnect />
            {children}
          </ThemeProvider>
        </I18nProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

