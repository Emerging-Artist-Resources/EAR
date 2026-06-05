import {
  donationStripeAccountForRecipient,
  isEarDonation,
} from "./donationStripeAccount"

describe("isEarDonation", () => {
  it("treats null/undefined recipient as EAR", () => {
    expect(isEarDonation(null)).toBe(true)
    expect(isEarDonation(undefined)).toBe(true)
  })

  it("treats recipient id as artist/sponsor", () => {
    expect(isEarDonation("550e8400-e29b-41d4-a716-446655440000")).toBe(false)
  })
})

describe("donationStripeAccountForRecipient", () => {
  it("maps null recipient to ear Stripe account", () => {
    expect(donationStripeAccountForRecipient(null)).toBe("ear")
    expect(donationStripeAccountForRecipient(undefined)).toBe("ear")
  })

  it("maps artist recipient to sponsor Stripe account", () => {
    expect(donationStripeAccountForRecipient("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "sponsor"
    )
  })
})
