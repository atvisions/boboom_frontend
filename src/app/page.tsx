import { LiveUpdatesCard } from "@/components/home/LiveUpdatesCard";
import { TrendingSection } from "@/components/home/TrendingSection";
import { TokenGrid } from "@/components/home/TokenGrid";

export default function HomePage() {
  return (
    <>
      {/* Live Updates Card */}
      <div className="px-6 pb-4">
        <LiveUpdatesCard />
      </div>

      <TrendingSection />
      <TokenGrid />

      {/* Bottom padding to prevent content from being too close to screen edge */}
      <div className="pb-8"></div>
    </>
  );
}
