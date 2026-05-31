import { TapeAccentCard } from "@/components/shared/TapeAccentCard"
import { Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import { OUR_STORY_BACKGROUND_SRC, ourStoryLetter } from "@/lib/content/our-story"

type OurStoryLetterSectionProps = {
  className?: string
}

export function OurStoryLetterSection({ className }: OurStoryLetterSectionProps) {
  return (
    <section
      className={cn("relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24", className)}
      aria-labelledby="our-story-letter-heading"
    >
      <div
        className="absolute inset-0 bg-ear-off-white bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${OUR_STORY_BACKGROUND_SRC}')` }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        <TapeAccentCard cardClassName="px-6 pb-10 pt-14 sm:px-10 sm:pb-12 sm:pt-16 lg:px-14 lg:pb-14 lg:pt-20">
          <h2
            id="our-story-letter-heading"
            className="font-header text-center text-2xl font-bold uppercase tracking-wide text-ear-black sm:text-3xl"
          >
            {ourStoryLetter.title}
          </h2>
          <div className="mt-8 space-y-5">
            {ourStoryLetter.paragraphs.map((paragraph, i) => (
              <Text key={i} className="text-pretty text-base leading-relaxed text-ear-black md:text-lg">
                {paragraph}
              </Text>
            ))}
            <Text className="pt-2 text-base italic text-ear-black/90 md:text-lg">
              {ourStoryLetter.signature}
            </Text>
          </div>
        </TapeAccentCard>
      </div>
    </section>
  )
}
