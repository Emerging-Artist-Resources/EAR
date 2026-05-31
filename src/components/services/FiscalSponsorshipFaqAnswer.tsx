import { Text } from "@/components/ui/typography"
import type { FiscalSponsorshipFaqAnswer } from "@/lib/content/fiscal-sponsorship-faq"

type FiscalSponsorshipFaqAnswerProps = {
  answer: FiscalSponsorshipFaqAnswer
}

export function FiscalSponsorshipFaqAnswerContent({ answer }: FiscalSponsorshipFaqAnswerProps) {
  if (answer.type === "list") {
    return (
      <div className="space-y-4">
        {answer.intro ? (
          <Text className="text-ear-black text-pretty text-base leading-relaxed">{answer.intro}</Text>
        ) : null}
        <ul className="list-disc space-y-2 pl-5 font-sans text-base leading-relaxed text-ear-black">
          {answer.items.map((item) => (
            <li key={item} className="text-pretty">
              {item}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {answer.paragraphs.map((paragraph, i) => (
        <Text key={i} className="text-ear-black text-pretty text-base leading-relaxed">
          {paragraph}
        </Text>
      ))}
    </div>
  )
}
