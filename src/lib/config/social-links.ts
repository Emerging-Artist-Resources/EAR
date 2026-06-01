export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "linkedin" | "youtube"

export type SocialLink = {
  platform: SocialPlatform
  url: string
  label: string
}

function trimUrl(url: string | undefined): string | undefined {
  const trimmed = url?.trim()
  return trimmed ? trimmed : undefined
}

/** Read directly so Next.js can inline NEXT_PUBLIC_* in the client bundle. */
function getSocialUrl(platform: SocialPlatform): string | undefined {
  switch (platform) {
    case "instagram":
      return trimUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL)
    case "facebook":
      return trimUrl(process.env.NEXT_PUBLIC_FACEBOOK_URL)
    case "tiktok":
      return trimUrl(process.env.NEXT_PUBLIC_TIKTOK_URL)
    case "linkedin":
      return trimUrl(process.env.NEXT_PUBLIC_LINKEDIN_URL)
    case "youtube":
      return trimUrl(process.env.NEXT_PUBLIC_YOUTUBE_URL)
  }
}

const SOCIAL_LINK_LABELS: Record<SocialPlatform, string> = {
  instagram: "Emerging Artist Resources on Instagram",
  facebook: "Emerging Artist Resources on Facebook",
  tiktok: "Emerging Artist Resources on TikTok",
  linkedin: "Emerging Artist Resources on LinkedIn",
  youtube: "Emerging Artist Resources on YouTube",
}

const DEFAULT_SOCIAL_URLS: Partial<Record<SocialPlatform, string>> = {
  instagram: "https://www.instagram.com/emergingartistresources",
  facebook: "https://www.facebook.com/profile.php?id=61573304949829",
  tiktok: "https://www.tiktok.com/@emerging.artist.r?",
  linkedin: "https://www.linkedin.com/company/emerging-artist-resources",
  youtube: "https://www.youtube.com/@emergingartistresources",
}

const ALL_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "facebook",
  "tiktok",
  "linkedin",
  "youtube",
]

/** Social profile URLs; env vars override defaults where provided. */
export function getSocialLinks(platforms: SocialPlatform[] = ALL_PLATFORMS): SocialLink[] {
  return platforms.flatMap((platform) => {
    const url = getSocialUrl(platform) ?? DEFAULT_SOCIAL_URLS[platform]
    return url ? [{ platform, url, label: SOCIAL_LINK_LABELS[platform] }] : []
  })
}

export const FOOTER_SOCIAL_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "facebook",
  "tiktok",
  "linkedin",
  "youtube",
]
