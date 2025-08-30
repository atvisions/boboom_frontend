"use client";
import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/home/SearchHeader";
import { Gift } from "lucide-react";

export default function RewardsPage() {
  return (
    <div className="flex h-screen bg-[#0E0E0E]">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        <SearchHeader />
        
        <div className="flex-1 overflow-y-auto bg-[#0E0E0E]">
          <div className="px-6 py-6">
            {/* 简单的内容区域 */}
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Gift className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white font-hubot-sans mb-4">
                  Rewards Coming Soon
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                  We're working on an exciting rewards system that will revolutionize how you create, 
                  trade, and earn on our platform. Stay tuned for updates!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
