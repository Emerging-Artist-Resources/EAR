import { DocumentationInquiryForm } from "@/components/services/DocumentationInquiryForm"
import { H1, Text } from "@/components/ui/typography"

export default function PhotographyVideographyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <H1 className="mb-2">Photography & Videography</H1>
      <Text className="text-muted-foreground mb-8">
        Request documentation for performances, rehearsals, and events. Tell us about your project below.
      </Text>
      <DocumentationInquiryForm />
    </div>
  )
}
