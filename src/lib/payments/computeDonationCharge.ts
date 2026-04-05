/**
 * Gross-up math for fiscally sponsored artist donations (Stripe + fiscal sponsorship).
 *
 * All values are integer cents. Each branch applies Math.round once at the end.
 * Stripe Checkout may still differ by ±1¢ from these values; persist session.amount_total
 * on payment and treat that as authoritative — do not double-round against Stripe totals.
 */
export function computeGrossChargeCents(
  baseGiftCents: number,
  coverFiscal: boolean,
  coverCard: boolean
): number {
  const f = 0.055
  const c = 0.029
  const k = 30

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
