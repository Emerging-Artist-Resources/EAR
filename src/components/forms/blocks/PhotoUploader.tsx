import { useRef, useEffect, useState } from "react"
import { UseFormReturn, Controller, useWatch, useFormState } from "react-hook-form"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import { ImageWithBlurredFill } from "@/components/shared/ImageWithBlurredFill"

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
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && showAsterisk && <span className="text-error-600">*</span>}
        </label>
      )}

      {description && <Text className="text-xs text-gray-500 mb-1">{description}</Text>}

      <Card
        className={`p-4 border-dashed border-2 ${
          showError ? "border-error-600" : "border-gray-400"
        } bg-ear-off-white`}
      >
        <div
          className="rounded-md bg-ear-off-white p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault()
            await addFiles(e.dataTransfer.files)
          }}
        >
          <Text className="text-gray-700">Click to upload photos or drag and drop</Text>
          <Text className="text-xs text-gray-500">
            Up to {max} images, optimized for web (~5MB each max)
          </Text>

          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              {processing ? "Processing..." : "Choose Files"}
            </Button>
          </div>

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
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {files.map((f, idx) => (
              <div
                key={`${f.name}-${f.size}-${f.lastModified}-${idx}`}
                className="relative rounded-md border border-gray-200 overflow-hidden"
              >
                <ImageWithBlurredFill
                  src={previewUrls[idx]}
                  alt={f.name}
                  frameClassName="h-24 w-full"
                />
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
                <div className="p-2">
                  <Text className="text-xs text-gray-600 truncate">{f.name}</Text>
                  <Text className="text-xs text-gray-400">
                    {(f.size / 1024 / 1024).toFixed(2)}MB
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showError && state.error?.message && (
        <Text className="text-xs text-error-600">{String(state.error.message)}</Text>
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
