import {
  resolveDonationReceiptDesignation,
  toDonationReceiptPdfInput,
  type DonationReceiptRow,
} from "./donation-receipt"

function receiptRow(overrides: Partial<DonationReceiptRow> = {}): DonationReceiptRow {
  return {
    id: "donation-1",
    created_at: "2026-06-01T12:00:00.000Z",
    donor_name: "Jane Donor",
    donor_email: "jane@example.com",
    recipient_name: "Alex Artist",
    recipient_user_id: "artist-1",
    amount: 5250,
    message: "Keep creating!",
    cover_card_fee: true,
    cover_fiscal_fee: true,
    designation_option_id: "general",
    designation_label_snapshot: "General support",
    ...overrides,
  }
}

describe("resolveDonationReceiptDesignation", () => {
  it("prefers the snapshot label when a designation was chosen", () => {
    expect(resolveDonationReceiptDesignation(receiptRow())).toBe("General support")
  })

  it("uses No preference for the split option when the snapshot is missing", () => {
    expect(
      resolveDonationReceiptDesignation(
        receiptRow({ designation_option_id: "split", designation_label_snapshot: null }),
      ),
    ).toBe("No preference")
  })

  it("omits designation when the donor did not choose an option", () => {
    expect(
      resolveDonationReceiptDesignation(
        receiptRow({ designation_option_id: null, designation_label_snapshot: "General support" }),
      ),
    ).toBeUndefined()
  })
})

describe("toDonationReceiptPdfInput", () => {
  it("maps an artist donation the same way the emailed receipt does", () => {
    expect(
      toDonationReceiptPdfInput(receiptRow(), { dateLabel: "June 1, 2026" }),
    ).toEqual({
      donorName: "Jane Donor",
      donorEmail: "jane@example.com",
      artistDisplayName: "Alex Artist",
      amountCents: 5250,
      dateLabel: "June 1, 2026",
      donationId: "donation-1",
      donorMessage: "Keep creating!",
      designationLabel: "General support",
      feeCoverage: { coverFiscalFee: true, coverCardFee: true },
    })
  })

  it("omits the fiscal fee row for EAR donations with no recipient", () => {
    const input = toDonationReceiptPdfInput(
      receiptRow({
        recipient_user_id: null,
        recipient_name: null,
        cover_fiscal_fee: null,
      }),
      { dateLabel: "June 1, 2026" },
    )
    expect(input.artistDisplayName).toBe("EAR")
    expect(input.feeCoverage).toEqual({ coverCardFee: true })
  })

  it("falls back to the email local-part, then there, for a missing donor name", () => {
    expect(
      toDonationReceiptPdfInput(
        receiptRow({ donor_name: null }),
        { dateLabel: "June 1, 2026" },
      ).donorName,
    ).toBe("jane")

    expect(
      toDonationReceiptPdfInput(
        receiptRow({ donor_name: null, donor_email: null }),
        { dateLabel: "June 1, 2026" },
      ).donorName,
    ).toBe("there")
  })

  it("lets Stripe-resolved amount and email fill gaps without replacing the row name", () => {
    const input = toDonationReceiptPdfInput(receiptRow(), {
      dateLabel: "June 1, 2026",
      donorName: "Stripe Name",
      donorEmail: "stripe@example.com",
      amountCents: 5300,
    })
    expect(input.donorName).toBe("Jane Donor")
    expect(input.donorEmail).toBe("stripe@example.com")
    expect(input.amountCents).toBe(5300)
  })
})
