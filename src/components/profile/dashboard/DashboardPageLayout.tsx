import type { ReactNode } from "react"
import { DashboardPageHeader } from "./DashboardPageHeader"

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
    <div className="mx-auto w-full max-w-7xl space-y-8">
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
