import React, { useRef } from "react"
import { UseFormReturn, Controller } from "react-hook-form"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"

interface PhotoUploaderProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name: string // stores File[] in form state
  max?: number
}

export function PhotoUploader<T extends Record<string, unknown>>({
  form,
  name,
  max = 5,
}: PhotoUploaderProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Controller
      control={form.control}
      name={name as any}
      defaultValue={[] as any}
      render={({ field: { value, onChange } }) => {
        const files: File[] = Array.isArray(value) ? value : []

        const addFiles = (fileList: FileList | null) => {
          if (!fileList) return
          const next = [...files]
          for (const f of Array.from(fileList)) {
            if (next.length >= max) break
            next.push(f)
          }
          onChange(next)
        }

        const removeAt = (idx: number) => {
          const next = files.filter((_, i) => i !== idx)
          onChange(next)
        }

        return (
          <div className="space-y-2">
            <Card className="p-4">
              <div
                className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  addFiles(e.dataTransfer.files)
                }}
              >
                <Text className="text-gray-700">Click to upload photos or drag and drop</Text>
                <Text className="text-xs text-gray-500">PNG, JPG up to 10MB each</Text>
                <div className="mt-3">
                  <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>Choose Files</Button>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((f, idx) => {
                    const url = URL.createObjectURL(f)
                    return (
                      <div key={idx} className="relative rounded-md border border-gray-200 overflow-hidden">
                        <img src={url} alt={f.name} className="h-24 w-full object-cover" />
                        <div className="absolute top-1 right-1">
                          <Button variant="ghost" size="sm" onClick={() => removeAt(idx)} className="px-2 py-0">Remove</Button>
                        </div>
                        <div className="p-2">
                          <Text className="text-xs text-gray-600 truncate">{f.name}</Text>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        )
      }}
    />
  )
}


