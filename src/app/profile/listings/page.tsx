import { Suspense } from "react"
import { ListingsPage } from "@/components/profile/dashboard/ListingsPage"
import { ListingsPageSkeleton } from "@/components/profile/dashboard/DashboardPageSkeleton"

export default function ProfileListingsRoute() {
  return (
    <Suspense fallback={<ListingsPageSkeleton />}>
      <ListingsPage />
    </Suspense>
  )
}
