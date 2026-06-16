import { getPublicAppUrl } from "@/lib/config/app-url"
import { getSocialLinks } from "@/lib/config/social-links"
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
} from "@/lib/config/site-metadata"
import { SITE_CONTACT_ADDRESS, SITE_CONTACT_EMAIL } from "@/lib/config/site-contact"

function absoluteUrl(path: string): string {
  const baseUrl = getPublicAppUrl()
  return path.startsWith("http") ? path : `${baseUrl}${path}`
}

function buildPostalAddress() {
  const match = SITE_CONTACT_ADDRESS.line2.match(/^([^,]+),\s*([A-Z]{2})\s+(\d{5})$/)
  return {
    "@type": "PostalAddress" as const,
    streetAddress: SITE_CONTACT_ADDRESS.line1,
    addressLocality: match?.[1] ?? "Brooklyn",
    addressRegion: match?.[2] ?? "NY",
    postalCode: match?.[3] ?? "11206",
    addressCountry: "US",
  }
}

export function buildOrganizationSchema() {
  const url = getPublicAppUrl()
  const sameAs = getSocialLinks().map((link) => link.url)

  return {
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name: DEFAULT_TITLE,
    alternateName: SITE_NAME,
    url,
    logo: absoluteUrl(DEFAULT_OG_IMAGE),
    description: DEFAULT_DESCRIPTION,
    email: SITE_CONTACT_EMAIL,
    address: buildPostalAddress(),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

export function buildWebSiteSchema() {
  const url = getPublicAppUrl()

  return {
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name: DEFAULT_TITLE,
    alternateName: SITE_NAME,
    url,
    publisher: { "@id": `${url}/#organization` },
  }
}

export function buildSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationSchema(), buildWebSiteSchema()],
  }
}
