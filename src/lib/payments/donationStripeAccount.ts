/** Matches DB enum `donation_stripe_account`. */
export type DonationStripeAccount = "ear" | "sponsor"

export function donationStripeAccountForRecipient(
  _recipientUserId: string | null | undefined
): DonationStripeAccount {
  return "sponsor"
}
