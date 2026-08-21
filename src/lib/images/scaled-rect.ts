/** Destination rect when scaling a source size into a destination with object-fit: contain. */
export type ScaledRect = {
  x: number
  y: number
  width: number
  height: number
}

/** Scale source to fit entirely inside destination (letterbox / pillarbox). */
export function getContainRect(
  sourceWidth: number,
  sourceHeight: number,
  destWidth: number,
  destHeight: number,
): ScaledRect {
  const scale = Math.min(destWidth / sourceWidth, destHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return {
    x: (destWidth - width) / 2,
    y: (destHeight - height) / 2,
    width,
    height,
  }
}

/** Scale source to cover destination (crop overflow). */
export function getCoverRect(
  sourceWidth: number,
  sourceHeight: number,
  destWidth: number,
  destHeight: number,
): ScaledRect {
  const scale = Math.max(destWidth / sourceWidth, destHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return {
    x: (destWidth - width) / 2,
    y: (destHeight - height) / 2,
    width,
    height,
  }
}
