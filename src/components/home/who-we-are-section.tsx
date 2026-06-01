export function WhoWeAreSection() {
  return (
    <section
      id="who-we-are"
      className="bg-ear-off-white px-4 py-8 sm:px-8 md:py-12 lg:px-12"
    >
      <h2 className="font-title text-center text-4xl font-bold tracking-tight text-ear-black md:text-5xl lg:text-6xl">
        WHO WE ARE
      </h2>
      <div className="mx-auto mt-12 grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div className="space-y-5 font-sans text-base leading-relaxed text-ear-black md:text-lg">
          <p>
          Emerging Artist Resources (EAR) is an arts-service organization in the NYC Metropolitan community, 
          providing shared resources for artists and emerging arts initiatives. Our mission is to help you 
          build a sustainable creative practice with the support, knowledge, and structure needed to thrive. 
          </p>
          <p>
          We were founded in response to a familiar and persistent gap in the field: artists are expected to 
          navigate complex systems without adequate support, training, or access to resources. 
          </p>
          <p>
          That’s where EAR comes in, to build a better system that meets artists where they’re at. We’re here 
          to offer you the tools you need so that navigating a creative career feels accessible and possible.
          </p>
          
        </div>
        <div className="flex w-full max-w-md flex-col gap-10 lg:ml-auto lg:text-left">
          <p className="font-header text-2xl font-bold leading-snug text-ear-black md:text-3xl">
            A NEW WAVE OF ARTS ADMINISTRATION
          </p>
          <p className="font-header text-2xl font-bold leading-snug text-ear-black md:text-3xl">
            WHERE EMERGING ARTISTS BUILD SUSTAINABLE PRACTICES
          </p>
        </div>
      </div>
    </section>
  )
}
