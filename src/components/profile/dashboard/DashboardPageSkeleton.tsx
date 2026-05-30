import { Card } from "@/components/ui/card"
import { dashboardPageShellClass } from "./DashboardPageLayout"

function DashboardHeaderSkeleton() {
  return (
    <Card className="flex w-full flex-col gap-4 bg-ear-black p-6">
      <div className="h-8 w-64 rounded bg-gray-700" />
      <div className="h-4 w-full max-w-lg rounded bg-gray-700" />
      <div className="h-10 w-44 rounded bg-gray-700" />
    </Card>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className={`${dashboardPageShellClass} animate-pulse`}>
      <DashboardHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-32 p-6">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-16 rounded bg-gray-200" />
            <div className="mt-4 h-3 w-full rounded bg-gray-200" />
          </Card>
        ))}
      </div>
      <Card className="h-48 p-6">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
        </div>
      </Card>
    </div>
  )
}

export function ListingsPageSkeleton() {
  return (
    <div className={`${dashboardPageShellClass} animate-pulse`}>
      <DashboardHeaderSkeleton />
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="h-4 w-48 rounded bg-gray-200" />
            </div>
            <div className="h-6 w-20 rounded bg-gray-200" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export function SavedPageSkeleton() {
  return (
    <div className={`${dashboardPageShellClass} animate-pulse`}>
      <DashboardHeaderSkeleton />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-24 rounded bg-gray-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-40">
            <span className="sr-only">Loading</span>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AccountPageSkeleton() {
  return (
    <div className={`${dashboardPageShellClass} animate-pulse`}>
      <DashboardHeaderSkeleton />
      <Card className="space-y-4 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>
        ))}
      </Card>
    </div>
  )
}

export function SettingsPageSkeleton() {
  return (
    <div className={`${dashboardPageShellClass} animate-pulse`}>
      <DashboardHeaderSkeleton />
      <Card className="space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 w-full rounded bg-gray-200" />
        ))}
      </Card>
    </div>
  )
}
