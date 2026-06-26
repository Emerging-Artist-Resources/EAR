import type { Metadata } from "next"
import { getPublicAppUrl } from "@/lib/config/app-url"

export const SITE_NAME = "EAR"
export const DEFAULT_TITLE = "Emerging Artist Resources"
export const DEFAULT_DESCRIPTION =
  "Free arts opportunities, performances, classes, auditions, and resources for emerging artists in New York City."
export const DEFAULT_OG_IMAGE = "/images/og-image.png"

export const ORG_DONATION_HERO_MESSAGE =
  "Your donation directly supports emerging artists by funding opportunities, resources, and access to creative work."

export const ORG_DONATION_OG_IMAGE = "/donate-ear-hero.JPG"

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
    description: ORG_DONATION_HERO_MESSAGE,
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
