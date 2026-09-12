import {
  parseAnnouncementHeading,
  parseAnnouncementInline,
  parseAnnouncementMarkdown,
  sanitizeAnnouncementHref,
} from "./parse-announcement-markdown"

describe("sanitizeAnnouncementHref", () => {
  it("keeps http(s) and in-app paths", () => {
    expect(sanitizeAnnouncementHref("https://dancefilms.org/")).toBe("https://dancefilms.org/")
    expect(sanitizeAnnouncementHref("/calendar")).toBe("/calendar")
  })

  it("keeps mailto links", () => {
    expect(sanitizeAnnouncementHref("mailto:hello@example.com")).toBe("mailto:hello@example.com")
  })

  it("rejects javascript and other unsafe schemes", () => {
    expect(sanitizeAnnouncementHref("javascript:alert(1)")).toBeNull()
    expect(sanitizeAnnouncementHref("data:text/html,hi")).toBeNull()
  })
})

describe("parseAnnouncementInline", () => {
  it("parses bold, italic, and mixed marks", () => {
    expect(parseAnnouncementInline("**Dance on Camera** and *film*")).toEqual([
      { type: "strong", children: [{ type: "text", value: "Dance on Camera" }] },
      { type: "text", value: " and " },
      { type: "em", children: [{ type: "text", value: "film" }] },
    ])
  })

  it("parses markdown links and auto-links bare URLs", () => {
    const nodes = parseAnnouncementInline(
      "See [Dance on Camera](https://www.dancefilms.org/) or dance.org/apply"
    )
    expect(nodes[1]).toEqual({
      type: "link",
      href: "https://www.dancefilms.org/",
      children: [{ type: "text", value: "Dance on Camera" }],
    })
    expect(nodes.some((node) => node.type === "link" && node.href === "https://dance.org/apply")).toBe(
      true
    )
  })

  it("leaves unsafe markdown links as text", () => {
    expect(parseAnnouncementInline("[x](javascript:alert(1))")).toEqual([
      { type: "text", value: "[x](javascript:alert(1))" },
    ])
  })
})

describe("parseAnnouncementMarkdown", () => {
  it("keeps plain paragraphs and line breaks", () => {
    expect(parseAnnouncementMarkdown("Hello\nthere")).toEqual([
      {
        type: "paragraph",
        lines: [[{ type: "text", value: "Hello" }], [{ type: "text", value: "there" }]],
      },
    ])
  })

  it("parses bullet and numbered lists", () => {
    const blocks = parseAnnouncementMarkdown(
      "Who can apply?\n\n- First five years\n- Exploring dance film\n\n1. Submit\n2. Wait"
    )
    expect(blocks[0]).toMatchObject({ type: "paragraph" })
    expect(blocks[1]).toEqual({
      type: "ul",
      items: [
        [{ type: "text", value: "First five years" }],
        [{ type: "text", value: "Exploring dance film" }],
      ],
    })
    expect(blocks[2]).toEqual({
      type: "ol",
      items: [[{ type: "text", value: "Submit" }], [{ type: "text", value: "Wait" }]],
    })
  })

  it("does not treat *italic* as a list item", () => {
    expect(parseAnnouncementMarkdown("*first film*")).toEqual([
      {
        type: "paragraph",
        lines: [[{ type: "em", children: [{ type: "text", value: "first film" }] }]],
      },
    ])
  })

  it("parses ATX headings and inline marks inside them", () => {
    expect(parseAnnouncementHeading("# Workshop details")).toEqual({
      level: 1,
      text: "Workshop details",
    })
    expect(parseAnnouncementMarkdown("# Who can apply?\n## Dates\n### **Week one**\n#### Notes ##")).toEqual([
      { type: "heading", level: 1, children: [{ type: "text", value: "Who can apply?" }] },
      { type: "heading", level: 2, children: [{ type: "text", value: "Dates" }] },
      {
        type: "heading",
        level: 3,
        children: [{ type: "strong", children: [{ type: "text", value: "Week one" }] }],
      },
      { type: "heading", level: 4, children: [{ type: "text", value: "Notes" }] },
    ])
  })

  it("does not treat hashtags or deeper hashes as headings", () => {
    expect(parseAnnouncementMarkdown("#not-a-heading\n##### Too deep")).toEqual([
      {
        type: "paragraph",
        lines: [
          [{ type: "text", value: "#not-a-heading" }],
          [{ type: "text", value: "##### Too deep" }],
        ],
      },
    ])
  })

  it("stops a paragraph when a heading starts", () => {
    expect(parseAnnouncementMarkdown("Intro line\n## Next")).toEqual([
      { type: "paragraph", lines: [[{ type: "text", value: "Intro line" }]] },
      { type: "heading", level: 2, children: [{ type: "text", value: "Next" }] },
    ])
  })

  it("does not insert a spacer for a single blank line", () => {
    expect(parseAnnouncementMarkdown("Hello\n\nthere")).toEqual([
      { type: "paragraph", lines: [[{ type: "text", value: "Hello" }]] },
      { type: "paragraph", lines: [[{ type: "text", value: "there" }]] },
    ])
  })

  it("keeps extra blank lines as spacers", () => {
    expect(parseAnnouncementMarkdown("Hello\n\n\nthere")).toEqual([
      { type: "paragraph", lines: [[{ type: "text", value: "Hello" }]] },
      { type: "spacer", count: 1 },
      { type: "paragraph", lines: [[{ type: "text", value: "there" }]] },
    ])
    expect(parseAnnouncementMarkdown("Hello\n\n\n\nthere")).toEqual([
      { type: "paragraph", lines: [[{ type: "text", value: "Hello" }]] },
      { type: "spacer", count: 2 },
      { type: "paragraph", lines: [[{ type: "text", value: "there" }]] },
    ])
  })

  it("ignores leading and trailing blank lines", () => {
    expect(parseAnnouncementMarkdown("\n\nHello\n\n")).toEqual([
      { type: "paragraph", lines: [[{ type: "text", value: "Hello" }]] },
    ])
  })
})
