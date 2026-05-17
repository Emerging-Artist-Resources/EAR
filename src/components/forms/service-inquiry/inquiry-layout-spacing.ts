/** Matches site header inner width so the back link sits under the logo. */
export const inquirySiteContainer = "max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8"

/** Canonical spacing for service inquiry forms — import instead of ad-hoc gaps. */
export const inquiryLayoutSpacing = {
  /** Full-width strip directly under the site header */
  navStrip: "w-full pt-4 pb-2",
  navStripInner: inquirySiteContainer,
  /** Centered form column (title, steps, card, footer) */
  page: "mx-auto max-w-3xl px-4 pt-4 pb-10 sm:px-6 lg:px-8",
  title: "mb-8 text-center",
  stepIndicator: "mb-8 flex justify-center",
  card: "bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm sm:p-8",
  cardInner: "space-y-6",
  section: "space-y-6",
  /** Vertical gap between titled subsections on a single wizard step */
  stepSectionGroups: "space-y-10",
  fieldGrid: "grid gap-6 sm:grid-cols-2",
  footer: "mt-8 flex flex-col-reverse gap-3 sm:flex-row",
  footerSinglePrimary: "sm:justify-end",
  footerWithBack: "sm:justify-between",
} as const
