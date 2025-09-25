"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  Trophy,
  Gift
} from "lucide-react";
import { FaXTwitter, FaTelegram, FaDiscord, FaGithub } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import NProgress from 'nprogress';

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Ranking", href: "/ranking/", icon: Trophy },
  { name: "Rewards", href: "/rewards/", icon: Gift },
];

const socialLinks = [
  { name: "X", href: "#", icon: FaXTwitter },
  { name: "Telegram", href: "#", icon: FaTelegram },
  { name: "Discord", href: "#", icon: FaDiscord },
  { name: "GitHub", href: "#", icon: FaGithub },
];

export function Sidebar() {
  const pathname = usePathname();
  const { address, isAuthenticated, isClient } = useWalletAuth();

  // 处理链接点击，启动进度条
  const handleLinkClick = (href: string) => {
    // 只有当目标路径与当前路径不同时才启动进度条
    if (href !== pathname) {
      NProgress.start();
    }
  };

  return (
    //屏幕尺寸显示
    <div className="w-64 h-screen bg-[#151515] flex-col z-10 hidden md:flex" >
      {/* 品牌标志 */}
      <div className="p-6">
        <Link 
          href="/" 
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
          onClick={() => handleLinkClick("/")}
        >
          <Image
            src="/logo.svg"
            alt="BOBOOM Logo"
            width={32}
            height={32}
            className="w-40"
            style={{  height: '32px' }}
          />
          {/* <span className="text-white text-xl font-bold font-inter">BOBOOM</span> */}
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200",
                    isActive
                      ? "text-[#D7FE11] bg-[#D7FE11]/10 border-l-4 border-[#D7FE11]"
                      : "text-gray-400 hover:text-[#D7FE11] hover:bg-gray-800/30"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    isActive 
                      ? "text-[#D7FE11]" 
                      : "text-gray-400"
                  )} />
                  <span className={cn(
                    isActive 
                      ? "font-semibold text-[#D7FE11]" 
                      : "font-medium text-gray-400"
                  )}>{item.name}</span>
                </Link>
              </li>
            );
          })}
          
          {/* Profile 链接 - 需要用户地址 */}
          <li>
            <Link
              href={isClient && address ? `/profile?other=${address}/` : "/profile/"}
              onClick={() => handleLinkClick(isClient && address ? `/profile?other=${address}` : "/profile/")}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200",
                pathname.startsWith("/profile")
                  ? "text-[#D7FE11] bg-[#D7FE11]/10 border-l-4 border-[#D7FE11]"
                  : "text-gray-400 hover:text-[#D7FE11] hover:bg-gray-800/30"
              )}
            >
              <User className={cn(
                "h-5 w-5",
                pathname.startsWith("/profile") 
                  ? "text-[#D7FE11]" 
                  : "text-gray-400"
              )} />
              <span className={cn(
                pathname.startsWith("/profile") 
                  ? "font-semibold text-[#D7FE11]" 
                  : "font-medium text-gray-400"
              )}>Profile</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* 底部版权和社交媒体 */}
      <div className="p-4">
        {/* 社交媒体链接 */}
        <div className="flex mb-2">
          {socialLinks.map((social) => (
            <Link
              key={social.name}
              href={social.href}
              className="flex-1 flex justify-center text-gray-400 hover:text-[#D7FE11] transition-colors"
            >
              <social.icon className="h-6 w-6" />
            </Link>
          ))}
        </div>
        <div className="text-gray-400 text-xs">
          © 2025 BOBOOM. All rights reserved.
        </div>
      </div>
    </div>
  );
}
