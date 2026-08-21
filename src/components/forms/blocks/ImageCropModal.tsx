"use client"

import { useCallback, useEffect, useState } from "react"
import Cropper, { type Area, type MediaSize } from "react-easy-crop"
import "react-easy-crop/react-easy-crop.css"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import {
  composeFramedImageFromTransform,
  loadHtmlImage,
  type FrameFill,
} from "@/lib/images/compose-framed-image"

export type ImageCropFillMode = "blur" | "color"

/** Allow zooming out past "fit" so more letterbox fill is visible. */
const MIN_ZOOM = 0.4
const MAX_ZOOM = 3
const DEFAULT_ZOOM = 1

type ImageCropModalProps = {
  isOpen: boolean
  imageSrc: string | null
  title: string
  aspect: number
  outputWidth: number
  defaultFillColor: string
  onCancel: () => void
  onComplete: (file: File) => void
  confirmLabel?: string
  cancelLabel?: string
  processingLabel?: string
  blurFillLabel?: string
  colorFillLabel?: string
  zoomLabel?: string
  hint?: string
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  title,
  aspect,
  outputWidth,
  defaultFillColor,
  onCancel,
  onComplete,
  confirmLabel = "Use image",
  cancelLabel = "Cancel",
  processingLabel = "Processing…",
  blurFillLabel = "Blur background",
  colorFillLabel = "Solid background",
  zoomLabel = "Zoom",
  hint = "Drag to reposition. Zoom out to show the full image; empty areas use the background fill.",
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | null>(null)
  const [mediaSize, setMediaSize] = useState<{ width: number; height: number } | null>(null)
  const [fillMode, setFillMode] = useState<ImageCropFillMode>("blur")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !imageSrc) return
    setCrop({ x: 0, y: 0 })
    setZoom(DEFAULT_ZOOM)
    setCropSize(null)
    setMediaSize(null)
    setFillMode("blur")
    setProcessing(false)
    setError(null)
  }, [isOpen, imageSrc])

  const onCropSizeChange = useCallback((size: { width: number; height: number }) => {
    setCropSize(size)
  }, [])

  const onMediaLoaded = useCallback((size: MediaSize) => {
    setMediaSize({ width: size.width, height: size.height })
  }, [])

  // Satisfy Cropper's required complete callback; export uses zoom/pan instead of Area.
  const onCropComplete = useCallback((_croppedArea: Area, _pixels: Area) => {}, [])

  const handleConfirm = async () => {
    if (!imageSrc || !cropSize || !mediaSize || processing) return

    setProcessing(true)
    setError(null)

    try {
      const image = await loadHtmlImage(imageSrc)
      const fill: FrameFill =
        fillMode === "blur"
          ? { type: "blur" }
          : { type: "color", color: defaultFillColor }

      const file = await composeFramedImageFromTransform({
        image,
        crop,
        zoom,
        cropSize,
        mediaSize,
        aspect,
        outputWidth,
        fill,
      })
      onComplete(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image")
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = () => {
    if (processing) return
    setError(null)
    onCancel()
  }

  const canConfirm = Boolean(cropSize && mediaSize)

  return (
    <Modal
      isOpen={isOpen && Boolean(imageSrc)}
      onClose={handleCancel}
      title={title}
      size="lg"
      closeOnOverlay={false}
      overlayClassName="z-[10000]"
    >
      <div className="space-y-4">
        {hint ? <Text className="text-sm text-gray-600">{hint}</Text> : null}

        <div className="relative h-64 w-full overflow-hidden rounded-md sm:h-80">
          {imageSrc && fillMode === "blur" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
            />
          ) : null}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              backgroundColor: fillMode === "color" ? defaultFillColor : "transparent",
            }}
          >
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                aspect={aspect}
                objectFit="contain"
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                onCropSizeChange={onCropSizeChange}
                onMediaLoaded={onMediaLoaded}
                showGrid={false}
                classes={{
                  containerClassName: "rounded-md",
                  cropAreaClassName: "!border-white",
                }}
                style={{
                  containerStyle: { backgroundColor: "transparent" },
                  cropAreaStyle: { overflow: "hidden" },
                }}
              />
            ) : null}
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-gray-700">
          <span className="w-14 shrink-0">{zoomLabel}</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full"
            disabled={processing}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={fillMode === "blur" ? "primary" : "outline"}
            onClick={() => setFillMode("blur")}
            disabled={processing}
          >
            {blurFillLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={fillMode === "color" ? "primary" : "outline"}
            onClick={() => setFillMode("color")}
            disabled={processing}
          >
            {colorFillLabel}
          </Button>
        </div>

        {error ? <Text className="text-sm text-error-600">{error}</Text> : null}

        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={processing}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={processing || !canConfirm}
          >
            {processing ? processingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
