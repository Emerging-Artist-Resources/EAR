import { linkifyText } from "./linkify-text"

function segmentLabels(segments: ReturnType<typeof linkifyText>) {
  return segments.map((s) => (s.type === "text" ? s.value : `${s.type}:${s.label}->${s.href}`))
}

describe("linkifyText", () => {
  it("returns plain text when no links are present", () => {
    expect(linkifyText("Hello world")).toEqual([{ type: "text", value: "Hello world" }])
  })

  it("linkifies https URLs", () => {
    const segments = linkifyText("Apply at https://example.com/apply today")
    expect(segments).toEqual([
      { type: "text", value: "Apply at " },
      { type: "link", href: "https://example.com/apply", label: "https://example.com/apply" },
      { type: "text", value: " today" },
    ])
  })

  it("linkifies bare domains with https normalization", () => {
    const segments = linkifyText("Register at dance.org/tickets")
    expect(segments[1]).toEqual({
      type: "link",
      href: "https://dance.org/tickets",
      label: "dance.org/tickets",
    })
  })

  it("linkifies www URLs", () => {
    const segments = linkifyText("See www.example.org for details")
    expect(segments[1]).toEqual({
      type: "link",
      href: "https://www.example.org",
      label: "www.example.org",
    })
  })

  it("leaves trailing punctuation as plain text after the link", () => {
    const segments = linkifyText("Visit example.org.")
    expect(segments).toEqual([
      { type: "text", value: "Visit " },
      { type: "link", href: "https://example.org", label: "example.org" },
      { type: "text", value: "." },
    ])
  })

  it("linkifies emails with mailto", () => {
    const segments = linkifyText("Email us at apply@studio.org for info")
    expect(segments).toEqual([
      { type: "text", value: "Email us at " },
      { type: "email", href: "mailto:apply@studio.org", label: "apply@studio.org" },
      { type: "text", value: " for info" },
    ])
  })

  it("does not linkify invalid hostnames", () => {
    expect(linkifyText("Not a link: dance")).toEqual([{ type: "text", value: "Not a link: dance" }])
  })

  it("does not linkify javascript URLs", () => {
    expect(segmentLabels(linkifyText("Bad javascript:alert(1)"))).toEqual([
      "Bad javascript:alert(1)",
    ])
  })

  it("preserves line breaks in surrounding text", () => {
    const segments = linkifyText("Line one\nApply: example.org\nLine three")
    expect(segments[0]).toEqual({ type: "text", value: "Line one\nApply: " })
    expect(segments[2]).toEqual({ type: "text", value: "\nLine three" })
  })
})
