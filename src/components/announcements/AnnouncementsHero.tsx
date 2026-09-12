import { PageHeroParagraphs, SplitPageHero } from "@/components/shared/SplitPageHero"
import { ANNOUNCEMENTS_HERO_IMAGE_SRC, announcementsHero } from "@/lib/content/announcements"

export function AnnouncementsHero() {
  return (
    <SplitPageHero
      headingId="announcements-hero-heading"
      title={announcementsHero.title}
      tagline={announcementsHero.tagline}
      imageSrc={ANNOUNCEMENTS_HERO_IMAGE_SRC}
      imageAlt="Two performers in handstands on a wooden table"
      imagePosition="right"
      imageObjectPosition="object-[center_68%]"
      contentClassName="min-w-0 items-left text-left"
      titleClassName="text-[clamp(1.5rem,7vw,2.25rem)] sm:text-5xl lg:text-6xl"
      growWithContent
      compact
    >
      <PageHeroParagraphs compact paragraphs={announcementsHero.paragraphs} />
    </SplitPageHero>
  )
}
