import type { Metadata } from "next"
import { getPublicAppUrl } from "@/lib/config/app-url"

export const SITE_NAME = "EAR"
export const DEFAULT_TITLE = "Emerging Artist Resources"
export const DEFAULT_DESCRIPTION =
  "Free arts opportunities, performances, classes, auditions, and resources for emerging artists in New York City."
export const DEFAULT_OG_IMAGE = "/images/og-image.png"

export const ORG_DONATION_HERO_MESSAGE = `**Artists deserve systems that support them.**

[Emerging Artist Resources (EAR)](https://www.eararts.org/) is reimagining the arts ecosystem.

Founded in June, 2026 by working artists, EAR is transforming how artists discover opportunities, access resources, and interact with the communities they need to thrive. We believe that with access to resources, support, and connections, artists can build sustainable and fulfilling creative careers.

**We're building the support system we wish we'd had.**

At EAR, we are developing a digital platform that centralizes the opportunities, resources, services, and people that make our artistic landscape. Our vision is an accessible, all-in-one platform where artists can discover and pursue opportunities, track their progress, build connections, access professional support, and navigate their careers with greater confidence.

But access to information is only one part of the equation.

Through hands-on services, including fiscal sponsorship, educational workshops, photography & videography, and accessible community programming, EAR is already providing artists with the support they need to move their careers forward.

By combining technology with direct services, we're building more than a resource hub. We're creating an interconnected infrastructure designed to support artists at every stage of their creative careers.

**Building this takes a community!**

Your contribution directly supports the expansion of our platform, the creation of new opportunities, and invests in the long-term sustainability of the artists who make our communities vibrant.

**Support the artists. Strengthen the community. Help build what's next.**

*Interested in giving through a donor-advised fund, learning more about EAR, or getting involved in other ways? We'd love to hear from you! Every contribution, connection, and helping hand makes a difference.*

Reach out to us at [**info@eararts.org**](mailto:info@eararts.org).`

/** Share and search text. The page message above is too long for a link preview. */
const ORG_DONATION_DESCRIPTION =
  "Your donation directly supports emerging artists by funding opportunities, resources, and access to creative work."

export const ORG_DONATION_OG_IMAGE = "/ear-donation-hero.jpg"

const DEFAULT_OG_TITLE = `${SITE_NAME} | ${DEFAULT_TITLE}`

type OgImageInput = string | { url: string; width?: number; height?: number; alt?: string }

function toOgImages(images: OgImageInput[], alt: string) {
  return images.map((image) => {
    if (typeof image === "string") {
      return { url: image, alt }
    }
    return { ...image, alt: image.alt ?? alt }
  })
}

function toTwitterImageUrls(images: OgImageInput[]): string[] {
  return images.map((image) => (typeof image === "string" ? image : image.url))
}

function buildOpenGraphAndTwitter(options: {
  title: string
  description: string
  path?: string
  images: OgImageInput[]
  imageAlt: string
}): Pick<Metadata, "openGraph" | "twitter"> {
  const ogImages = toOgImages(options.images, options.imageAlt)

  return {
    openGraph: {
      title: options.title,
      description: options.description,
      url: options.path ?? "/",
      siteName: SITE_NAME,
      images: ogImages,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: toTwitterImageUrls(options.images),
    },
  }
}

export function buildSiteMetadata(): Metadata {
  const title = DEFAULT_OG_TITLE
  const description = DEFAULT_DESCRIPTION
  const images = [DEFAULT_OG_IMAGE]

  return {
    metadataBase: new URL(getPublicAppUrl()),
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    alternates: {
      canonical: "/",
    },
    ...buildOpenGraphAndTwitter({
      title,
      description,
      path: "/",
      images,
      imageAlt: SITE_NAME,
    }),
  }
}

export type PageMetadataOptions = {
  title: string
  description: string
  path: string
  images?: OgImageInput[]
  imageAlt?: string
}

export function buildPageMetadata(options: PageMetadataOptions): Metadata {
  const images = options.images ?? [DEFAULT_OG_IMAGE]
  const imageAlt = options.imageAlt ?? options.title
  const ogTitle = `${options.title} | ${SITE_NAME}`

  return {
    title: options.title,
    description: options.description,
    alternates: {
      canonical: options.path,
    },
    ...buildOpenGraphAndTwitter({
      title: ogTitle,
      description: options.description,
      path: options.path,
      images,
      imageAlt,
    }),
  }
}

export function buildOrgDonationMetadata(): Metadata {
  return buildPageMetadata({
    title: "Donate",
    description: ORG_DONATION_DESCRIPTION,
    path: "/donate",
    images: [ORG_DONATION_OG_IMAGE],
    imageAlt: "Support Emerging Artist Resources",
  })
}

export function buildArtistDonationMetadata(options: {
  displayName: string
  description: string
  slug: string
  imageUrl?: string | null
}): Metadata {
  const displayName = options.displayName.trim() || "this artist"

  return buildPageMetadata({
    title: `Donate to ${displayName}`,
    description: options.description,
    path: `/donate/${encodeURIComponent(options.slug)}`,
    images: options.imageUrl ? [options.imageUrl] : [DEFAULT_OG_IMAGE],
    imageAlt: `Donate to ${displayName}`,
  })
}

/** Metadata for authenticated or internal routes that should not appear in search results. */
export function buildNoIndexMetadata(): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
    },
  }
}
