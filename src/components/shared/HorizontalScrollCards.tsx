"use client"

import { Children, useState, useRef, useEffect, useCallback, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { H3, Text } from "@/components/ui/typography"

export interface HorizontalScrollCardsProps {
  title?: string
  /** Shown under the title (e.g. filter explanation). */
  description?: string
  children: ReactNode
  onCardClick?: (index: number) => void
  cardsPerView?: number
  className?: string
}

export function HorizontalScrollCards({
  title,
  description,
  children,
  onCardClick,
  cardsPerView = 3,
  className,
}: HorizontalScrollCardsProps) {
  const cardItems = Children.toArray(children)
  const gapPx = 16
  /** Fixed slot width per card (always based on cardsPerView, not how many cards exist). */
  const slotWidth = `calc(${100 / cardsPerView}% - 0.75rem)`

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [cardWidth, setCardWidth] = useState(0)

  const updateScrollButtons = useCallback(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollLeft = container.scrollLeft
    const scrollWidth = container.scrollWidth
    const clientWidth = container.clientWidth

    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)

    if (cardItems.length > 0 && cardWidth === 0) {
      const firstCard = container.querySelector('[data-card]') as HTMLElement
      if (firstCard) {
        const computedWidth = firstCard.offsetWidth
        setCardWidth(computedWidth + gapPx)
      }
    }
  }, [cardItems.length, cardWidth, gapPx])

  useEffect(() => {
    updateScrollButtons()
    
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener("scroll", updateScrollButtons)
    window.addEventListener("resize", updateScrollButtons)

    return () => {
      container.removeEventListener("scroll", updateScrollButtons)
      window.removeEventListener("resize", updateScrollButtons)
    }
  }, [updateScrollButtons])

  useEffect(() => {
    updateScrollButtons()
  }, [cardItems, updateScrollButtons])

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollAmount = cardWidth * cardsPerView || container.clientWidth * 0.8

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }, [cardWidth, cardsPerView])

  if (cardItems.length === 0) {
    return null
  }

  return (
    <div className={cn("w-full", className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <H3 className="text-ear-black">{title}</H3>
          )}
          {description && (
            <Text className="mt-1 text-text-muted">{description}</Text>
          )}
        </div>
      )}
      <div className="relative">
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-surface-panel shadow-md hover:bg-surface-panel-alt"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
        )}
        <div
          ref={scrollContainerRef}
          className="flex justify-start items-start gap-4 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {cardItems.map((child, index) => (
            <div
              key={index}
              data-card
              className="flex-shrink-0 text-left"
              style={{
                flex: "0 0 auto",
                width: slotWidth,
                minWidth: "280px",
              }}
              onClick={() => onCardClick?.(index)}
            >
              <div className="w-full min-w-0">{child}</div>
            </div>
          ))}
        </div>
        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-surface-panel shadow-md hover:bg-surface-panel-alt"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
