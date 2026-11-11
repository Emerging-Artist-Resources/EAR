"use client"

import type { UseFormReturn } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { SingleImageField } from "@/components/forms/blocks/SingleImageField"
import { fiscalSponsorshipDashboard } from "@/lib/content/fiscal-sponsorship-dashboard"
import {
  DONATION_PAGE_IMAGE_ASPECT,
  DONATION_PAGE_IMAGE_DEFAULT_FILL_COLOR,
  DONATION_PAGE_IMAGE_OUTPUT_WIDTH,
} from "@/lib/images/donation-page-image-frame"
import type { CustomizeDonationPageFormData } from "@/lib/validations/donation-page"

const copy = fiscalSponsorshipDashboard.customizeDonationPage.image

type DonationPageImageFieldProps = {
  form: UseFormReturn<CustomizeDonationPageFormData>
  existingImageUrl: string | null
  removeExisting: boolean
  onRemoveExistingChange: (remove: boolean) => void
}

export function DonationPageImageField({
  form,
  existingImageUrl,
  removeExisting,
  onRemoveExistingChange,
}: DonationPageImageFieldProps) {
  const pendingFiles = useWatch({
    control: form.control,
    name: "donation_page_image_files",
    defaultValue: [],
  })
  const files = Array.isArray(pendingFiles) ? pendingFiles : []
  const pendingFile = files[0] instanceof File ? files[0] : null

  return (
    <SingleImageField
      existingImageUrl={existingImageUrl}
      pendingFile={pendingFile}
      onPendingFileChange={(file) => {
        form.setValue("donation_page_image_files", file ? [file] : [], {
          shouldDirty: true,
          ...(file ? { shouldTouch: true, shouldValidate: true } : {}),
        })
      }}
      removeExisting={removeExisting}
      onRemoveExistingChange={onRemoveExistingChange}
      aspect={DONATION_PAGE_IMAGE_ASPECT}
      outputWidth={DONATION_PAGE_IMAGE_OUTPUT_WIDTH}
      defaultFillColor={DONATION_PAGE_IMAGE_DEFAULT_FILL_COLOR}
      copy={copy}
    />
  )
}
