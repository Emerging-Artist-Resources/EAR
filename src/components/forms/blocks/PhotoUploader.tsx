import { useRef, useEffect, useState } from "react"
import { UseFormReturn, Controller, useWatch, useFormState } from "react-hook-form"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Caption, Label, Muted, Text, TextSmall } from "@/components/ui/typography"
import { stack } from "@/lib/spacing"
import { cn } from "@/lib/utils"

interface PhotoUploaderProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name: string // stores File[] in form state
  label?: string
  description?: string
  max?: number
  required?: boolean
  showAsterisk?: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIMENSION = 2400
const COMPRESSION_QUALITY = 0.82

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = (height / width) * MAX_DIMENSION
              width = MAX_DIMENSION
            } else {
              width = (width / height) * MAX_DIMENSION
              height = MAX_DIMENSION
            }
          }

          canvas.width = Math.round(width)
          canvas.height = Math.round(height)

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Could not get canvas context"))
            return
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Image compression failed"))
                return
              }

              if (blob.size > MAX_FILE_SIZE) {
                reject(
                  new Error(
                    `Image is too large after compression (${(blob.size / 1024 / 1024).toFixed(
                      2
                    )}MB). Please use a smaller image.`
                  )
                )
                return
              }

              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, ".jpg"),
                {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }
              )

              resolve(compressedFile)
            },
            "image/jpeg",
            COMPRESSION_QUALITY
          )
        }

        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = e.target?.result as string
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Unknown image processing error"))
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

function PhotoUploaderInner<T extends Record<string, unknown>>({
  form,
  name,
  label,
  description,
  max,
  required,
  showAsterisk,
}: Required<PhotoUploaderProps<T>> & { max: number }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const currentFiles = useWatch({
    control: form.control,
    name: name as unknown as never,
    defaultValue: [] as unknown as never,
  }) as unknown as File[]

  const files: File[] = Array.isArray(currentFiles) ? currentFiles : []

  // Create/revoke preview URLs whenever files change
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviewUrls(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [files])

  useFormState({ control: form.control, name: name as never, exact: true })
  const state = form.getFieldState(name as unknown as never, form.formState)
  const showError =
    Boolean(state.error) &&
    (state.isTouched || form.formState.isSubmitted || form.formState.submitCount > 0)

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || processing) return

    setProcessing(true)
    const toAdd: File[] = []
    const errors: string[] = []

    try {
      for (const file of Array.from(fileList)) {
        if (files.length + toAdd.length >= max) break

        if (!file.type.startsWith("image/")) {
          errors.push(`${file.name} is not an image file`)
          continue
        }

        try {
          const compressed = await compressImage(file)
          toAdd.push(compressed)
        } catch (err) {
          errors.push(err instanceof Error ? err.message : `Failed to process ${file.name}`)
        }
      }

      if (toAdd.length > 0) {
        form.setValue(name as unknown as never, [...files, ...toAdd] as unknown as never, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        })
      }

      if (errors.length > 0) {
        form.setError(name as unknown as never, {
          type: "manual",
          message: errors.join("; "),
        })
      } else {
        form.clearErrors(name as unknown as never)
      }
    } finally {
      setProcessing(false)
      // Allow selecting the same file again
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const removeAt = (idx: number) => {
    const next = files.filter((_, i) => i !== idx)
    form.setValue(name as unknown as never, next as unknown as never, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })

    if (next.length === 0 && !required) {
      form.clearErrors(name as unknown as never)
    }
  }

  const disabled = processing || files.length >= max

  return (
    <div className={stack.sm}>
      {(label || description) && (
        <div className={stack.xs}>
          {label && (
            <Label className="text-text-primary">
              {label} {required && showAsterisk && <span className="text-error-600">*</span>}
            </Label>
          )}
          {description && <Muted>{description}</Muted>}
        </div>
      )}

      <Card
        className={cn(
          "border-2 border-dashed bg-ear-off-white p-4",
          showError ? "border-error-600" : "border-border",
        )}
      >
        <div
          className={cn(stack.sm, "rounded-md bg-ear-off-white p-6 text-center")}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault()
            await addFiles(e.dataTransfer.files)
          }}
        >
          <Text className="text-text-primary">Click to upload photos or drag and drop</Text>
          <TextSmall className="text-text-muted">
            Up to {max} images, optimized for web (~5MB each max)
          </TextSmall>

          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            {processing ? "Processing..." : "Choose Files"}
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              await addFiles(e.target.files)
            }}
            disabled={disabled}
          />
        </div>

        {files.length > 0 && (
          <div className={cn(stack.sm, "grid grid-cols-2 gap-3 sm:grid-cols-3")}>
            {files.map((f, idx) => (
              <div
                key={`${f.name}-${f.size}-${f.lastModified}-${idx}`}
                className="relative overflow-hidden rounded-md border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrls[idx]} alt={f.name} className="h-24 w-full object-cover" />
                <div className="absolute top-1 right-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    type="button"
                    onClick={() => removeAt(idx)}
                    className="px-2 py-0"
                    disabled={processing}
                  >
                    X
                  </Button>
                </div>
                <div className={cn(stack.xs, "p-2")}>
                  <Caption className="truncate text-text-primary">{f.name}</Caption>
                  <Caption className="text-text-muted">
                    {(f.size / 1024 / 1024).toFixed(2)}MB
                  </Caption>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showError && state.error?.message && (
        <Caption className="text-error-600">{String(state.error.message)}</Caption>
      )}
    </div>
  )
}

export function PhotoUploader<T extends Record<string, unknown>>(props: PhotoUploaderProps<T>) {
  const {
    form,
    name,
    label = "",
    description = "",
    max = 5,
    required = false,
    showAsterisk = true,
  } = props

  return (
    <Controller
      control={form.control}
      name={name as unknown as never}
      defaultValue={[] as unknown as never}
      render={() => (
        <PhotoUploaderInner
          form={form}
          name={name}
          label={label}
          description={description}
          max={max}
          required={required}
          showAsterisk={showAsterisk}
        />
      )}
    />
  )
}
