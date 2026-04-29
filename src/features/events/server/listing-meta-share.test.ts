import {
  buildPersistableListingMeta,
  finalizeListingMetaAfterClientPatch,
  mergeListingMetaFromClient,
  mergeListingMetaWithServerShareSentAt,
} from "./listing-meta-share"

describe("mergeListingMetaFromClient", () => {
  it("ignores client sent_at and preserves server sent_at", () => {
    const out = mergeListingMetaFromClient(
      { share: { recipient_emails: ["a@a.com"], sent_at: "2020-01-01" } },
      { share: { recipient_emails: ["b@b.com"], sent_at: "hacker" } as Record<string, unknown> }
    )
    expect(out.share).toEqual({
      recipient_emails: ["b@b.com"],
      sent_at: "2020-01-01",
    })
  })

  it("merges non-share keys", () => {
    const out = mergeListingMetaFromClient({ foo: 1 }, { bar: 2 })
    expect(out).toEqual({ foo: 1, bar: 2 })
  })
})

describe("buildPersistableListingMeta", () => {
  it("normalizes and strips empty share", () => {
    const out = buildPersistableListingMeta(
      { share: { recipient_emails: [" ME@me.com ", "x@y.com"] } },
      "me@me.com"
    )
    expect(out.share).toEqual({ recipient_emails: ["x@y.com"] })
  })

  it("removes share when no recipients after normalize", () => {
    const out = buildPersistableListingMeta(
      { share: { recipient_emails: ["only@submitter.com"] } },
      "only@submitter.com"
    )
    expect(out.share).toBeUndefined()
  })
})

describe("finalizeListingMetaAfterClientPatch", () => {
  it("returns null for undefined patch", () => {
    expect(finalizeListingMetaAfterClientPatch({}, undefined, "a@a.com")).toBeNull()
  })

  it("keeps sent_at-only share when clearing recipients", () => {
    const out = finalizeListingMetaAfterClientPatch(
      { share: { recipient_emails: ["x@y.com"], sent_at: "t" } },
      { share: { recipient_emails: [] } },
      "sub@sub.com"
    )
    expect(out?.share).toEqual({ sent_at: "t" })
  })
})

describe("mergeListingMetaWithServerShareSentAt", () => {
  it("sets sent_at and keeps recipients", () => {
    const out = mergeListingMetaWithServerShareSentAt(
      { share: { recipient_emails: ["a@a.com"] } },
      "2026-01-01"
    )
    expect(out.share).toEqual({ recipient_emails: ["a@a.com"], sent_at: "2026-01-01" })
  })
})
