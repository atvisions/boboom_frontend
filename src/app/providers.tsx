"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { xLayer, sepolia } from "wagmi/chains";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { Toaster } from "sonner";

const config = createConfig({
  chains: [xLayer, sepolia],
  transports: {
    [xLayer.id]: http("https://rpc.xlayer.tech"),
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL ||
        "https://eth-sepolia.g.alchemy.com/v2/Dwhp-JulbzNpZrEHruaBSD7RRx4Eeukb"
    ),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          locale="en"
          theme={darkTheme({
            accentColor: "#4F46E5", // 主色
            accentColorForeground: "white", // 按钮文字颜色
          })}
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#151515",
                color: "#ffffff",
                border: "1px solid #232323",
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
