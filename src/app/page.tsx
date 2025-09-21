import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/common/SearchHeader";
import { LiveUpdatesCard } from "@/components/home/LiveUpdatesCard";
import { TrendingSection } from "@/components/home/TrendingSection";
import { TokenGrid } from "@/components/home/TokenGrid";

export default function HomePage() {
  return (
    <div className="flex h-screen bg-[#0E0E0E]">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Search Header */}
        <SearchHeader />
        
        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-[#0E0E0E]">
          {/* Live Updates Card */}
          <div className="px-6 pb-4">
            <LiveUpdatesCard />
          </div>
          
          <TrendingSection />
          <TokenGrid />
          
          {/* Bottom padding to prevent content from being too close to screen edge */}
          <div className="pb-8"></div>
        </div>
      </div>
    </div>
  );
}

