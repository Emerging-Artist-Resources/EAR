import {
  donationPageImageStoragePath,
  isDonationPageImagePathForUser,
} from "./donationPagePhotoPaths"

describe("donationPageImageStoragePath", () => {
  it("returns the fixed path for a user", () => {
    const userId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    expect(donationPageImageStoragePath(userId)).toBe(
      "profiles/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/donation-hero.jpg",
    )
  })
})

describe("isDonationPageImagePathForUser", () => {
  const userId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

  it("accepts the canonical path for the user", () => {
    expect(isDonationPageImagePathForUser(userId, donationPageImageStoragePath(userId))).toBe(true)
  })

  it("rejects another user's path", () => {
    expect(
      isDonationPageImagePathForUser(
        userId,
        "profiles/00000000-0000-0000-0000-000000000000/donation-hero.jpg",
      ),
    ).toBe(false)
  })
})
