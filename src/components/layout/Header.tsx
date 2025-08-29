"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Search, Rocket, TrendingUp, Users, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RainbowKitConnectButton } from "@/components/wallet/RainbowKitConnectButton";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Market", href: "/tokens", icon: TrendingUp },
  { name: "Community", href: "/#community", icon: Users },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { address, isConnected } = useAccount();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative h-15 w-48">
                <Image
                  src="/logo_white.png"
                  alt="BoBoom"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 192px"
                  className="object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tokens or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Create Token Button */}
            <Button asChild className="hidden sm:flex">
              <Link href="/create">
                <Rocket className="mr-2 h-4 w-4" />
                Create Token
              </Link>
            </Button>

            {/* Profile Button - Only show when connected */}
            {isConnected && (
              <Button asChild variant="ghost" className="hidden sm:flex">
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
            )}

            {/* Wallet Connect */}
            <RainbowKitConnectButton />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search tokens or projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>

              {/* Mobile Navigation */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              {/* Mobile Create Button */}
              <Button asChild className="w-full mt-4">
                <Link href="/create" onClick={() => setMobileMenuOpen(false)}>
                  <Rocket className="mr-2 h-4 w-4" />
                  Create Token
                </Link>
              </Button>

              {/* Mobile Profile Button - Only show when connected */}
              {isConnected && (
                <Button asChild variant="ghost" className="w-full mt-2">
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}


