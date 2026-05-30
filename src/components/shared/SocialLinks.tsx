import type { ComponentType } from "react"
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSocialLinks, type SocialPlatform } from "@/lib/config/social-links"

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  )
}

const iconClass = "size-6"

const SOCIAL_ICONS: Record<SocialPlatform, ComponentType> = {
  instagram: () => <Instagram className={iconClass} strokeWidth={1.75} aria-hidden />,
  facebook: () => <Facebook className={iconClass} strokeWidth={1.75} aria-hidden />,
  tiktok: () => <TikTokIcon className={iconClass} />,
  linkedin: () => <Linkedin className={iconClass} strokeWidth={1.75} aria-hidden />,
  youtube: () => <Youtube className={iconClass} strokeWidth={1.75} aria-hidden />,
}

type SocialLinksProps = {
  className?: string
  iconClassName?: string
  platforms?: SocialPlatform[]
}

export function SocialLinks({ className, iconClassName, platforms }: SocialLinksProps) {
  const links = getSocialLinks(platforms)
  if (links.length === 0) return null

  return (
    <nav className={cn("flex flex-wrap items-center gap-5", className)} aria-label="Social media">
      {links.map(({ platform, url, label }) => {
        const Icon = SOCIAL_ICONS[platform]
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ear-off-white focus-visible:ring-offset-2 focus-visible:ring-offset-ear-black rounded-sm",
              iconClassName
            )}
            aria-label={label}
          >
            <Icon />
          </a>
        )
      })}
    </nav>
  )
}
