import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/** Custom type scale from globals.css @theme — must match tailwind-merge font-size group. */
const earTypeScale = ["h1", "h2", "h3", "h4", "body", "body-sm", "caption"] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...earTypeScale] }],
      leading: [{ leading: ["body", "heading"] }],
      tracking: [{ tracking: ["eyebrow"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
