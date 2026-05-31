import type { ReactNode } from "react"
import { DashboardPageHeader } from "./DashboardPageHeader"

/** Shared width, vertical rhythm, and footer clearance for dashboard pages + loaders */
export const dashboardPageShellClass =
  "mx-auto w-full max-w-7xl space-y-8 mb-10 md:mb-16 lg:mb-20"

interface DashboardPageLayoutProps {
  children: ReactNode
  title?: string
  description?: ReactNode
  actions?: ReactNode
  /** Replaces the default header (e.g. fully custom content). */
  header?: ReactNode
}

export function DashboardPageLayout({
  children,
  title,
  description,
  actions,
  header,
}: DashboardPageLayoutProps) {
  return (
    <div className={dashboardPageShellClass}>
      {header ?? (title ? (
        <DashboardPageHeader
          title={title}
          description={description}
          actions={actions}
        />
      ) : null)}
      {children}
    </div>
  )
}
