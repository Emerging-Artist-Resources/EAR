import { PUBLIC_SITEMAP_ENTRIES, ROBOTS_DISALLOW_PREFIXES } from "@/lib/seo/public-routes"

const ROBOTS_DISALLOW_EXACT = ROBOTS_DISALLOW_PREFIXES.filter((path) => !path.endsWith("/"))
const ROBOTS_DISALLOW_PREFIX = ROBOTS_DISALLOW_PREFIXES.filter((path) => path.endsWith("/"))

describe("public SEO routes", () => {
  it("includes only unique sitemap paths", () => {
    const paths = PUBLIC_SITEMAP_ENTRIES.map((entry) => entry.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it("uses valid priority values between 0 and 1", () => {
    for (const entry of PUBLIC_SITEMAP_ENTRIES) {
      expect(entry.priority).toBeGreaterThan(0)
      expect(entry.priority).toBeLessThanOrEqual(1)
    }
  })

  it("does not list disallowed paths in the sitemap", () => {
    for (const entry of PUBLIC_SITEMAP_ENTRIES) {
      expect(ROBOTS_DISALLOW_EXACT).not.toContain(entry.path)

      for (const prefix of ROBOTS_DISALLOW_PREFIX) {
        expect(entry.path.startsWith(prefix)).toBe(false)
      }
    }
  })
})
