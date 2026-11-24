import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage"
import { buildPageMetadata } from "@/lib/config/site-metadata"
import { accountTermsDocument } from "@/lib/content/legal"

export const metadata = buildPageMetadata({
  title: accountTermsDocument.title,
  description: accountTermsDocument.description,
  path: accountTermsDocument.path,
})

export default function AccountTermsPage() {
  return <LegalDocumentPage document={accountTermsDocument} />
}
