import { OurStoryLetterSection } from "@/components/our-story/OurStoryLetterSection"
import { OurStoryStayInTouchSection } from "@/components/our-story/OurStoryStayInTouchSection"
import { buildPageMetadata } from "@/lib/config/site-metadata"

export const metadata = buildPageMetadata({
  title: "Our Story",
  description:
    "A letter from the founding team of Emerging Artist Resources — how EAR began in NYC and why we build shared infrastructure for working artists.",
  path: "/our-story",
})

export default function OurStoryPage() {
  return (
    <main>
      <OurStoryLetterSection />
      <OurStoryStayInTouchSection />
    </main>
  )
}
