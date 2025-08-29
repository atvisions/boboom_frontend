"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  User, 
  Trophy, 
  Gift, 
  Info
} from "lucide-react";
import { FaXTwitter, FaInstagram, FaTelegram, FaDiscord } from "react-icons/fa6";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Ranking", href: "/ranking", icon: Trophy },
  { name: "Rewards", href: "/rewards", icon: Gift },
  { name: "How it works", href: "/how-it-works", icon: Info },
];

const socialLinks = [
  { name: "X", href: "#", icon: FaXTwitter },
  { name: "Instagram", href: "#", icon: FaInstagram },
  { name: "Telegram", href: "#", icon: FaTelegram },
  { name: "Discord", href: "#", icon: FaDiscord },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 fixed left-0 top-0 h-screen bg-[#151515] flex flex-col z-10">
      {/* 品牌标志 */}
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#70E000] rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-lg">A</span>
          </div>
          <span className="text-[#70E000] font-bold text-xl">BOBOOM</span>
        </div>
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
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium",
                    isActive
                      ? "bg-[#70E000] text-black"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
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
              className="flex-1 flex justify-center text-gray-400 hover:text-[#70E000] transition-colors"
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
