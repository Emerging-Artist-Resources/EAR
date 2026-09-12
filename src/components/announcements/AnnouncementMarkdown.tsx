"use client"

import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { isAppPath } from "@/features/announcements/announcement-urls"
import {
  parseAnnouncementMarkdown,
  type BlockNode,
  type HeadingLevel,
  type InlineNode,
} from "@/features/announcements/parse-announcement-markdown"
import { cn } from "@/lib/utils"

const linkClassName =
  "text-brand-primary hover:text-brand-primary-hover underline [overflow-wrap:anywhere]"

type AnnouncementMarkdownProps = {
  markdown: string
  className?: string
  /** When set, the body starts collapsed and can expand. */
  clampClassName?: string
}

function AnnouncementLink({ href, children }: { href: string; children: ReactNode }) {
  if (isAppPath(href)) {
    return (
      <Link href={href} className={linkClassName}>
        {children}
      </Link>
    )
  }

  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className={linkClassName}>
        {children}
      </a>
    )
  }

  return (
    <a href={href} className={linkClassName} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

function InlineMarkdown({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === "text") {
          return <Fragment key={index}>{node.value}</Fragment>
        }
        if (node.type === "strong") {
          return (
            <strong key={index} className="font-semibold">
              <InlineMarkdown nodes={node.children} />
            </strong>
          )
        }
        if (node.type === "em") {
          return (
            <em key={index}>
              <InlineMarkdown nodes={node.children} />
            </em>
          )
        }
        return (
          <AnnouncementLink key={index} href={node.href}>
            <InlineMarkdown nodes={node.children} />
          </AnnouncementLink>
        )
      })}
    </>
  )
}

const HEADING_TAG: Record<HeadingLevel, "h2" | "h3" | "h4" | "h5"> = {
  1: "h2",
  2: "h3",
  3: "h4",
  4: "h5",
}

const HEADING_CLASS: Record<HeadingLevel, string> = {
  1: "mb-3 mt-5 font-header text-xl font-bold tracking-tight first:mt-0 last:mb-0",
  2: "mb-2 mt-4 font-header text-lg font-semibold tracking-tight first:mt-0 last:mb-0",
  3: "mb-2 mt-3 font-header text-base font-semibold tracking-tight first:mt-0 last:mb-0",
  4: "mb-2 mt-3 font-header text-sm font-medium tracking-tight first:mt-0 last:mb-0",
}

function BlockMarkdown({ block }: { block: BlockNode }) {
  if (block.type === "spacer") {
    return <div aria-hidden="true" style={{ height: `${block.count * 1.5}rem` }} />
  }

  if (block.type === "paragraph") {
    return (
      <p className="mb-3 last:mb-0">
        {block.lines.map((line, index) => (
          <Fragment key={index}>
            {index > 0 ? <br /> : null}
            <InlineMarkdown nodes={line} />
          </Fragment>
        ))}
      </p>
    )
  }

  if (block.type === "heading") {
    const Tag = HEADING_TAG[block.level]
    return (
      <Tag className={HEADING_CLASS[block.level]}>
        <InlineMarkdown nodes={block.children} />
      </Tag>
    )
  }

  const ListTag = block.type === "ul" ? "ul" : "ol"
  const listClass =
    block.type === "ul"
      ? "mb-3 list-disc space-y-1 pl-5 last:mb-0"
      : "mb-3 list-decimal space-y-1 pl-5 last:mb-0"

  return (
    <ListTag className={listClass}>
      {block.items.map((item, index) => (
        <li key={index}>
          <InlineMarkdown nodes={item} />
        </li>
      ))}
    </ListTag>
  )
}

export function AnnouncementMarkdown({
  markdown,
  className,
  clampClassName,
}: AnnouncementMarkdownProps) {
  const blocks = useMemo(() => parseAnnouncementMarkdown(markdown), [markdown])
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const canClamp = Boolean(clampClassName)

  useLayoutEffect(() => {
    if (!canClamp) {
      setOverflows(false)
      return
    }
    const el = bodyRef.current
    if (!el) return
    setOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [markdown, clampClassName, expanded, canClamp])

  if (blocks.length === 0) return null

  return (
    <div className="min-w-0 max-w-full">
      <div
        ref={bodyRef}
        className={cn(
          "max-w-full font-sans leading-6 text-ear-black [overflow-wrap:anywhere]",
          canClamp && !expanded && clampClassName,
          className
        )}
      >
        {blocks.map((block, index) => (
          <BlockMarkdown key={index} block={block} />
        ))}
      </div>
      {canClamp && (overflows || expanded) ? (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-brand-primary underline hover:text-brand-primary-hover"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  )
}
