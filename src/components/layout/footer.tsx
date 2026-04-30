"use client"

import Link from "next/link"
import { Instagram, Linkedin, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"

function trimUrl(url: string | undefined): string | undefined {
  const t = url?.trim()
  return t ? t : undefined
}

export function Footer() {
  // Read NEXT_PUBLIC_* directly so the client bundle matches SSR (same as Next env inlining).
  const instagramUrl = trimUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL)
  const youtubeUrl = trimUrl(process.env.NEXT_PUBLIC_YOUTUBE_URL)
  const linkedinUrl = trimUrl(process.env.NEXT_PUBLIC_LINKEDIN_URL)

  const socialIconClass =
    "text-ear-baby-blue transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"

  return (
    <footer className="mt-12 shrink-0 bg-background border-t border-ear-off-white/10">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            className="text-sm leading-6 text-ear-baby-blue"
            suppressHydrationWarning
          >
            © {new Date().getFullYear()} Emerging Artist Resources
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <nav className="flex flex-wrap items-center gap-4 text-sm" aria-label="Footer">
              <Link className="underline text-ear-baby-blue hover:text-primary" href="/calendar">Calendar</Link>
              <Link className="underline text-ear-baby-blue hover:text-primary" href="/announcement">Announcements</Link>
              <Link className="underline text-ear-baby-blue hover:text-primary" href="/profile">Profile</Link>
              <Link className="underline text-ear-baby-blue hover:text-primary" href="/forms">Submit Listing</Link>
              <Link className="underline text-ear-baby-blue hover:text-primary" href="/donate">Donate</Link>
            </nav>
            {(instagramUrl || youtubeUrl || linkedinUrl) && (
              <nav className="flex items-center gap-4" aria-label="Social media">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(socialIconClass, "inline-flex")}
                    aria-label="Emerging Artist Resources on Instagram"
                  >
                    <Instagram className="size-5" strokeWidth={1.75} aria-hidden />
                  </a>
                )}
                {youtubeUrl && (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(socialIconClass, "inline-flex")}
                    aria-label="Emerging Artist Resources on YouTube"
                  >
                    <Youtube className="size-5" strokeWidth={1.75} aria-hidden />
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(socialIconClass, "inline-flex")}
                    aria-label="Emerging Artist Resources on LinkedIn"
                  >
                    <Linkedin className="size-5" strokeWidth={1.75} aria-hidden />
                  </a>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}


