import { render, screen, act } from "@testing-library/react"
import type { ReactNode } from "react"
import type { Announcement } from "@/features/announcements/types"
import { AnnouncementsList } from "./AnnouncementsList"
import { TIMED_HIGHLIGHT_MS } from "@/hooks/use-timed-highlight"
import type { ReactNode } from "react"
import type { Announcement } from "@/features/announcements/types"
import { AnnouncementsList } from "./AnnouncementsList"

jest.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isAuthed: true, isLoading: false }),
}))

jest.mock("@/components/newsletter/NewsletterSignupTrigger", () => ({
  NewsletterSignupTrigger: ({
    children,
  }: {
    children: (props: { onClick: () => void }) => ReactNode
  }) => children({ onClick: () => undefined }),
}))

function announcement(partial: Partial<Announcement> & Pick<Announcement, "id" | "title">): Announcement {
  return {
    content: "Body copy for this announcement.",
    publishedAt: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-09-01T00:00:00.000Z",
    heroImageUrl: null,
    cta: null,
    secondaryCta: null,
    ...partial,
  }
}

describe("AnnouncementsList feed layout", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
  })

  it("shows an empty bulletin with calendar and email next steps", () => {
    render(
      <AnnouncementsList variant="feed" showHeader={false} announcements={[]} />
    )

    expect(screen.getByRole("heading", { name: /nothing posted right now/i })).toBeInTheDocument()
    expect(
      screen.getByText(/when EAR has a workshop, program, or resource to share/i)
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /browse the calendar/i })).toHaveAttribute(
      "href",
      "/calendar"
    )
    expect(screen.getByRole("button", { name: /get updates by email/i })).toBeInTheDocument()
    expect(screen.queryByText(/Earlier updates/i)).not.toBeInTheDocument()
  })

  it("renders a single announcement as the lead without earlier updates", () => {
    render(
      <AnnouncementsList
        variant="feed"
        showHeader={false}
        announcements={[announcement({ id: "lead", title: "Only story" })]}
      />
    )

    expect(screen.getByRole("heading", { name: "Only story" })).toBeInTheDocument()
    expect(screen.queryByText(/Earlier updates/i)).not.toBeInTheDocument()
  })

  it("splits additional announcements under earlier updates", () => {
    render(
      <AnnouncementsList
        variant="feed"
        showHeader={false}
        announcements={[
          announcement({ id: "a", title: "Newest" }),
          announcement({ id: "b", title: "Older one" }),
          announcement({ id: "c", title: "Oldest" }),
        ]}
      />
    )

    expect(screen.getByRole("heading", { name: "Newest" })).toBeInTheDocument()
    expect(screen.getByText(/Earlier updates/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Older one" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Oldest" })).toBeInTheDocument()
  })

  it("marks a deep-linked earlier item as the highlighted card", () => {
    render(
      <AnnouncementsList
        variant="feed"
        showHeader={false}
        highlightId="b"
        announcements={[
          announcement({ id: "a", title: "Newest" }),
          announcement({ id: "b", title: "Older one" }),
        ]}
      />
    )

    const highlighted = document.getElementById("announcement-b")
    expect(highlighted).toBeTruthy()
    expect(highlighted?.className).toContain("ring-ear-baby-blue")
    expect(document.getElementById("announcement-a")?.className).not.toContain("ring-ear-baby-blue")
  })

  it("clears the deep-link ring after a few seconds", () => {
    jest.useFakeTimers()
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0)
      return 0
    })

    render(
      <AnnouncementsList
        variant="feed"
        showHeader={false}
        highlightId="b"
        announcements={[
          announcement({ id: "a", title: "Newest" }),
          announcement({ id: "b", title: "Older one" }),
        ]}
      />
    )

    expect(document.getElementById("announcement-b")?.className).toContain("ring-ear-baby-blue")

    act(() => {
      jest.advanceTimersByTime(TIMED_HIGHLIGHT_MS)
    })

    expect(document.getElementById("announcement-b")?.className).not.toContain("ring-ear-baby-blue")
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it("renders both announcement-page action buttons", () => {
    render(
      <AnnouncementsList
        variant="feed"
        showHeader={false}
        announcements={[
          announcement({
            id: "lead",
            title: "Workshop",
            cta: {
              kind: "authenticated_link",
              label: "Get your code",
              href: "/profile?announcement=lead",
            },
            secondaryCta: {
              kind: "link",
              label: "Apply",
              href: "https://example.com/apply",
            },
          }),
        ]}
      />
    )

    expect(screen.getByRole("link", { name: "Get your code" })).toHaveAttribute(
      "href",
      "/profile?announcement=lead"
    )
    expect(screen.getByRole("link", { name: "Apply" })).toHaveAttribute(
      "href",
      "https://example.com/apply"
    )
  })
})
