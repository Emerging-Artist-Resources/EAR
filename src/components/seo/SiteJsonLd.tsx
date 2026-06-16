import { JsonLd } from "@/components/seo/JsonLd"
import { buildSiteJsonLd } from "@/lib/seo/site-schema"

export function SiteJsonLd() {
  return <JsonLd data={buildSiteJsonLd()} />
}
