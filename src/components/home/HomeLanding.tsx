//import { FinalBandSection } from "@/components/home/final-band-section"
import { HeroSection } from "@/components/home/hero-section"
import { ThreeCardsSection } from "@/components/home/three-cards-section"
import { WhoWeAreSection } from "@/components/home/who-we-are-section"

export function HomeLanding() {
  return (
    <main className="bg-ear-black">
      <HeroSection />
      <WhoWeAreSection />
      <ThreeCardsSection />
      {/* <FinalBandSection /> */}
    </main>
  )
}
