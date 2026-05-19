"use client"

import Image from "next/image"
import Link from "next/link"
import { Mail } from "lucide-react"
import { EAR_LOGO_04_SRC } from "@/components/home/constants"
import { NewsletterSignupTrigger } from "@/components/newsletter/NewsletterSignupTrigger"

export function FinalBandSection() {
  const instagramUrl =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() ||
    "https://www.instagram.com/emergingartistresources"

  return (
    <section className="relative min-h-[28rem] w-full overflow-hidden bg-ear-black md:min-h-[32rem]">
      <Image
        src="/images/home-final.png"
        alt=""
        fill
        className="object-cover object-center opacity-85"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ear-black/75 via-ear-black/55 to-ear-black/70" aria-hidden />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-end md:gap-16 md:py-20 lg:px-8">
        <div className="flex flex-col items-start gap-6 text-ear-off-white">
          <Image
            src={EAR_LOGO_04_SRC}
            alt="EAR"
            width={500}
            height={120}
            className="h-auto w-100 md:w-100"
          />
          <p className="max-w-sm font-sans text-lg font-medium uppercase tracking-[0.18em] text-ear-off-white/95">
            Emerging Artist Resources
          </p>
          <Link
            href="/donate"
            className="group inline-flex flex-col gap-1 font-sans text-lg font-semibold uppercase tracking-wide text-ear-off-white underline-offset-4 hover:underline"
          >
            Donate now
            <span className="h-0.5 w-full max-w-[12rem] bg-ear-baby-blue/90 transition-colors group-hover:bg-ear-baby-blue" />
          </Link>
        </div>
        <div className="flex flex-col gap-6 font-sans text-ear-off-white md:items-end md:text-right">
          <p className="flex flex-wrap items-center gap-2 text-base md:justify-end">
            <span className="text-ear-baby-blue" aria-hidden>
              &gt;
            </span>
            <span>
              Email{" "}
              <a
                href="mailto:info@eararts.org"
                className="underline decoration-ear-baby-blue/80 underline-offset-4 hover:text-ear-baby-blue"
              >
                info@eararts.org
              </a>
            </span>
          </p>
          <p className="flex flex-wrap items-center gap-2 text-base md:justify-end">
            <span className="text-ear-baby-blue" aria-hidden>
              &gt;
            </span>
            <span>
              Instagram{" "}
              <a
                href={instagramUrl}
                className="underline decoration-ear-baby-blue/80 underline-offset-4 hover:text-ear-baby-blue"
                target="_blank"
                rel="noopener noreferrer"
              >
                @emergingartistresources
              </a>
            </span>
          </p>
          <NewsletterSignupTrigger source="home" sourceContext="final-band">
            {({ onClick }) => (
              <div className="mt-4 flex flex-col items-start gap-2 md:items-end">
                <Mail className="h-6 w-6 text-ear-baby-blue md:ml-auto" strokeWidth={1.5} aria-hidden />
                <span className="text-sm font-medium uppercase tracking-wider text-ear-off-white/90">
                  Join our mailing list
                </span>
                <button
                  type="button"
                  onClick={onClick}
                  className="text-left text-sm text-ear-baby-blue underline underline-offset-4 hover:text-ear-off-white md:text-right"
                >
                  Subscribe to newsletters
                </button>
              </div>
            )}
          </NewsletterSignupTrigger>
        </div>
      </div>
    </section>
  )
}
