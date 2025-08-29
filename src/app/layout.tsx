import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';

import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BoBoom Launchpad - Next Generation Meme Coin Platform",
  description: "Create, trade, and incubate the next generation of meme coins. Innovative blockchain-based launchpad platform.",
  keywords: ["launchpad", "meme coin", "blockchain", "crypto", "token launch"],
  authors: [{ name: "BoBoom Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}


