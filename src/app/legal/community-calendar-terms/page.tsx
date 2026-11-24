import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage"
import { buildPageMetadata } from "@/lib/config/site-metadata"
import { communityCalendarTermsDocument } from "@/lib/content/legal"

export const metadata = buildPageMetadata({
  title: communityCalendarTermsDocument.title,
  description: communityCalendarTermsDocument.description,
  path: communityCalendarTermsDocument.path,
})

export default function CommunityCalendarTermsPage() {
  return <LegalDocumentPage document={communityCalendarTermsDocument} />
}
