import type { MetadataRoute } from "next"
import { getPublicAppUrl } from "@/lib/config/app-url"
import { PUBLIC_SITEMAP_ENTRIES } from "@/lib/seo/public-routes"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicAppUrl()
  const lastModified = new Date()

  return PUBLIC_SITEMAP_ENTRIES.map((entry) => ({
    url: `${baseUrl}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))
}
