"use client";
import Link from "next/link";
import Image from "next/image";
import { WalletButton } from "@/components/wallet/WalletButton";

const nav = [
  { href: "/", label: "Home" },
  { href: "/#featured", label: "Featured" },
  { href: "/#latest", label: "Tokens" },
];

export function Header() {
  const logoSrc = '/logo_white.png';
  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b border-white/10" style={{backgroundColor: 'rgba(9, 10, 26, 0.8)'}}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src={logoSrc} alt="BoBoom" width={120} height={28} style={{ width: 'auto', height: 'auto' }} />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-white transition-colors">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}


