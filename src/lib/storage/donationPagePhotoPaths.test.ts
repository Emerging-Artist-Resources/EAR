import {
  assertDonationPageImageStoragePathOwnedByUser,
  createDonationPageImageStoragePath,
  isDonationPageImageStoragePathOwnedByUser,
} from "./donationPagePhotoPaths"

const USER_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
const OTHER_USER_ID = "00000000-0000-0000-0000-000000000000"

describe("createDonationPageImageStoragePath", () => {
  it("returns a versioned path under the user folder", () => {
    const path = createDonationPageImageStoragePath(USER_ID)

    expect(path).toMatch(
      new RegExp(
        `^profiles/${USER_ID}/donation-hero-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\.jpg$`,
      ),
    )
  })

  it("returns a different path on each call", () => {
    expect(createDonationPageImageStoragePath(USER_ID)).not.toBe(
      createDonationPageImageStoragePath(USER_ID),
    )
  })
})

describe("isDonationPageImageStoragePathOwnedByUser", () => {
  it("accepts a versioned path for the user", () => {
    const path = createDonationPageImageStoragePath(USER_ID)
    expect(isDonationPageImageStoragePathOwnedByUser(path, USER_ID)).toBe(true)
  })

  it("accepts the legacy fixed path for the user", () => {
    expect(
      isDonationPageImageStoragePathOwnedByUser(
        `profiles/${USER_ID}/donation-hero.jpg`,
        USER_ID,
      ),
    ).toBe(true)
  })

  it("rejects another user's path", () => {
    expect(
      isDonationPageImageStoragePathOwnedByUser(
        `profiles/${OTHER_USER_ID}/donation-hero.jpg`,
        USER_ID,
      ),
    ).toBe(false)
  })

  it("rejects path traversal and unexpected filenames", () => {
    expect(
      isDonationPageImageStoragePathOwnedByUser(
        `profiles/${USER_ID}/../${OTHER_USER_ID}/donation-hero.jpg`,
        USER_ID,
      ),
    ).toBe(false)
    expect(
      isDonationPageImageStoragePathOwnedByUser(
        `profiles/${USER_ID}/other.jpg`,
        USER_ID,
      ),
    ).toBe(false)
  })
})

describe("assertDonationPageImageStoragePathOwnedByUser", () => {
  it("throws for paths not owned by the user", () => {
    expect(() =>
      assertDonationPageImageStoragePathOwnedByUser(
        `profiles/${OTHER_USER_ID}/donation-hero.jpg`,
        USER_ID,
      ),
    ).toThrow("Invalid donation page image path")
  })

  it("does not throw for a valid owned path", () => {
    expect(() =>
      assertDonationPageImageStoragePathOwnedByUser(
        createDonationPageImageStoragePath(USER_ID),
        USER_ID,
      ),
    ).not.toThrow()
  })
})
