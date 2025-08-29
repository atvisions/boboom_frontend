"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function RainbowKitConnectButton() {
  return (
    <ConnectButton 
      showBalance={false}
      chainStatus="icon"
      accountStatus={{
        smallScreen: 'avatar',
        largeScreen: 'full',
      }}
    />
  );
}
