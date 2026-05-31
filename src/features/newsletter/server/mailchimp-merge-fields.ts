import { splitSubmitterName } from "@/lib/service-inquiries/service-inquiry-pdf-types"

export function buildMailchimpMergeFieldsFromParts(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): Record<string, string> | undefined {
  const merge_fields: Record<string, string> = {}
  const fname = firstName?.trim()
  const lname = lastName?.trim()
  if (fname) merge_fields.FNAME = fname
  if (lname) merge_fields.LNAME = lname
  return Object.keys(merge_fields).length > 0 ? merge_fields : undefined
}

export function buildMailchimpMergeFields(
  fullName: string | null | undefined,
): Record<string, string> | undefined {
  if (!fullName?.trim()) return undefined

  const { firstName, lastName } = splitSubmitterName(fullName)
  return buildMailchimpMergeFieldsFromParts(firstName, lastName)
}
