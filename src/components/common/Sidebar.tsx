"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, User, Trophy, Gift, X, Menu } from "lucide-react";
import { FaXTwitter, FaTelegram, FaDiscord, FaGithub } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import NProgress from "nprogress";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 处理链接点击，启动进度条
  const handleLinkClick = (href: string) => {
    // 只有当目标路径与当前路径不同时才启动进度条
    if (href !== pathname) {
      NProgress.start();
    }
    // 移动端点击链接后关闭抽屉
    setIsDrawerOpen(false);
  };

  // 切换抽屉状态
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // 侧边栏内容组件（桌面端和移动端共用）
  const SidebarContent = () => (
    <>
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
            style={{ height: "32px" }}
          />
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
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-[#D7FE11]" : "text-gray-400"
                    )}
                  />
                  <span
                    className={cn(
                      isActive
                        ? "font-semibold text-[#D7FE11]"
                        : "font-medium text-gray-400"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}

          {/* Profile 链接 */}
          <li>
            <Link
              href={
                isClient && address
                  ? `/profile/?other=${address}`
                  : "/profile/"
              }
              onClick={() =>
                handleLinkClick(
                  isClient && address
                    ? `/profile/?other=${address}`
                    : "/profile/"
                )
              }
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200",
                pathname.startsWith("/profile")
                  ? "text-[#D7FE11] bg-[#D7FE11]/10 border-l-4 border-[#D7FE11]"
                  : "text-gray-400 hover:text-[#D7FE11] hover:bg-gray-800/30"
              )}
            >
              <User
                className={cn(
                  "h-5 w-5",
                  pathname.startsWith("/profile")
                    ? "text-[#D7FE11]"
                    : "text-gray-400"
                )}
              />
              <span
                className={cn(
                  pathname.startsWith("/profile")
                    ? "font-semibold text-[#D7FE11]"
                    : "font-medium text-gray-400"
                )}
              >
                Profile
              </span>
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
    </>
  );

  return (
    <>
      {/* 桌面端侧边栏 */}
      <div className="w-64 h-screen bg-[#151515] flex-col z-10 hidden md:flex">
        <SidebarContent />
      </div>

      {/* 移动端菜单按钮 */}
      <div className="fixed top-3 left-3 z-50 md:hidden">
        <button
          onClick={toggleDrawer}
          className="bg-[#151515] p-3 rounded-lg hover:bg-[#D7FE11]/10 transition-colors"
        >
          <Menu className="h-6 w-6 text-[#D7FE11]" />
        </button>
      </div>

      {/* 移动端抽屉遮罩层 */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleDrawer}
        />
      )}

      {/* 移动端抽屉 */}
      <div
        className={cn(
          "fixed top-0 left-0 h-screen w-64 bg-[#151515] flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* 关闭按钮 */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleDrawer}
            className="text-gray-400 hover:text-[#D7FE11] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <SidebarContent />
      </div>
    </>
  );
}
