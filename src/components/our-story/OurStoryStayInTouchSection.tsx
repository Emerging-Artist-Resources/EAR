"use client"

import Image from "next/image"
import { NewsletterSignupInlineForm } from "@/components/newsletter/NewsletterSignupInlineForm"
import { cn } from "@/lib/utils"
import { OUR_STORY_REACH_OUT_SRC, ourStoryStayInTouch } from "@/lib/content/our-story"
import { H1 } from "../ui/typography"
import { Card, CardContent } from "../ui/card"

type OurStoryStayInTouchSectionProps = {
  className?: string
}

export function OurStoryStayInTouchSection({ className }: OurStoryStayInTouchSectionProps) {
  return (
    <section
      className={cn("relative min-h-[32rem] overflow-hidden md:min-h-[40rem]", className)}
      aria-labelledby="our-story-stay-in-touch-heading"
    >
      <Image
        src={OUR_STORY_REACH_OUT_SRC}
        alt="The founding team of Emerging Artist Resources"
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
          id="our-story-stay-in-touch-heading"
          className="text-3xl font-bold uppercase tracking-wide text-ear-off-white md:text-4xl lg:text-5xl"
        >
          {ourStoryStayInTouch.heading}
        </H1>

        <div className="mt-auto flex justify-center pt-10 md:justify-end md:pt-0">
          <Card className="w-full max-w-lg">
            <CardContent>
              <h3 className="font-header text-center text-xl font-bold uppercase tracking-wide text-ear-black sm:text-2xl">
                {ourStoryStayInTouch.cardTitle}
              </h3>
              <div className="mt-6">
                <NewsletterSignupInlineForm
                  source="our-story"
                  sourceContext="stay-in-touch"
                  submitLabel={ourStoryStayInTouch.ctaLabel}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
