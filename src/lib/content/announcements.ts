export const ANNOUNCEMENTS_HERO_IMAGE_SRC = "/images/announcements/hero.JPG" as const

export const announcementsHero = {
  title: "Announcements",
  tagline: "WHAT'S HAPPENING AT EAR",
  paragraphs: [
    "Upcoming events, workshops, programs, and resources from EAR.",
  ],
} as const

export const announcementsEmpty = {
  title: "Nothing posted right now",
  body: "When EAR has a workshop, program, or resource to share, it will land here.",
  calendarLabel: "Browse the calendar",
  emailLabel: "Get updates by email",
} as const
