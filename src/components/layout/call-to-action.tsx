import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { H1 } from "@/components/ui/typography"

export interface CallToActionProps {
  onSubmitPerformance?: () => void
  submitHref?: string
}

export const CallToAction: React.FC<CallToActionProps> = ({ onSubmitPerformance, submitHref }) => {
  return (
    <div className="flex items-center justify-between gap-4 md:flex-row flex-col mb-4">
      <H1 className="text-primary">Artist Calendar</H1>
      {submitHref ? (
        <Link href={submitHref}>
          <Button>Submit Listing</Button>
        </Link>
      ) : (
        <Button onClick={onSubmitPerformance}>
          Submit Listing
        </Button>
      )}
    </div>
  );
};
