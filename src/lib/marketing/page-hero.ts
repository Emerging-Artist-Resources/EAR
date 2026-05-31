/** Shared layout and typography for marketing page heroes. */

export const PAGE_HERO_HEIGHT_CLASS = "min-h-[80dvh]"

export const PAGE_HERO_GRID_CLASS =
  "relative overflow-hidden bg-ear-black lg:grid lg:grid-cols-2"

export const PAGE_HERO_CONTENT_PADDING_CLASS =
  "px-6 py-10 sm:px-10 lg:px-14 lg:py-12"

export const PAGE_HERO_TITLE_CLASS =
  "text-4xl font-bold uppercase tracking-wide leading-[1.3] text-ear-off-white sm:text-5xl lg:text-6xl"

export const PAGE_HERO_TAGLINE_CLASS =
  "mt-4 text-xl font-sans font-bold uppercase tracking-widest text-ear-baby-blue sm:text-2xl"

export const PAGE_HERO_BODY_CLASS =
  "text-pretty text-lg leading-relaxed text-ear-off-white md:text-xl"

export const PAGE_HERO_LEAD_CLASS =
  "text-pretty text-xl leading-relaxed text-ear-off-white md:text-2xl"

export const PAGE_HERO_BODY_STACK_CLASS = "mt-6 space-y-5 sm:mt-8"

export const PAGE_HERO_ACTIONS_CLASS = "mt-6 sm:mt-8"

export const PAGE_HERO_BACKGROUND_OVERLAY_CLASS =
  "absolute inset-0 bg-gradient-to-b from-ear-black/40 via-ear-black/20 to-ear-black/50"

/** Darker overlay so split-hero copy stays readable over the photo on small screens. */
export const PAGE_HERO_SPLIT_MOBILE_OVERLAY_CLASS =
  "absolute inset-0 bg-gradient-to-b from-ear-black/90 via-ear-black/80 to-ear-black/95"

export const PAGE_HERO_BACKGROUND_IMAGE_CLASS =
  "object-cover object-center opacity-90"

export const PAGE_HERO_CENTERED_CONTENT_CLASS =
  "relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-center gap-8 px-6 text-center"

export const PAGE_HERO_SPLIT_CONTENT_CLASS =
  "relative z-10 flex flex-col justify-center lg:bg-ear-black"

export const PAGE_HERO_SPLIT_DESKTOP_IMAGE_CLASS =
  "relative hidden bg-ear-black lg:block"

/** Tighter typography for split-page heroes with long copy. */
export const COMPACT_PAGE_HERO_TITLE_CLASS = "leading-[1.15] tracking-normal"

export const COMPACT_PAGE_HERO_TAGLINE_CLASS = "mt-3 leading-snug tracking-wide"

export const COMPACT_PAGE_HERO_BODY_CLASS = "leading-snug"

export const COMPACT_PAGE_HERO_BODY_STACK_CLASS = "mt-4 space-y-3 sm:mt-6"
