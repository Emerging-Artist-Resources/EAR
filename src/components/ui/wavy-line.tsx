import { cn } from "@/lib/utils"

interface WavyLineProps {
  className?: string
  color?: string
  height?: number
  width?: string | number
  wavePattern?: "gentle" | "medium" | "strong" | "hand-drawn"
}

const wavePatterns = {
  gentle: "M 0 2 Q 8 0, 16 2 T 32 2",
  medium: "M 0 2 Q 12 -1, 24 2 T 48 2",
  strong: "M 0 2 Q 16 -2, 32 2 T 64 2",
  "hand-drawn": "M 35 70 L 170 20 L 100 130 L 170 112 C 350 108, 400 0, 1000 108 C 1180 150, 1300 200, 1375 112",
}

export function WavyLine({ 
  className = "", 
  color = "currentColor",
  height = 3,
  width = "100%",
  wavePattern = "hand-drawn"
}: WavyLineProps) {
  const path = wavePatterns[wavePattern]
  
  // ViewBox dimensions for each pattern
  const getViewBox = () => {
    switch (wavePattern) {
      case "gentle":
        return "0 0 32 6"
      case "medium":
        return "0 0 48 6"
      case "strong":
        return "0 0 64 6"
      case "hand-drawn":
        return "0 0 1400 200"
      default:
        return "0 0 96 6"
    }
  }
  
  return (
    <svg
      className={cn("block", className)}
      height={wavePattern === "hand-drawn" ? height + 4 : height + 2}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      viewBox={getViewBox()}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={height}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
