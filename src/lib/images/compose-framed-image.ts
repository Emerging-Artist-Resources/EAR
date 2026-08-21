import { getCoverRect } from "@/lib/images/scaled-rect"

export type FrameFill =
  | { type: "blur"; blurPx?: number }
  | { type: "color"; color: string }

export type ComposeFramedImageFromTransformOptions = {
  image: HTMLImageElement
  /** Pan offset from react-easy-crop (pixels in the on-screen crop area). */
  crop: { x: number; y: number }
  zoom: number
  /** On-screen crop area size from react-easy-crop (`onCropSizeChange`). */
  cropSize: { width: number; height: number }
  /**
   * Rendered media size at zoom=1 from react-easy-crop (`onMediaLoaded`).
   * This is sized to the cropper *container*, not the crop frame — matching
   * objectFit="contain" preview behavior.
   */
  mediaSize: { width: number; height: number }
  aspect: number
  outputWidth: number
  fill: FrameFill
  fileName?: string
  quality?: number
}

const DEFAULT_BLUR_PX = 28
const DEFAULT_QUALITY = 0.88

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", () => reject(new Error("Failed to load image")))
    image.crossOrigin = "anonymous"
    image.src = src
  })
}

function canvasToJpegFile(canvas: HTMLCanvasElement, fileName: string, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export image"))
          return
        }
        resolve(new File([blob], fileName, { type: "image/jpeg", lastModified: Date.now() }))
      },
      "image/jpeg",
      quality,
    )
  })
}

/**
 * Destination rect of the media inside the crop area, matching react-easy-crop:
 * `translate(crop.x, crop.y) scale(zoom)` with the media centered on the crop area.
 *
 * Important: `mediaWidth`/`mediaHeight` are the zoom=1 *rendered* size (container contain),
 * not a contain-fit into the crop frame.
 */
export function getMediaDestRectInCropArea(options: {
  mediaWidth: number
  mediaHeight: number
  cropWidth: number
  cropHeight: number
  zoom: number
  cropX: number
  cropY: number
}): { x: number; y: number; width: number; height: number } {
  const { mediaWidth, mediaHeight, cropWidth, cropHeight, zoom, cropX, cropY } = options
  const width = mediaWidth * zoom
  const height = mediaHeight * zoom
  return {
    x: cropWidth / 2 + cropX - width / 2,
    y: cropHeight / 2 + cropY - height / 2,
    width,
    height,
  }
}

/**
 * Paint a fixed-aspect hero frame from cropper zoom/pan + rendered media size.
 */
export async function composeFramedImageFromTransform(
  options: ComposeFramedImageFromTransformOptions,
): Promise<File> {
  const {
    image,
    crop,
    zoom,
    cropSize,
    mediaSize,
    aspect,
    outputWidth,
    fill,
    fileName = "donation-hero.jpg",
    quality = DEFAULT_QUALITY,
  } = options

  if (cropSize.width <= 0 || cropSize.height <= 0) {
    throw new Error("Invalid crop size")
  }
  if (mediaSize.width <= 0 || mediaSize.height <= 0) {
    throw new Error("Invalid media size")
  }

  const outputHeight = Math.max(1, Math.round(outputWidth / aspect))
  const canvas = document.createElement("canvas")
  canvas.width = outputWidth
  canvas.height = outputHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  const scaleX = outputWidth / cropSize.width
  const scaleY = outputHeight / cropSize.height

  const destInCrop = getMediaDestRectInCropArea({
    mediaWidth: mediaSize.width,
    mediaHeight: mediaSize.height,
    cropWidth: cropSize.width,
    cropHeight: cropSize.height,
    zoom,
    cropX: crop.x,
    cropY: crop.y,
  })

  const dest = {
    x: destInCrop.x * scaleX,
    y: destInCrop.y * scaleY,
    width: destInCrop.width * scaleX,
    height: destInCrop.height * scaleY,
  }

  if (fill.type === "color") {
    ctx.fillStyle = fill.color
    ctx.fillRect(0, 0, outputWidth, outputHeight)
  } else {
    const blurPx = fill.blurPx ?? DEFAULT_BLUR_PX
    const cover = getCoverRect(image.naturalWidth, image.naturalHeight, outputWidth, outputHeight)
    ctx.save()
    ctx.filter = `blur(${blurPx}px)`
    const pad = blurPx * 2
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      cover.x - pad,
      cover.y - pad,
      cover.width + pad * 2,
      cover.height + pad * 2,
    )
    ctx.restore()
  }

  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    dest.x,
    dest.y,
    dest.width,
    dest.height,
  )

  return canvasToJpegFile(canvas, fileName, quality)
}
