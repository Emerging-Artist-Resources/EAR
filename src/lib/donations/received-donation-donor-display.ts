/** Display-only caps for donor identity lines on the fiscal sponsorship dashboard. */

export const RECEIVED_DONATION_DONOR_DESIGNATION_LABEL_MAX = 28
export const RECEIVED_DONATION_DONOR_MESSAGE_MAX = 40

/** Fixed donor column width for the desktop donations table (`table-layout: fixed`). */
export const RECEIVED_DONATION_DONOR_COLUMN_CLASS = "w-40 max-w-[10rem]"

export function truncateForDonorCellDisplay(
  text: string,
  maxChars: number,
): { display: string; full: string; truncated: boolean } {
  const full = text.trim()
  if (full.length <= maxChars) {
    return { display: full, full, truncated: false }
  }
  return {
    display: `${full.slice(0, maxChars)}…`,
    full,
    truncated: true,
  }
}

export function formatDonorCellDesignationLine(
  label: string,
  prefix: string,
): { display: string; full: string; title?: string } {
  const trimmedLabel = truncateForDonorCellDisplay(
    label,
    RECEIVED_DONATION_DONOR_DESIGNATION_LABEL_MAX,
  )
  const full = `${prefix} · ${trimmedLabel.full}`
  const display = `${prefix} · ${trimmedLabel.display}`
  return {
    display,
    full,
    title: trimmedLabel.truncated ? full : undefined,
  }
}

export function formatDonorCellMessageLine(message: string): {
  display: string
  full: string
  title?: string
} {
  const trimmed = truncateForDonorCellDisplay(message, RECEIVED_DONATION_DONOR_MESSAGE_MAX)
  return {
    display: `“${trimmed.display}”`,
    full: trimmed.full,
    title: trimmed.truncated ? trimmed.full : undefined,
  }
}
