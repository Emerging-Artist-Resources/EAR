export type ServiceInquiryPdfFieldVariant = "default" | "long" | "multiselect"

export type ServiceInquiryPdfFieldRow = {
  label: string
  value: string
  variant?: ServiceInquiryPdfFieldVariant
  multiselectItems?: string[]
}

export type ServiceInquiryPdfSection = {
  title: string
  rows: ServiceInquiryPdfFieldRow[]
}

export type ServiceInquiryPdfInput = {
  documentTitle: string
  inquiryId: string
  submittedAtLabel: string
  submitterName: string
  submitterEmail: string
  sections: ServiceInquiryPdfSection[]
}

export function splitSubmitterName(fullName: string): { firstName: string; lastName: string } {
  const t = fullName.trim()
  const space = t.indexOf(" ")
  if (space === -1) return { firstName: t, lastName: "" }
  return { firstName: t.slice(0, space), lastName: t.slice(space + 1).trim() }
}

export function buildServiceInquiryPdfFileName(
  filePrefix: string,
  submitterName: string,
  submittedAt: Date,
): string {
  const safe = submitterName
    .trim()
    .replace(/[/\\:*?"<>|#\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40) || "inquiry"
  const y = submittedAt.getFullYear()
  const m = String(submittedAt.getMonth() + 1).padStart(2, "0")
  const d = String(submittedAt.getDate()).padStart(2, "0")
  return `${filePrefix}-${safe}-${y}-${m}-${d}.pdf`
}
