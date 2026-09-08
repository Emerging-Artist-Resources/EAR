import { listAnnouncements } from "@/features/announcements/server/service"
import { AnnouncementsList } from "@/components/announcements/AnnouncementsList"
import { H1, Text } from "@/components/ui/typography"
import { buildPageMetadata } from "@/lib/config/site-metadata"
import { ROUTES } from "@/lib/config/constants"

export const metadata = buildPageMetadata({
  title: "Announcements",
  description:
    "Upcoming events, workshops, programs, and resources from Emerging Artist Resources.",
  path: ROUTES.ANNOUNCEMENTS,
})

type PageProps = {
  searchParams: Promise<{ id?: string | string[] }>
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function AnnouncementsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const announcements = await listAnnouncements()
  const highlightId = first(sp.id)

  return (
    <main>
      <section className="bg-ear-off-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <H1 className="mb-3 text-ear-black">Announcements</H1>
          <Text className="mb-10 text-ear-black/80">
            Upcoming events, workshops, programs, and resources from EAR.
          </Text>
          <AnnouncementsList
            variant="feed"
            showHeader={false}
            announcements={announcements}
            highlightId={highlightId}
          />
        </div>
      </section>
    </main>
  )
}
