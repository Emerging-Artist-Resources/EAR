import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage"
import { buildPageMetadata } from "@/lib/config/site-metadata"
import { privacyPolicyDocument } from "@/lib/content/legal"

export const metadata = buildPageMetadata({
  title: privacyPolicyDocument.title,
  description: privacyPolicyDocument.description,
  path: privacyPolicyDocument.path,
})

export default function PrivacyPolicyPage() {
  return <LegalDocumentPage document={privacyPolicyDocument} />
}
