import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const variants = {
  button: {
    base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
    variants: {
      variant: {
        primary: "bg-yellow-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500",
        ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
        destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
  },
  input: {
    base: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50",
    variants: {
      error: "border-red-500 focus:ring-red-500 focus:border-red-500",
    },
  },
  card: {
    base: "rounded-lg border border-gray-200 bg-white shadow-sm",
    variants: {
      padding: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
  },
  modal: {
    overlay: "fixed inset-0 bg-white/10 backdrop-blur-lg flex items-center justify-center p-4 z-[9999]",
    content: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative",
  },
} as const
