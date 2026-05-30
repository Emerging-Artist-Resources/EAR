export const ABOUT_US_HERO_IMAGE_SRC = "/images/about-us/hero-image.JPG" as const

export const ABOUT_US_STAY_IN_TOUCH_SRC = "/images/about-us/stay-in-touch-v4.png" as const

export const aboutUsHero = {
  title: "ABOUT US",
  tagline: "COMMUNITY DRIVEN. SOLUTION ORIENTED. ARTIST CENTERED.",
  paragraphs: [
    "We're excited to share the launch of Emerging Artist Resources (EAR)!",
    "Emerging Artist Resources (EAR) is a new wave of arts administration designed to help artists navigate the administrative side of their creative careers with clarity and transparency. Based in the NYC Metropolitan community, EAR supports individual artists, collectives, and organizations through shared resources, professional development, and artist-centered initiatives.",
    "Our team is made up of active, working artists with backgrounds in arts administration. We understand the realities of what it takes to both sustain a creative practice and design systems that are practical, accessible, and sustainable. We view administration as a creative practice itself, one that shapes who gets to create work, how that work is supported, and who is included in the cultural ecosystem. Rather than treating logistics as a barrier, we approach them with tools that can open doors and provide stability.",
    "As part of this soft launch, our primary focus is fiscal services, including fiscal sponsorship, bookkeeping, and fiscal mentorship, alongside creative support in video and photography.",
    "Through our fiscal sponsorship program, artists and projects can access grants, receive tax-deductible donations, and operate within a supportive administrative framework without needing to establish their own nonprofit.",
    "EAR is guided by a long-term vision of becoming a one-stop shop for all artists' needs, offering both the infrastructure and visibility needed to sustain and expand creative practices.",
    "This is just the beginning. We invite you to explore, share, and grow with us.",
  ],
} as const

export type AboutUsProfile = {
  name: string
  role: string
  paragraphs: readonly string[]
  imageSrc?: string
  imageAlt?: string
  imagePosition?: "left" | "right"
}

export const aboutUsTeam = {
  sectionTitle: "MEET THE TEAM",
  staffHeading: "STAFF",
  members: [
    {
      name: "JULIA ASHER",
      role: "EXECUTIVE DIRECTOR",
      imageSrc: "/images/about-us/julia-headshot.png",
      imageAlt: "Portrait of Julia Asher",
      imagePosition: "left",
      paragraphs: [
        "Julia Asher (she/her) is the Founder and Executive Director of EAR, and a working freelance dancer based in New York City. She currently serves as the Artist Liaison for Dance on Camera and previously worked at Pentacle, where she managed the fiscal sponsorship program for the Foundation for Independent Artists, Inc.",
        "As a performing artist, Julia has danced professionally with a range of artists and companies including Abarukas, Katherine Helen Fischer, Yaroque Dance Theatre, Kaleid Dance Collective, and Vivake Khamsingsavath, among others. She has recently presented her choreographic work at Mark Morris and has upcoming performances at Arts on Site and That Show. Beyond performing, she films and edits dance, using her professional background to capture movement and storytelling with precise timing, intention, and nuance.",
        "She holds a dual degree from Johns Hopkins University: a BFA in Dance from the Peabody Conservatory and a BA in Natural Sciences, with concentrations in Neuroscience and Mathematics. This interdisciplinary background informs her approach to the arts, combining empathy with a solution-oriented mindset. As a practicing professional dancer, she ensures that every resource EAR creates is one she would use herself.",
      ],
    },
    {
      name: "HARRY SUKONIK",
      role: "DIRECTOR OF FINANCE",
      imageSrc: "/images/about-us/harry-headshot.png",
      imageAlt: "Portrait of Harry Sukonik",
      imagePosition: "right",
      paragraphs: [
        "Harry Sukonik (he/him), Co-Founder and Director of Finance at EAR, brings deep expertise in fiscal sponsorship, grant writing and management, and financial operations for artists and arts organizations. Prior to EAR, he served as Fiscal Sponsorship Associate at Pentacle, managing the Foundation for Independent Artists, where he worked closely with various dance companies and with EAR co-founder Julia Asher. With a BFA in Dance and a background in Sociology from the Peabody Conservatory of Johns Hopkins University, Harry combines a rigorous financial skill set with a nuanced understanding of the performing arts. Alongside his administrative work, he performs as a freelance dancer with The Metropolitan Opera and Jennifer Muller/The Works, grounding EAR's mission in lived creative experience.",
      ],
    },
    {
      name: "KAYLA LAUFER",
      role: "DIRECTOR OF TECHNOLOGY",
      imageSrc: "/images/about-us/kayla-headshot.png",
      imageAlt: "Portrait of Kayla Laufer",
      imagePosition: "left",
      paragraphs: [
        "Kayla Laufer (she/her) is the Co-Founder and Director of Technology at Emerging Artist Resources (EAR), where she leads the development of the platform that supports artists, festivals, and opportunities across the dance community. Blending her background in computer science and dance, she designs clear, accessible tools that make it easier for artists to share their work and stay connected. Before joining EAR, Kayla worked at Addinex Technologies, a health-tech startup, and earned her M.S. in Computer Science from Fordham University and her BFA in Dance from the Peabody Conservatory of Johns Hopkins University. She is passionate about building technology that empowers artists. In addition to her work at EAR, Kayla is a freelance artist and currently dances with Eryc Taylor Dance, where she also serves as Rehearsal Director.",
      ],
    },
  ] satisfies AboutUsProfile[],
} as const

