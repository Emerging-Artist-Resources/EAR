"use client"

import { useEffect, useRef, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"
import { ImageCropModal } from "@/components/forms/blocks/ImageCropModal"
import { fiscalSponsorshipDashboard } from "@/lib/content/fiscal-sponsorship-dashboard"
import {
  DONATION_PAGE_IMAGE_ASPECT,
  DONATION_PAGE_IMAGE_DEFAULT_FILL_COLOR,
  DONATION_PAGE_IMAGE_OUTPUT_WIDTH,
} from "@/lib/images/donation-page-image-frame"
import { compressListingImage } from "@/lib/listings/compress-listing-image"
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processingPick, setProcessingPick] = useState(false)
  const [pickError, setPickError] = useState<string | null>(null)

  const pendingFiles = useWatch({
    control: form.control,
    name: "donation_page_image_files",
    defaultValue: [],
  })
  const files = Array.isArray(pendingFiles) ? pendingFiles : []
  const pendingFile = files[0] instanceof File ? files[0] : null

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(pendingFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingFile])

  useEffect(() => {
    if (files.length > 0 && removeExisting) {
      onRemoveExistingChange(false)
    }
  }, [files.length, onRemoveExistingChange, removeExisting])

  useEffect(() => {
    return () => {
      if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl)
    }
  }, [cropSourceUrl])

  const showExistingPreview =
    Boolean(existingImageUrl) && !removeExisting && !pendingFile
  const showPendingPreview = Boolean(previewUrl)

  const clearCropSource = () => {
    setCropOpen(false)
    setCropSourceUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
  }

  const handleRemoveExisting = () => {
    onRemoveExistingChange(true)
    form.setValue("donation_page_image_files", [], { shouldDirty: true })
  }

  const handleClearPending = () => {
    form.setValue("donation_page_image_files", [], { shouldDirty: true })
  }

  const openFilePicker = () => {
    setPickError(null)
    inputRef.current?.click()
  }

  const handleFileSelected = async (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file || processingPick) return

    if (!file.type.startsWith("image/")) {
      setPickError("Please choose an image file")
      return
    }

    setProcessingPick(true)
    setPickError(null)

    try {
      // Revoke any previous crop source before creating a new one
      setCropSourceUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return URL.createObjectURL(file)
      })
      setCropOpen(true)
    } finally {
      setProcessingPick(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleCropComplete = async (framedFile: File) => {
    try {
      const compressed = await compressListingImage(framedFile)
      form.setValue("donation_page_image_files", [compressed], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      onRemoveExistingChange(false)
      clearCropSource()
    } catch (err) {
      setPickError(err instanceof Error ? err.message : "Failed to process image")
      clearCropSource()
    }
  }

  return (
    <div className="space-y-3">
      {showExistingPreview ? (
        <div
          className="relative overflow-hidden rounded-md border border-gray-200"
          style={{ aspectRatio: DONATION_PAGE_IMAGE_ASPECT }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={existingImageUrl ?? undefined}
            alt={copy.previewAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openFilePicker}>
              {copy.replaceLabel}
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleRemoveExisting}>
              {copy.removeLabel}
            </Button>
          </div>
        </div>
      ) : null}

      {showPendingPreview ? (
        <div
          className="relative overflow-hidden rounded-md border border-gray-200"
          style={{ aspectRatio: DONATION_PAGE_IMAGE_ASPECT }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl ?? undefined}
            alt={copy.previewAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openFilePicker}>
              {copy.replaceLabel}
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleClearPending}>
              {copy.removeLabel}
            </Button>
          </div>
        </div>
      ) : null}

      {!showExistingPreview && !showPendingPreview ? (
        <Card className="border-2 border-dashed border-gray-400 bg-ear-off-white p-4">
          <div
            className="rounded-md bg-ear-off-white p-6 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={async (event) => {
              event.preventDefault()
              await handleFileSelected(event.dataTransfer.files)
            }}
          >
            <Text className="text-gray-700">{copy.dropHint}</Text>
            <Text className="text-xs text-gray-500">{copy.sizeHint}</Text>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={openFilePicker}
                disabled={processingPick}
              >
                {processingPick ? copy.processingLabel : copy.chooseLabel}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          await handleFileSelected(event.target.files)
        }}
      />

      {pickError ? <Text className="text-sm text-error-600">{pickError}</Text> : null}

      {removeExisting && !pendingFile ? (
        <Text className="text-sm text-gray-600">{copy.removedHint}</Text>
      ) : null}

      <ImageCropModal
        isOpen={cropOpen}
        imageSrc={cropSourceUrl}
        title={copy.cropTitle}
        aspect={DONATION_PAGE_IMAGE_ASPECT}
        outputWidth={DONATION_PAGE_IMAGE_OUTPUT_WIDTH}
        defaultFillColor={DONATION_PAGE_IMAGE_DEFAULT_FILL_COLOR}
        onCancel={clearCropSource}
        onComplete={handleCropComplete}
        confirmLabel={copy.cropConfirmLabel}
        cancelLabel={copy.cropCancelLabel}
        processingLabel={copy.processingLabel}
        blurFillLabel={copy.blurFillLabel}
        colorFillLabel={copy.colorFillLabel}
        zoomLabel={copy.zoomLabel}
        hint={copy.cropHint}
      />
    </div>
  )
}
