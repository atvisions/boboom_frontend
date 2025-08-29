import { TrendingSection } from "@/components/home/TrendingSection";
import { TokenGrid } from "@/components/home/TokenGrid";
import { SearchHeader } from "@/components/home/SearchHeader";
import { Sidebar } from "@/components/common/Sidebar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      {/* 侧边栏 */}
      <Sidebar />
      
      {/* 主内容区域 */}
      <div className="ml-64 flex flex-col">
        {/* 顶部搜索栏 */}
        <SearchHeader />
        
        {/* 主要内容 */}
        <main className="flex-1 p-6">
          {/* 热门趋势区域 */}
          <TrendingSection />
          
          {/* 代币列表 */}
          <TokenGrid />
        </main>
      </div>
    </div>
  );
}


