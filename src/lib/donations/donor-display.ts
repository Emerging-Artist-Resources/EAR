export const ANONYMOUS_DONOR_LABEL = "Anonymous"

export function donorDisplayName(donorName: string | null | undefined): string {
  return donorName?.trim() || ANONYMOUS_DONOR_LABEL
}
