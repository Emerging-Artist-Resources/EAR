import type { MetadataRoute } from "next"
import { getPublicAppUrl } from "@/lib/config/app-url"
import { ROBOTS_DISALLOW_PREFIXES } from "@/lib/seo/public-routes"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicAppUrl()

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_PREFIXES],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
