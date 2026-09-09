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
      contentClassName="items-left text-left"
      growWithContent
      compact
    >
      <PageHeroParagraphs compact paragraphs={announcementsHero.paragraphs} />
    </SplitPageHero>
  )
}
