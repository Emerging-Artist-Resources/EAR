import { AboutUsProfileRow } from "@/components/about-us/AboutUsProfileRow"
import { cn } from "@/lib/utils"
import { aboutUsTeam } from "@/lib/content/about-us"
import { H1, H3 } from "../ui/typography"

type AboutUsTeamSectionProps = {
  className?: string
}

export function AboutUsTeamSection({ className }: AboutUsTeamSectionProps) {
  return (
    <section
      className={cn("bg-ear-off-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24", className)}
      aria-labelledby="about-us-team-heading"
    >
      <div className="mx-auto max-w-6xl">
        <H1
          id="about-us-team-heading"
          className="text-center text-5xl font-bold uppercase tracking-wide text-ear-black"
        >
          {aboutUsTeam.sectionTitle}
        </H1>

        <H3 className="mt-12 text-5xl font-bold uppercase tracking-wide text-ear-black">
          {aboutUsTeam.staffHeading}
        </H3>

        <div className="mt-10 space-y-16 lg:space-y-20">
          {aboutUsTeam.members.map((member) => (
            <AboutUsProfileRow key={member.name} {...member} />
          ))}
        </div>
      </div>
    </section>
  )
}
