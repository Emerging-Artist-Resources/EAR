import type { Metadata } from "next"
import { AboutUsAdvisoryBoardSection } from "@/components/about-us/AboutUsAdvisoryBoardSection"
import { AboutUsHeroSection } from "@/components/about-us/AboutUsHeroSection"
import { AboutUsStayInTouchSection } from "@/components/about-us/AboutUsStayInTouchSection"
import { AboutUsTeamSection } from "@/components/about-us/AboutUsTeamSection"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Meet the team behind Emerging Artist Resources — community-driven, solution-oriented, and artist-centered arts administration in NYC.",
}

export default function AboutUsPage() {
  return (
    <main>
      <AboutUsHeroSection />
      <AboutUsTeamSection />
      <AboutUsAdvisoryBoardSection />
      <AboutUsStayInTouchSection />
    </main>
  )
}
