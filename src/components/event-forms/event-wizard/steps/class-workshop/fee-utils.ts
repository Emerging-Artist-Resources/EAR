export const ESTABLISHED_BASE_FEE = 50
export const EMERGING_BASE_FEE = 35
export const EXTRA_DATE_FEE = 10

export interface FeeCalculation {
  baseFee: number
  extraFees: number
  totalFee: number
  occurrenceCount: number
}

export function calculateClassFees(
  isWorkshop: boolean,
  occurrenceCount: number,
  artistType: "ESTABLISHED" | "EMERGING" | undefined
): FeeCalculation | null {
  if (!artistType) return null

  const baseFee = artistType === "ESTABLISHED" ? ESTABLISHED_BASE_FEE : EMERGING_BASE_FEE
  const extraFees = isWorkshop || occurrenceCount <= 1 ? 0 : (occurrenceCount - 1) * EXTRA_DATE_FEE
  const totalFee = baseFee + extraFees

  return {
    baseFee,
    extraFees,
    totalFee,
    occurrenceCount,
  }
}

export function formatFeeBreakdown(fee: FeeCalculation): string {
  if (fee.extraFees === 0) return ""
  const dateText = fee.occurrenceCount - 1 === 1 ? "date" : "dates"
  return ` = $${fee.baseFee} base + $${fee.extraFees} for ${fee.occurrenceCount - 1} additional ${dateText}`
}

