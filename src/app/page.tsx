import { FeaturedSection } from "@/components/tokens/FeaturedSection";
import { LatestSection } from "@/components/tokens/LatestSection";

export default function HomePage() {
  return (
    <div className="min-h-screen pt-0">
      {/* Featured Projects */}
      <FeaturedSection />
      
      {/* Latest Projects */}
      <LatestSection />
    </div>
  );
}


