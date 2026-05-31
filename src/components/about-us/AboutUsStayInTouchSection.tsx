"use client"

import Image from "next/image"
import { TapeAccentCard } from "@/components/shared/TapeAccentCard"
import { NewsletterSignupTrigger } from "@/components/newsletter/NewsletterSignupTrigger"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ABOUT_US_STAY_IN_TOUCH_SRC, aboutUsStayInTouch } from "@/lib/content/about-us"
import { H1 } from "../ui/typography"

type AboutUsStayInTouchSectionProps = {
  className?: string
}

export function AboutUsStayInTouchSection({ className }: AboutUsStayInTouchSectionProps) {
  return (
    <section
      className={cn("relative min-h-[32rem] overflow-hidden md:min-h-[40rem]", className)}
      aria-labelledby="about-us-stay-in-touch-heading"
    >
      <Image
        src={ABOUT_US_STAY_IN_TOUCH_SRC}
        alt="Emerging Artist Resources community"
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority={false}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-ear-black/45 via-ear-black/20 to-ear-black/55"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[32rem] max-w-6xl flex-col px-4 py-12 sm:px-6 md:min-h-[40rem] md:py-16 lg:px-8">
        <H1
          id="about-us-stay-in-touch-heading"
          className="text-3xl font-bold uppercase tracking-wide text-ear-off-white md:text-4xl lg:text-5xl"
        >
          {aboutUsStayInTouch.heading}
        </H1>

        <div className="mt-auto flex justify-center pt-10 md:justify-end md:pt-0">
          <TapeAccentCard className="w-full max-w-md">
            <div className="px-6 pb-8 pt-14 text-center sm:px-8 sm:pb-10 sm:pt-16">
              <h3 className="font-header text-xl font-bold uppercase tracking-wide text-ear-black sm:text-2xl">
                {aboutUsStayInTouch.cardTitle}
              </h3>
              <NewsletterSignupTrigger source="about-us" sourceContext="stay-in-touch">
                {({ onClick }) => (
                  <Button
                    type="button"
                    onClick={onClick}
                    className="mt-6 h-auto rounded-none bg-ear-dark-red px-8 py-4 text-xs font-semibold uppercase tracking-widest text-ear-off-white hover:bg-ear-dark-red/90"
                  >
                    {aboutUsStayInTouch.ctaLabel}
                  </Button>
                )}
              </NewsletterSignupTrigger>
            </div>
          </TapeAccentCard>
        </div>
      </div>
    </section>
  )
}
