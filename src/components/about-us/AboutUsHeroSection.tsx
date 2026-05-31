import {
  PageHeroParagraphs,
  SplitPageHero,
} from "@/components/shared/SplitPageHero"
import { ABOUT_US_HERO_IMAGE_SRC, aboutUsHero } from "@/lib/content/about-us"

type AboutUsHeroSectionProps = {
  className?: string
}

export function AboutUsHeroSection({ className }: AboutUsHeroSectionProps) {
  return (
    <SplitPageHero
      headingId="about-us-hero-heading"
      title={aboutUsHero.title}
      tagline={aboutUsHero.tagline}
      imageSrc={ABOUT_US_HERO_IMAGE_SRC}
      imageAlt="Emerging Artist Resources team and community"
      imagePosition="right"
      growWithContent
      compact
      className={className}
    >
      <PageHeroParagraphs compact paragraphs={aboutUsHero.paragraphs} />
    </SplitPageHero>
  )
}
