import { DashboardHomePage } from "@/components/profile/dashboard/DashboardHomePage"
import { getAuthenticatedUser } from "@/lib/auth/helpers"
import { getResolvedDashboardAnnouncements } from "@/features/announcements/server/service"

type PageProps = {
  searchParams: Promise<{ announcement?: string | string[] }>
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function ProfileDashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const auth = await getAuthenticatedUser()
  const dashboardAnnouncements = auth
    ? await getResolvedDashboardAnnouncements(auth.user.id)
    : []

  return (
    <DashboardHomePage
      dashboardAnnouncements={dashboardAnnouncements}
      highlightId={first(sp.announcement)}
    />
  )
}
