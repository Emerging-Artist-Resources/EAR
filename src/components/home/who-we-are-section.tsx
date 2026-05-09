export function WhoWeAreSection() {
  return (
    <section
      id="who-we-are"
      className="bg-ear-off-white px-4 py-16 sm:px-8 md:py-24 lg:px-12"
    >
      <h2 className="font-header text-center text-4xl font-bold tracking-tight text-ear-black md:text-5xl lg:text-6xl">
        WHO WE ARE
      </h2>
      <div className="mx-auto mt-12 grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div className="space-y-5 font-sans text-base leading-relaxed text-ear-black md:text-lg">
          <p>
            Emerging Artist Resources (EAR) is an arts service organization rooted in the NYC
            Metropolitan community, providing shared resources for artists and emerging arts
            initiatives. We were founded in response to a familiar and persistent gap in the field:
          </p>
          <p>
            Artists are expected to navigate complex structures without adequate support, training,
            or access to resources.
          </p>
          <p>
            We believe the gap is neither inevitable nor insurmountable–and that better systems CAN
            be built.
          </p>
          <p>Our approach is to meet artists where they&apos;re at.</p>
        </div>
        <div className="flex w-full max-w-md flex-col gap-10 lg:ml-auto lg:text-left">
          <p className="font-header text-2xl font-bold leading-snug text-ear-black md:text-3xl">
            A NEW WAVE OF ARTS ADMINISTRATION
          </p>
          <p className="font-header text-2xl font-bold leading-snug text-ear-black md:text-3xl">
            RESOURCES ARE HERE. YOU DON&apos;T HAVE TO DO IT ALONE.
          </p>
        </div>
      </div>
    </section>
  )
}
