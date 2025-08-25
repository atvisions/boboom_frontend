import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers, config } from "./providers";
import { AuthManager } from "@/components/auth/AuthManager";
import { headers } from "next/headers";
import { cookieToInitialState } from 'wagmi'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BoBoom - The Ultimate Meme Coin Launchpad",
  description: "Create, trade, and graduate the next generation of meme coins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(config, headers().get('cookie'))
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers initialState={initialState}>
          <AuthManager />
          {children}
        </Providers>
      </body>
    </html>
  );
}
