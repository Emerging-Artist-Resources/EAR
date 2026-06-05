import { isEarDonation } from "@/lib/payments/donationStripeAccount"

type DonationRow = {
  base_gift_cents: number | null
  amount: number
  recipient_user_id: string | null
}

function giftCents(row: DonationRow): number {
  if (row.base_gift_cents != null && row.base_gift_cents > 0) {
    return row.base_gift_cents
  }
  return row.amount
}

function sumEarGiftCents(rows: DonationRow[]): number {
  return rows
    .filter((row) => isEarDonation(row.recipient_user_id))
    .reduce((sum, row) => sum + giftCents(row), 0)
}

function sumArtistGiftCents(rows: DonationRow[]): number {
  return rows
    .filter((row) => !isEarDonation(row.recipient_user_id))
    .reduce((sum, row) => sum + giftCents(row), 0)
}

describe("donation analytics gift splits", () => {
  const rows: DonationRow[] = [
    { base_gift_cents: 5000, amount: 5200, recipient_user_id: null },
    { base_gift_cents: 2500, amount: 2600, recipient_user_id: "artist-uuid" },
    { base_gift_cents: null, amount: 1000, recipient_user_id: null },
  ]

  it("sums EAR gifts by null recipient_user_id", () => {
    expect(sumEarGiftCents(rows)).toBe(6000)
  })

  it("sums artist gifts by non-null recipient_user_id", () => {
    expect(sumArtistGiftCents(rows)).toBe(2500)
  })

  it("EAR + artist equals total gift cents", () => {
    const total = rows.reduce((sum, row) => sum + giftCents(row), 0)
    expect(sumEarGiftCents(rows) + sumArtistGiftCents(rows)).toBe(total)
  })
})
