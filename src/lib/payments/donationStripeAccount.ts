/** Matches DB enum `donation_stripe_account`. */
export type DonationStripeAccount = "ear" | "sponsor"

export function donationStripeAccountForRecipient(
  recipientUserId: string | null | undefined
): DonationStripeAccount {
  return recipientUserId ? "sponsor" : "ear"
}
