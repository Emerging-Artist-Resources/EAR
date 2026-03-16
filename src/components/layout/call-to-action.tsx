import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { H1 } from "@/components/ui/typography"

export interface CallToActionProps {
  onSubmitPerformance?: () => void
  submitHref?: string
}
//text-[#457b9d]
export const CallToAction: React.FC<CallToActionProps> = ({ onSubmitPerformance, submitHref }) => {
  return (
    <div className="flex items-center justify-between gap-4 md:flex-row flex-col mb-4">
      <H1 className="text-[#457a00]">Artist Calendar</H1>
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