export const aboutUsAdvisoryBoard = {
  sectionTitle: "FOUNDING ADVISORY BOARD",
  introParagraphs: [
    "EAR’s Advisory Council is made up of seasoned arts administrators and cultural leaders, alongside working artists and dancers, who understand the challenges of building a sustainable path in the arts. They also recognize the importance of supporting other artists along the way. Each member brings a distinct perspective and shared commitment to helping artists sustain their practices, build meaningful connections, and thrive.",
    "As partners, the council plays a critical role in shaping EAR's direction, offering strategic guidance and ensuring that our work remains grounded in the evolving needs of the community we serve.",
  ],
  members: [
    {
      name: "MARA GREENBURG",
      role: "FOUNDING ADVISORY BOARD MEMBER",
      paragraphs: [
        "With over 45 years of experience in nonprofit and arts fiscal leadership, Mara Greenberg has dedicated her career to supporting artists and strengthening creative organizations. As the former Founder and Director of Pentacle, she has helped shape sustainable pathways for artists navigating the field. She holds an MBA in Finance from NYU, which informs her deep expertise in financial strategy and organizational development, and brings a unique perspective shaped by her early career as a professional dancer.",
        "Mara will help guide EAR's fiscal sponsorship programming, offering strategic insight and mentorship to help ensure sustainable and effective support for artists and organizations. She is excited to share her knowledge in support of EAR's mission.",
      ],
    },
    {
      name: "LYNN WICHERN",
      role: "FOUNDING ADVISORY BOARD MEMBER",
      imageSrc: "/images/about-us/lynn-headshot.png",
      imageAlt: "Portrait of Lynn Wichern",
      imagePosition: "right",
      paragraphs: [
        "Lynn Wichern is a principal of Wichern Arts Services LLC. Her leadership roles have included Executive Director of the Merce Cunningham Trust, CFO of the Cunningham Dance Foundation, Finance Director of the Mark Morris Dance Group, and Fiscal Administrator for the Foundation for Independent Artists, a corporate conduit for unincorporated artists. She holds BA and MA degrees in Dance from the University of Iowa and an MFA in Dance and Theater from Case Western Reserve University. She has taught at the University of Virginia, Illinois Wesleyan University, and Drake University, and has choreographed and performed with EMR Dance Company and Wichern/Wolfson Dance & Music.",
      ],
    },
    {
      name: "CHLOE SONNET BROWN",
      role: "FOUNDING ADVISORY BOARD MEMBER",
      imageSrc: "/images/about-us/chloe-headshot.png",
      imageAlt: "Portrait of Chloe Sonnet Brown",
      imagePosition: "left",
      paragraphs: [
        "Chloe Sonnet Brown (she/they) is a dance artist and ceramicist based in New York City. Chloe trained at Pacific Northwest Ballet and holds a Certificate in Contemporary Dance from Alonzo King's Lines Ballet Training Program. Chloe was a company dancer with Donald Byrd's Spectrum Dance Theatre from 2021-2023, and has performed the works of Sidra Bell, Alonzo King, Gregory Dawson, Mark Bankin, Elena Dahn, and more. Choreographic commissions include Alibi for the Despairs for Westfest Dance Festival, Joan's After for Body Artifacts, and Terra for Counterpointe 11.",
        "After directing Ancient Lakes Dance Festival in Washington State for 2 years, Chloe began producing site specific performances in New York City through Body Artifacts. Body Artifacts curates conceptual dance performances in unique spaces across New York City. Their first production, Angel Visits, was featured by Dance Enthusiast and Culturebot.",
      ],
    },
    {
      name: "NATALIA NIKITIN",
      role: "FOUNDING ADVISORY BOARD MEMBER",
      imageSrc: "/images/about-us/natalia-headshot.png",
      imageAlt: "Portrait of Natalia Nikitin",
      imagePosition: "right",
      paragraphs: [
        "Natalia Nikitin (she/her) is a New York-based freelance choreographer, performer, and arts administrator. As director of Natalia Nikitin & Dancers, her project-based company has performed at Mark Morris Dance Center, Dixon Place, Manhattan Movement Arts Center, The Wild Project, Brooklyn Art Haus, and Spark Theater. Natalia holds a BFA in dance from NYU Tisch and a minor in sociology, graduating with honors ('24). She has performed works by Jose Limon, Andrea Miller (GALLIM), Roni Koresh, Lydia Johnson, and Felipe Escalante (Tabula Rasa Dance Theater). Currently, she is performing as a company member for Lydia Johnson Dance and in her own works. Natalia is a Development Apprentice at New York City Center.",
      ],
    },
  ] satisfies AboutUsProfile[],
} as const

export const aboutUsStayInTouch = {
  heading: "STAY IN TOUCH",
  cardTitle: "JOIN OUR MAILING LIST",
  ctaLabel: "Subscribe to newsletters",
} as const
