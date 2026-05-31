import { Fragment, useMemo } from "react"
import { linkifyText } from "@/lib/text/linkify-text"
import { cn } from "@/lib/utils"

type LinkifiedTextProps = {
  text: string
  linkClassName?: string
  className?: string
}

const defaultLinkClass =
  "text-brand-primary hover:text-brand-primary-hover underline break-all"

const defaultWrapperClass = "min-w-0 max-w-full [overflow-wrap:anywhere]"

export function LinkifiedText({
  text,
  linkClassName = defaultLinkClass,
  className,
}: LinkifiedTextProps) {
  const segments = useMemo(() => linkifyText(text), [text])

  return (
    <span className={cn(defaultWrapperClass, className)}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <Fragment key={index}>{segment.value}</Fragment>
        }

        if (segment.type === "email") {
          return (
            <a key={index} className={linkClassName} href={segment.href}>
              {segment.label}
            </a>
          )
        }

        return (
          <a
            key={index}
            className={linkClassName}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {segment.label}
          </a>
        )
      })}
    </span>
  )
}
