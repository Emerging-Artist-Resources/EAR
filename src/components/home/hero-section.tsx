import Image from "next/image"
import { EAR_LOGO_04_SRC } from "@/components/home/constants"

export function HeroSection() {
  return (
    <section className="relative top-0 min-h-[75dvh] w-full overflow-hidden bg-ear-black">
      <Image
        src="/images/home-page.png"
        alt=""
        fill
        priority
        className="object-cover object-[center_35%] opacity-90"
        sizes="50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ear-black/50 via-ear-black/25 to-ear-black/60" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-[75dvh] max-w-5xl flex-col items-center justify-center px-6 pb-24 pt-28 text-center">
        <Image
          src={EAR_LOGO_04_SRC}
          alt="EAR"
          width={500}
          height={500}
          className="h-auto w-[min(85vw,18rem)] md:w-[min(55vw,24rem)]"
          priority
        />
      </div>
    </section>
  )
}
