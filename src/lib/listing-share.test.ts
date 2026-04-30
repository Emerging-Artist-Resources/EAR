import { MAX_SHARE_RECIPIENT_EMAILS, normalizeShareRecipientEmails } from "./listing-share"

describe("normalizeShareRecipientEmails", () => {
  it("trims, lowercases, dedupes, excludes submitter", () => {
    expect(
      normalizeShareRecipientEmails(
        ["  A@B.COM ", "a@b.com", "c@d.com"],
        "A@b.com"
      )
    ).toEqual(["c@d.com"])
  })

  it("drops invalid emails", () => {
    expect(normalizeShareRecipientEmails(["not-an-email", "ok@ok.com"], "x@x.com")).toEqual([
      "ok@ok.com",
    ])
  })

  it("caps at MAX_SHARE_RECIPIENT_EMAILS", () => {
    const many = Array.from({ length: 20 }, (_, i) => `u${i}@x.com`)
    const out = normalizeShareRecipientEmails(many, "submitter@x.com")
    expect(out.length).toBe(MAX_SHARE_RECIPIENT_EMAILS)
  })
})
