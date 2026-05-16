import Link from "next/link"
import { Button } from "@/components/ui/button"
import { H2, Text } from "@/components/ui/typography"
import { fiscalSponsorshipInquirySuccess } from "@/lib/fiscal-sponsorship-inquiry-content"

type InquirySuccessScreenProps = {
  onSubmitAnother: () => void
}

export function InquirySuccessScreen({ onSubmitAnother }: InquirySuccessScreenProps) {
  return (
    <div className="space-y-6 text-center sm:text-left">
      <H2 className="text-foreground text-2xl font-bold tracking-tight">
        {fiscalSponsorshipInquirySuccess.title}
      </H2>
      <Text className="text-muted-foreground">{fiscalSponsorshipInquirySuccess.body}</Text>
      <div className="rounded-md border border-border bg-muted/30 p-4 text-left">
        <Text className="text-sm font-medium text-foreground">
          {fiscalSponsorshipInquirySuccess.contactLabel}
        </Text>
        <a
          href={`mailto:${fiscalSponsorshipInquirySuccess.contactEmail}`}
          className="text-primary-600 hover:text-primary-700 mt-1 inline-block text-sm font-medium underline"
        >
          {fiscalSponsorshipInquirySuccess.contactEmail}
        </a>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-start">
        <Button asChild variant="default">
          <Link href="/services/fiscal-sponsorship">Back to Fiscal sponsorship</Link>
        </Button>
        <Button type="button" variant="outline" onClick={onSubmitAnother}>
          Submit another inquiry
        </Button>
      </div>
    </div>
  )
}
