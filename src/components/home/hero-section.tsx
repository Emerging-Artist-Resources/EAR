import Image from "next/image"
import {
  EAR_LOGO_04_SRC,
  HOME_HERO_LEFT_IMAGE_SRC,
  HOME_HERO_RIGHT_IMAGE_SRC,
} from "@/components/home/constants"
import { DEFAULT_TITLE } from "@/lib/config/site-metadata"
import { MARKETING_IMAGE_QUALITY, SPLIT_PAGE_HERO_IMAGE_SIZES } from "@/lib/images"

export function HeroSection() {
  return (
    <section className="relative top-0 min-h-[100dvh] w-full overflow-hidden bg-ear-black">
      <div className="absolute inset-0 grid grid-cols-2" aria-hidden>
        <div className="relative">
          <Image
            src={HOME_HERO_LEFT_IMAGE_SRC}
            alt=""
            fill
            priority
            quality={MARKETING_IMAGE_QUALITY}
            className="object-cover object-center opacity-90"
            sizes={SPLIT_PAGE_HERO_IMAGE_SIZES}
          />
        </div>
        <div className="relative">
          <Image
            src={HOME_HERO_RIGHT_IMAGE_SRC}
            alt=""
            fill
            priority
            quality={MARKETING_IMAGE_QUALITY}
            className="object-cover object-center opacity-90"
            sizes={SPLIT_PAGE_HERO_IMAGE_SIZES}
          />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-ear-black/50 via-ear-black/25 to-ear-black/60" aria-hidden />
      <h1 className="relative z-10 mx-auto flex min-h-[75dvh] max-w-5xl flex-col items-center justify-center px-6 pb-24 pt-28 text-center">
        <Image
          src={EAR_LOGO_04_SRC}
          alt=""
          aria-hidden
          width={500}
          height={500}
          className="h-auto w-[min(85vw,18rem)] md:w-[min(55vw,24rem)]"
          priority
        />
        <span className="sr-only">{DEFAULT_TITLE}</span>
      </h1>
    </section>
  )
}
