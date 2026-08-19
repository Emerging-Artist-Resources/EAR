/**
 * Gross-up math for fiscally sponsored artist donations (Stripe + fiscal sponsorship).
 *
 * All values are integer cents. Each branch applies Math.round once at the end.
 * Stripe Checkout may still differ by ±1¢ from these values; persist session.amount_total
 * on payment and treat that as authoritative — do not double-round against Stripe totals.
 */

/** EAR fiscal sponsorship administrative fee, applied to the gross charged amount. */
export const FISCAL_SPONSORSHIP_FEE_RATE = 0.055

/** Stripe US card percent (not inclusive of the fixed per-charge amount). */
export const STRIPE_CARD_PERCENT = 0.029

/** Stripe US card fixed fee, in cents. */
export const STRIPE_CARD_FIXED_CENTS = 30

export type DonationFeeBreakdown = {
  stripeFeeCents: number
  fiscalFeeCents: number
  netCents: number
}

/**
 * Estimated Stripe fee, 5.5% fiscal fee, and net from a gross charged amount.
 *
 * Uses the same rates as {@link computeGrossChargeCents}. These are estimates
 * (Stripe Balance Transactions are not consulted) and may differ by ±1¢.
 */
export function computeDonationFeeBreakdown(grossCents: number): DonationFeeBreakdown {
  const gross = Number.isFinite(grossCents) ? Math.max(0, Math.round(grossCents)) : 0
  if (gross === 0) {
    return { stripeFeeCents: 0, fiscalFeeCents: 0, netCents: 0 }
  }

  const fiscalFeeCents = Math.round(gross * FISCAL_SPONSORSHIP_FEE_RATE)
  const stripeFeeCents = Math.round(gross * STRIPE_CARD_PERCENT) + STRIPE_CARD_FIXED_CENTS
  const netCents = gross - fiscalFeeCents - stripeFeeCents

  return { stripeFeeCents, fiscalFeeCents, netCents }
}

export function computeGrossChargeCents(
  baseGiftCents: number,
  coverFiscal: boolean,
  coverCard: boolean
): number {
  const f = FISCAL_SPONSORSHIP_FEE_RATE
  const c = STRIPE_CARD_PERCENT
  const k = STRIPE_CARD_FIXED_CENTS

  if (coverFiscal && coverCard) {
    return Math.round((baseGiftCents + k) / (1 - f - c))
  }
  if (coverCard) {
    return Math.round((baseGiftCents + k) / (1 - c))
  }
  if (coverFiscal) {
    return Math.round(baseGiftCents / (1 - f))
  }
  return baseGiftCents
}
