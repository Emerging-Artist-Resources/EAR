import Image from "next/image";
import { H1 } from "@/components/ui/typography";

export default function CommunityCalendarHero() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-ear-black text-ear-off-white">
      
      {/* Background Image */}
      <Image
        src="/images/community-calendar.JPG"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[left_0%_top_20%] opacity-60"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-ear-black via-ear-black/80 to-ear-black" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-24">
        {/* Title */}
        <H1 className="text-5xl text-center md:text-6xl lg:text-7xl tracking-tight leading-[1.2] text-ear-off-white">
        COMMUNITY <br /> CALENDAR
      </H1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* LEFT SIDE (empty to preserve spacing like design) */}
          <div />

          {/* RIGHT SIDE TEXT */}
          <div className="max-w-xl lg:ml-auto space-y-6">


            {/* Body */}
            <div className="space-y-5 text-white/80 text-base md:text-lg leading-relaxed">

              <p className="text-white text-lg md:text-xl">
                Welcome to the Community Calendar!
              </p>

              <p>
                This is a place to see what is taking shape around you.
                Performances, workshops, gatherings, and opportunities
                shared by artists and organizations across the community
                all live here together.
              </p>

              <p>
                Whether you are looking for somewhere to go, a space to share
                your work, or a way to invite others into what you are creating,
                you are welcome to add to this calendar. We hope it helps you
                find rooms, conversations, and collaborators you might not
                have discovered otherwise.
              </p>

              <p>
                We encourage you to explore, participate, and contribute.
                This space grows through the people who use it.
              </p>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}