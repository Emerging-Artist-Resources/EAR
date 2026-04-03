import type Stripe from "stripe"

export type DonationAmountRow = {
  donor_name: string | null
  donor_email: string | null
  message: string | null
  recipient_name: string | null
  amount: number
  payment_status: string
}

export function formatCurrencyFromCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function resolveRecipientEmail(
  session: Stripe.Checkout.Session | undefined,
  donation: DonationAmountRow,
): string {
  const fromSession =
    session?.customer_email?.trim() ||
    session?.customer_details?.email?.trim() ||
    ""
  if (fromSession) return fromSession
  return donation.donor_email?.trim() || ""
}

export function resolveAmountCents(
  session: Stripe.Checkout.Session | undefined,
  paymentIntent: Stripe.PaymentIntent | undefined,
  donation: DonationAmountRow,
): number {
  if (session?.amount_total != null) {
    return session.amount_total
  }
  if (paymentIntent?.amount_received != null) {
    return paymentIntent.amount_received
  }
  return donation.amount
}

export function resolveCreatedUnix(
  session: Stripe.Checkout.Session | undefined,
  paymentIntent: Stripe.PaymentIntent | undefined,
): number {
  if (session?.created != null) {
    return session.created
  }
  if (paymentIntent?.created != null) {
    return paymentIntent.created
  }
  return Math.floor(Date.now() / 1000)
}

export function formatReceiptDate(createdUnix: number): string {
  return new Date(createdUnix * 1000).toLocaleDateString("en-US", { dateStyle: "long" })
}
