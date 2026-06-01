/** Canonical service slugs for analytics (matches `services.slug` in DB). */
export const ANALYTICS_SERVICE_INQUIRY_SERVICES = [
  { slug: "fiscal-services", label: "Fiscal Services" },
  { slug: "documentation", label: "Photography & Videography" },
  { slug: "fiscal-sponsorship", label: "Fiscal Sponsorship" },
] as const

export type AnalyticsServiceInquirySlug =
  (typeof ANALYTICS_SERVICE_INQUIRY_SERVICES)[number]["slug"]
