import { Text } from "@/components/ui/typography"

type InquiryIntroStepProps = {
  title: string
  body: string
}

/**
 * Step 1 — description / overview only. No fields yet.
 */
export function InquiryIntroStep({ title, body }: InquiryIntroStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h2>
      <Text className="text-foreground/90 max-w-prose leading-relaxed">{body}</Text>
    </div>
  )
}
