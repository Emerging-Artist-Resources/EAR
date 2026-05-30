"use client"

import Image from "next/image"
import Link from "next/link"
import { EAR_LOGO_05_SRC } from "@/components/home/constants"
import { NewsletterSignupTrigger } from "@/components/newsletter/NewsletterSignupTrigger"
import { SocialLinks } from "@/components/shared/SocialLinks"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import { FOOTER_SOCIAL_PLATFORMS } from "@/lib/config/social-links"
import { SITE_CONTACT_ADDRESS, SITE_CONTACT_EMAIL } from "@/lib/config/site-contact"
import { cn } from "@/lib/utils"

const footerHeadingClass = "font-header text-xl font-bold text-ear-off-white md:text-2xl"
const footerLinkClass =
  "transition-colors hover:text-ear-baby-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ear-off-white focus-visible:ring-offset-2 focus-visible:ring-offset-ear-black rounded-sm"

export function Footer() {
  return (
    <footer className="mt-0 shrink-0 bg-ear-black text-ear-off-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="grid grid-cols-2 items-start gap-x-6 gap-y-8 md:grid-cols-3 md:gap-x-8 md:gap-y-0 lg:gap-x-12">
          <div className="flex flex-col items-start gap-3 md:gap-4">
            <Image
              src={EAR_LOGO_05_SRC}
              alt="EAR"
              width={420}
              height={120}
              className="block h-auto w-full max-w-36 sm:max-w-44 md:w-56 md:max-w-none"
            />
            <SocialLinks
              className="gap-2.5 text-ear-off-white sm:gap-3"
              platforms={FOOTER_SOCIAL_PLATFORMS}
            />
          </div>

          <div className="flex flex-col gap-3 md:gap-4">
            <h2 className={footerHeadingClass}>Contact Us</h2>
            <address className="not-italic font-sans text-sm leading-6 md:text-base md:leading-7">
              <a
                href={`mailto:${SITE_CONTACT_EMAIL}`}
                className={cn(footerLinkClass, "underline underline-offset-4 break-all sm:break-normal")}
              >
                {SITE_CONTACT_EMAIL}
              </a>
              <Text className="mt-1 block text-ear-off-white">
                {SITE_CONTACT_ADDRESS.line1}
                <br />
                {SITE_CONTACT_ADDRESS.line2}
              </Text>
            </address>
          </div>

          <div className="col-span-2 flex flex-col gap-3 md:col-span-1 md:gap-4">
            <h2 className={footerHeadingClass}>Subscribe</h2>
            <Text className="text-sm text-ear-off-white/95 md:text-base">
              Enter your email to get notified about new events.
            </Text>
            <NewsletterSignupTrigger source="footer">
              {({ onClick }) => (
                <Button
                  type="button"
                  onClick={onClick}
                  className="mt-1 h-auto w-full rounded-none bg-ear-off-white px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ear-black hover:bg-ear-off-white/90 sm:mt-2 sm:px-6 sm:py-4 sm:text-xs sm:tracking-[0.2em] md:max-w-sm"
                >
                  Join our mailing list
                </Button>
              )}
            </NewsletterSignupTrigger>
            <Link
              href="/donate"
              className={cn(
                footerLinkClass,
                "mt-2 inline-block font-sans text-base underline underline-offset-4"
              )}
            >
              Donate to EAR
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
