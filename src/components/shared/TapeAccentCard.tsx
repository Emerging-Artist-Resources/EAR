import Image from "next/image"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const DEFAULT_TAPE_SRC = "/accents/tape.png"

type TapeAccentCardProps = {
  children: React.ReactNode
  className?: string
  cardClassName?: string
  tapeSrc?: string
}

export function TapeAccentCard({
  children,
  className,
  cardClassName,
  tapeSrc = DEFAULT_TAPE_SRC,
}: TapeAccentCardProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2"
        aria-hidden
      >
        <Image
          src={tapeSrc}
          alt=""
          width={1025}
          height={213}
          quality={100}
          sizes="(max-width: 640px) 240px, 320px"
          className="h-auto w-60 object-contain sm:w-72 md:w-80"
          draggable={false}
        />
      </div>
      <Card
        padding="none"
        className={cn(
          "relative overflow-hidden border-ear-black/10 bg-ear-off-white shadow-lg",
          cardClassName,
        )}
      >
        {children}
      </Card>
    </div>
  )
}
