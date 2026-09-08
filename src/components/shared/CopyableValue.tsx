"use client"

import { Muted, Text } from "@/components/ui/typography"
import { CopyValueButton } from "@/components/shared/CopyValueButton"

type CopyableValueProps = {
  value: string
  label?: string
}

export function CopyableValue({ value, label }: CopyableValueProps) {
  return (
    <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
      <div className="min-w-0">
        {label ? <Muted className="mb-1 text-ear-black/70">{label}</Muted> : null}
        <Text className="font-mono text-lg font-semibold tracking-wide text-ear-black">
          {value}
        </Text>
      </div>
      <CopyValueButton value={value} />
    </div>
  )
}
