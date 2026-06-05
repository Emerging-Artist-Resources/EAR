/** Matches DB enum `donation_stripe_account`. */
export type DonationStripeAccount = "ear" | "sponsor"

/** Generic org donations have no recipient; artist-tagged donations use the sponsor Stripe account. */
export function isEarDonation(recipientUserId: string | null | undefined): boolean {
  return recipientUserId == null
}

export function donationStripeAccountForRecipient(
  recipientUserId: string | null | undefined
): DonationStripeAccount {
  return isEarDonation(recipientUserId) ? "ear" : "sponsor"
}
