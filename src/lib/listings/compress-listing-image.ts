const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIMENSION = 2400
const COMPRESSION_QUALITY = 0.82

/** Compress a listing promo image for web upload (shared by PhotoUploader and ListingPhotoManager). */
export async function compressListingImage(file: File): Promise<File> {
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

              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              })

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
