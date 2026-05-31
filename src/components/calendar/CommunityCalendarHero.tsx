import { PageHeroParagraphs, SplitPageHero } from "@/components/shared/SplitPageHero"
import { calendarHero, CALENDAR_HERO_IMAGE_SRC } from "@/lib/content/calendar"

export default function CommunityCalendarHero() {
  return (
    <SplitPageHero
      headingId="community-calendar-hero-heading"
      title={calendarHero.title}
      imageSrc={CALENDAR_HERO_IMAGE_SRC}
      imagePosition="left"
    >
      <PageHeroParagraphs
        lead={calendarHero.lead}
        paragraphs={calendarHero.paragraphs}
      />
    </SplitPageHero>
  )
}
