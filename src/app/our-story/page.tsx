import type { Metadata } from "next"
import { OurStoryLetterSection } from "@/components/our-story/OurStoryLetterSection"
import { OurStoryStayInTouchSection } from "@/components/our-story/OurStoryStayInTouchSection"

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "A letter from the founding team of Emerging Artist Resources — how EAR began and why we build shared infrastructure for working artists.",
}

export default function OurStoryPage() {
  return (
    <main>
      <OurStoryLetterSection />
      <OurStoryStayInTouchSection />
    </main>
  )
}
