import {
  generateDonationPdf,
  generateMinimalDonationPdfFallback,
  type GenerateDonationPdfInput,
} from "@/lib/pdf/generateDonationPdf"

export type DonationReceiptRow = {
  id: string
  created_at?: string | null
  donor_name: string | null
  donor_email: string | null
  recipient_name: string | null
  recipient_user_id: string | null
  amount: number
  message: string | null
  cover_card_fee: boolean | null
  cover_fiscal_fee: boolean | null
  designation_option_id: string | null
  designation_label_snapshot: string | null
}

export type DonationReceiptOverrides = {
  /** Used only when the row has no donor name (e.g. Stripe Checkout name). */
  donorName?: string
  /** Preferred email when Stripe Checkout has a customer email. */
  donorEmail?: string
  amountCents?: number
  donorMessage?: string
  dateLabel: string
}

export function resolveDonationReceiptDesignation(
  row: Pick<DonationReceiptRow, "designation_option_id" | "designation_label_snapshot">,
): string | undefined {
  const optionId = row.designation_option_id?.trim() ?? ""
  if (!optionId) return undefined

  const snapshot = row.designation_label_snapshot?.trim() ?? ""
  if (snapshot) return snapshot
  if (optionId === "split") return "No preference"
  return optionId
}

export function toDonationReceiptPdfInput(
  row: DonationReceiptRow,
  overrides: DonationReceiptOverrides,
): GenerateDonationPdfInput {
  const donorEmail = (overrides.donorEmail ?? row.donor_email)?.trim() || undefined
  const donorName =
    row.donor_name?.trim() ||
    overrides.donorName?.trim() ||
    donorEmail?.split("@")[0] ||
    "there"
  const artistDisplayName =
    row.recipient_name?.trim() || (row.recipient_user_id ? "the artist" : "EAR")
  const donorMessage = (overrides.donorMessage ?? row.message)?.trim() || undefined

  return {
    donorName,
    donorEmail,
    artistDisplayName,
    amountCents: overrides.amountCents ?? row.amount,
    dateLabel: overrides.dateLabel,
    donationId: row.id,
    donorMessage,
    designationLabel: resolveDonationReceiptDesignation(row),
    feeCoverage: row.recipient_user_id
      ? {
          coverFiscalFee: Boolean(row.cover_fiscal_fee),
          coverCardFee: Boolean(row.cover_card_fee),
        }
      : {
          coverCardFee: Boolean(row.cover_card_fee),
        },
  }
}

export async function renderDonationReceiptPdf(
  input: GenerateDonationPdfInput,
): Promise<Uint8Array> {
  try {
    return await generateDonationPdf(input)
  } catch (error) {
    console.error(
      "Donation PDF failed (Noto + Helvetica with sanitized input); using minimal fallback",
      { error, donationId: input.donationId },
    )
    return generateMinimalDonationPdfFallback({
      amountCents: input.amountCents,
      dateLabel: input.dateLabel,
      donationId: input.donationId,
      designationLabel: input.designationLabel,
    })
  }
}
