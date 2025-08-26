"use client";
import Link from "next/link";
import Image from "next/image";
import { WalletButton } from "@/components/wallet/WalletButton";
import { SearchBox } from "@/components/search/SearchBox";
import { CreateTokenButton } from "@/components/tokens/CreateTokenButton";

const nav = [
  { href: "/", label: "Home" },
  { href: "/#featured", label: "Featured" },
  { href: "/#latest", label: "Tokens" },
];

export function Header() {
  const logoSrc = '/logo_white.png';
  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b border-white/10" style={{backgroundColor: 'rgba(9, 10, 26, 0.8)'}}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* 左侧：Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <Image src={logoSrc} alt="BoBoom" width={120} height={28} style={{ width: 'auto', height: 'auto' }} />
        </Link>
        
        {/* 中间：导航和搜索框 */}
        <div className="flex items-center gap-6 flex-1 justify-center">
          {/* 导航 */}
          <nav className="hidden lg:flex items-center gap-6 text-sm text-gray-300">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-white transition-colors whitespace-nowrap">{n.label}</Link>
            ))}
          </nav>
          
          {/* 搜索框 */}
          <div className="hidden sm:block flex-1 max-w-md">
            <SearchBox />
          </div>
        </div>
        
        {/* 右侧：Create Token 按钮和钱包按钮 */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <CreateTokenButton />
          <WalletButton />
        </div>
      </div>
      
      {/* 移动端搜索框 */}
      <div className="sm:hidden px-4 pb-3">
        <SearchBox />
      </div>
    </header>
  );
}


