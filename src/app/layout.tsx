import type { Metadata } from "next";
import { Inter, Roboto_Mono, Exo_2 } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';

import { Providers } from "./providers";

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

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-exo2",
  display: 'swap',
});

const hubotSans = localFont({
  src: [
    {
      path: '../fonts/HubotSans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/HubotSans-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/HubotSans-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-hubot-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BoBoom Launchpad - Next Generation Meme Coin Platform",
  description: "Create, trade, and incubate the next generation of meme coins. Innovative blockchain-based launchpad platform.",
  keywords: ["launchpad", "meme coin", "blockchain", "crypto", "token launch"],
  authors: [{ name: "BoBoom Team" }],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
      </head>
      <body className={`${hubotSans.variable} ${exo2.variable} ${inter.variable} font-inter antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

