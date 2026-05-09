import Image from "next/image"
import Link from "next/link"

export type NavCardProps = {
  href: string
  title: string
  imageSrc: string
  tapeSrc: string
  imageAlt: string
}

export function NavCard({ href, title, imageSrc, tapeSrc, imageAlt }: NavCardProps) {
  return (
    <Link href={href} className="group relative block">
      <div className="relative min-h-[30rem] overflow-hidden rounded-sm border border-white/80 shadow-lg md:min-h-[40rem]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ear-black/85 via-ear-black/35 to-ear-black/20" />
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-start px-4 pb-10 pt-[22%] text-center md:pt-[20%]">
          <h3 className="font-header text-2xl font-bold uppercase tracking-wide text-ear-off-white md:text-3xl">
            {title}
          </h3>
        </div>
      </div>
      {/* Half the tape sits above the card (cream bg), half on the image — not clipped by overflow-hidden */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2"
        aria-hidden
      >
        <Image
          src={tapeSrc}
          alt=""
          width={300}
          height={300}
          className="h-auto w-auto object-contain object-center"
        />
      </div>
    </Link>
  )
}
