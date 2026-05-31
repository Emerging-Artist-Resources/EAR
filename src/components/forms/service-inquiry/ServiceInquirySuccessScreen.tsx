import Link from "next/link"
import { Button } from "@/components/ui/button"
import { H2, Text } from "@/components/ui/typography"
import type { ServiceInquiryContent } from "@/lib/service-inquiries/inquiry-content-types"
import { cn } from "@/lib/utils"

type ServiceInquirySuccessScreenProps = {
  content: ServiceInquiryContent
  backHref: string
  backLabel: string
  onSubmitAnother: () => void
}

export function ServiceInquirySuccessScreen({
  content,
  backHref,
  backLabel,
  onSubmitAnother,
}: ServiceInquirySuccessScreenProps) {
  const {
    successTitle,
    successDescription,
    responseTime,
    contactLabel,
    contactEmail,
    nextSteps,
    submitAnotherLabel = "Submit another inquiry",
    successCta,
    successIcon,
  } = content

  const bodyText = responseTime
    ? `${successDescription} We typically respond within ${responseTime}.`
    : successDescription

  return (
    <div className="space-y-6 text-center sm:text-left">
      {successIcon ? <div className="flex justify-center sm:justify-start">{successIcon}</div> : null}
      <H2 className="text-ear-black text-2xl font-bold tracking-tight">{successTitle}</H2>
      <Text className="text-ear-black">{bodyText}</Text>
      {nextSteps && nextSteps.length > 0 ? (
        <ul className="text-ear-black list-inside list-disc space-y-1 text-left text-sm">
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ) : null}
      {contactEmail ? (
        <div className="rounded-md border border-border bg-muted/30 p-4 text-left">
          {contactLabel ? (
            <Text className="text-sm font-medium text-ear-black">{contactLabel}</Text>
          ) : null}
          <a
            href={`mailto:${contactEmail}`}
            className={cn(
              "text-primary-600 hover:text-primary-700 inline-block text-sm font-medium underline",
              contactLabel && "mt-1",
            )}
          >
            {contactEmail}
          </a>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-start">
        <Button asChild variant="default">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
        {successCta ? (
          <Button asChild variant="outline">
            <Link href={successCta.href}>{successCta.label}</Link>
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={onSubmitAnother}>
          {submitAnotherLabel}
        </Button>
      </div>
    </div>
  )
}
