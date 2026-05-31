import Image from "next/image"
import { Fragment } from "react"
import { Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import type { AboutUsParagraph, AboutUsProfile } from "@/lib/content/about-us"

const profileLinkClass =
  "text-ear-dark-red underline decoration-ear-dark-red/40 underline-offset-2 transition-colors hover:text-ear-black hover:decoration-ear-black/40"

function renderParagraphContent(paragraph: string | AboutUsParagraph) {
  if (typeof paragraph === "string") {
    return paragraph
  }

  return paragraph.map((segment, index) => {
    if (typeof segment === "string") {
      return <Fragment key={index}>{segment}</Fragment>
    }

    return (
      <a
        key={index}
        href={segment.href}
        target="_blank"
        rel="noopener noreferrer"
        className={profileLinkClass}
      >
        {segment.label}
      </a>
    )
  })
}

type AboutUsProfileRowProps = AboutUsProfile & {
  className?: string
}

function ProfileHeadshot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mx-auto w-full max-w-[15rem] shrink-0 sm:max-w-[17rem] lg:mx-0">
      <Image
        src={src}
        alt={alt}
        width={376}
        height={465}
        className="h-auto w-full object-cover"
        sizes="(max-width: 1024px) 17rem, 15rem"
      />
    </div>
  )
}

function ProfileText({ name, role, paragraphs }: Pick<AboutUsProfile, "name" | "role" | "paragraphs">) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-4">
      <div>
        <h3 className="font-header text-xl font-bold uppercase tracking-wide text-ear-black sm:text-2xl">
          {name}
        </h3>
        <p className="mt-1 font-sans text-sm font-bold uppercase tracking-widest text-ear-dark-red sm:text-base">
          {role}
        </p>
      </div>
      <div className="space-y-4">
        {paragraphs.map((paragraph, i) => (
          <Text key={i} className="text-pretty text-base leading-relaxed text-ear-black">
            {renderParagraphContent(paragraph)}
          </Text>
        ))}
      </div>
    </div>
  )
}

export function AboutUsProfileRow({
  name,
  role,
  paragraphs,
  imageSrc,
  imageAlt,
  imagePosition = "left",
  className,
}: AboutUsProfileRowProps) {
  const hasImage = Boolean(imageSrc && imageAlt)

  if (!hasImage) {
    return (
      <article className={cn("max-w-3xl", className)}>
        <ProfileText name={name} role={role} paragraphs={paragraphs} />
      </article>
    )
  }

  const image = <ProfileHeadshot src={imageSrc!} alt={imageAlt!} />

  return (
    <article
      className={cn(
        "flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12",
        imagePosition === "right" && "lg:flex-row-reverse",
        className,
      )}
    >
      {image}
      <ProfileText name={name} role={role} paragraphs={paragraphs} />
    </article>
  )
}
