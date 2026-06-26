import type { MetadataRoute } from "next"

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>

export type PublicSitemapEntry = {
  /** Site path, including leading slash. */
  path: string
  priority: number
  changeFrequency: ChangeFrequency
}

/**
 * Public marketing routes included in sitemap.xml.
 * Excludes auth, profile, admin, forms, funnel pages, and dynamic slug routes.
 * When crawlable listing pages ship (Phase 2), extend via dynamic sitemap generation.
 */
export const PUBLIC_SITEMAP_ENTRIES: readonly PublicSitemapEntry[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/calendar", priority: 0.9, changeFrequency: "daily" },
  { path: "/about-us", priority: 0.8, changeFrequency: "monthly" },
  { path: "/our-story", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services", priority: 0.7, changeFrequency: "monthly" },
  { path: "/services/fiscal-sponsorship", priority: 0.7, changeFrequency: "monthly" },
  { path: "/services/fiscal-sponsorship/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/services/fiscal-services", priority: 0.7, changeFrequency: "monthly" },
  { path: "/services/photography-videography", priority: 0.7, changeFrequency: "monthly" },
  { path: "/donate", priority: 0.5, changeFrequency: "monthly" },
] as const

/**
 * Path prefixes blocked in robots.txt.
 * `/donate/` blocks artist slug pages while `/donate` remains indexable.
 */
export const ROBOTS_DISALLOW_PREFIXES: readonly string[] = [
  "/auth/",
  "/profile/",
  "/admin/",
  "/api/",
  "/forms/",
  "/donations/",
  "/donate/",
  "/services/fiscal-sponsorship/inquiry",
  "/services/fiscal-services/inquiry",
  "/services/photography-videography/inquiry",
] as const
