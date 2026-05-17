"use client"

import type { FormEvent, ReactNode } from "react"
import Link from "next/link"
import { PageNumbers } from "@/components/forms/blocks/PageNumbers"
import { FormStepErrorSummary } from "@/components/forms/blocks/FormStepErrorSummary"
import { inquiryLayoutSpacing } from "@/components/forms/service-inquiry/inquiry-layout-spacing"
import { Button } from "@/components/ui/button"
import { H1 } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

type ServiceInquiryLayoutProps = {
  backHref: string
  backLabel: string
  title?: string
  submitted: boolean
  currentPage: number
  totalPages: number
  errorBannerMessage?: string | null
  submitting?: boolean
  isLastPage: boolean
  onBack?: () => void
  onContinue?: () => void
  onSubmit?: () => void
  success: ReactNode
  children: ReactNode
  /** Shown above the card when form is not submitted (e.g. loading / error) */
  statusSlot?: ReactNode
}

export function ServiceInquiryLayout({
  backHref,
  backLabel,
  title = "Inquiry form",
  submitted,
  currentPage,
  totalPages,
  errorBannerMessage,
  submitting = false,
  isLastPage,
  onBack,
  onContinue,
  onSubmit,
  success,
  children,
  statusSlot,
}: ServiceInquiryLayoutProps) {
  const showStepIndicator = !submitted && totalPages > 1
  const showWizardBack = !submitted && currentPage > 1
  const footerJustify =
    showWizardBack ? inquiryLayoutSpacing.footerWithBack : inquiryLayoutSpacing.footerSinglePrimary

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLastPage) {
      void onSubmit?.()
    } else {
      void onContinue?.()
    }
  }

  return (
    <>
      {!submitted ? (
        <div className={inquiryLayoutSpacing.navStrip}>
          <div className={inquiryLayoutSpacing.navStripInner}>
            <Link
              href={backHref}
              className="text-primary-600 hover:text-primary-700 inline-block text-sm font-medium underline"
            >
              {backLabel}
            </Link>
          </div>
        </div>
      ) : null}

      <div className={inquiryLayoutSpacing.page}>
        {!submitted ? (
          <H1
            className={cn(
              inquiryLayoutSpacing.title,
              "text-ear-black text-3xl font-bold tracking-tight",
            )}
          >
            {title}
          </H1>
        ) : null}

        {statusSlot}

        {submitted ? (
          <div className={inquiryLayoutSpacing.card}>{success}</div>
        ) : (
          <form onSubmit={handleFormSubmit} noValidate>
            {showStepIndicator ? (
              <div className={inquiryLayoutSpacing.stepIndicator}>
                <PageNumbers current={currentPage} total={totalPages} />
              </div>
            ) : null}

            <div className={inquiryLayoutSpacing.card}>
              <FormStepErrorSummary message={errorBannerMessage} className="mb-6" />
              {children}
            </div>

            <div className={cn(inquiryLayoutSpacing.footer, footerJustify)}>
              {showWizardBack ? (
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
              ) : null}
              {isLastPage ? (
                <Button type="submit" variant="default" disabled={submitting}>
                  {submitting ? "Sending…" : "Submit inquiry"}
                </Button>
              ) : (
                <Button type="submit" variant="default">
                  Continue
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </>
  )
}
