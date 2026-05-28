import { AboutUsProfileRow } from "@/components/about-us/AboutUsProfileRow"
import { TapeAccentCard } from "@/components/shared/TapeAccentCard"
import { H1, H2, Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import { aboutUsAdvisoryBoard } from "@/lib/content/about-us"

type AboutUsAdvisoryBoardSectionProps = {
  className?: string
}

export function AboutUsAdvisoryBoardSection({ className }: AboutUsAdvisoryBoardSectionProps) {
  return (
    <section
      className={cn("bg-ear-off-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24", className)}
      aria-labelledby="about-us-advisory-heading"
    >
      <div className="mx-auto max-w-6xl">
        <H2
          id="about-us-advisory-heading"
          className="text-5xl font-bold uppercase tracking-wide text-ear-black"
        >
          {aboutUsAdvisoryBoard.sectionTitle}
        </H2>

        <div className="mx-auto mt-12 max-w-4xl">
          <TapeAccentCard
            cardClassName="border-ear-off-white/20 bg-ear-dark-red px-6 pb-10 pt-14 shadow-lg sm:px-10 sm:pb-12 sm:pt-16 lg:px-14 lg:pb-14 lg:pt-20"
          >
            <div className="space-y-5">
              {aboutUsAdvisoryBoard.introParagraphs.map((paragraph, i) => (
                <Text key={i} className="text-pretty text-base leading-relaxed text-ear-off-white md:text-lg">
                  {paragraph}
                </Text>
              ))}
            </div>
          </TapeAccentCard>
        </div>

        <div className="mt-16 space-y-16 lg:mt-20 lg:space-y-20">
          {aboutUsAdvisoryBoard.members.map((member) => (
            <AboutUsProfileRow key={member.name} {...member} />
          ))}
        </div>
      </div>
    </section>
  )
}
