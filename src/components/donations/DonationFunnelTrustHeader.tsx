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
      <Image
        src="/EAR-logo.png"
        alt="Emerging Artist Resources"
        width={288}
        height={353}
        className="h-14 w-auto"
        priority
      />
      <p className="text-sm text-gray-600 text-center">Secure donation powered by Stripe</p>
      {variant === "artist" && (
        <p className="text-xs text-gray-500 text-center max-w-sm">
          EAR fiscally sponsors eligible artist projects.
        </p>
      )}
    </div>
  )
}
