"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RainbowKitConnectButton } from "@/components/wallet/RainbowKitConnectButton";

export function SearchHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateToken = () => {
    router.push('/create');
  };

  return (
    <div className="bg-[#0E0E0E] p-6">
      {/* 搜索栏和按钮 */}
      <div className="flex items-center justify-between">
        {/* 搜索框 */}
        <div className="w-[410px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[40px] pl-12 pr-4 py-4 bg-[#151515] border-0 text-white placeholder-gray-400 focus:border-0 focus:ring-0 font-light text-base rounded-[15px]"
            />
          </div>
        </div>

        {/* 按钮组 - 放到最右侧 */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleCreateToken}
            className="h-[40px] px-[34px] py-4 border-2 border-[#70E000] text-[#70E000] hover:bg-[#70E000] hover:text-black font-light rounded-[15px]"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Create Token
          </Button>
          
          <div className="h-[40px]">
            <RainbowKitConnectButton />
          </div>
        </div>
      </div>
    </div>
  );
}
