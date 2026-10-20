"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

export type DonationFunnelTrustVariant = "artist" | "generic"

type DonationFunnelTrustHeaderProps = {
  variant?: DonationFunnelTrustVariant
  className?: string
}

export function DonationFunnelTrustHeader({
  variant = "generic",
  className,
}: DonationFunnelTrustHeaderProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/EAR-Logos/EAR LOGOS-09.png"
          alt="Emerging Artist Resources"
          width={100}
          height={100}
          className="h-20 w-auto"
          priority
        />
        <Image
          src="/logos/mignolo/mignolo-logo.png"
          alt="mignolo"
          width={199}
          height={80}
          className="h-12 w-auto"
          priority
        />
      </div>
      <p className="text-sm text-gray-600 text-center">Secure donation powered by Stripe</p>
      {variant === "artist" && (
        <p className="text-xs text-gray-500 text-center max-w-sm">
          EAR fiscally sponsors eligible artist projects.
        </p>
      )}
    </div>
  )
}
