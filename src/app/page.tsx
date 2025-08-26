import { Hero } from "@/components/home/Hero";
import { FeaturedSection } from "@/components/tokens/FeaturedSection";
import { LatestSection } from "@/components/tokens/LatestSection";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <Hero />
      <FeaturedSection />
      <LatestSection />
    </div>
  );
}


