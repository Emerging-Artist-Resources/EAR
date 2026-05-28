export const documentationHero = {
  title: "Photography & Videography",
} as const

export type DocumentationServiceBlock = {
  id: string
  title: string
  priceLabel: string
  body: string
  imagePosition: "left" | "right"
}

export const documentationServiceRows: DocumentationServiceBlock[] = [
  {
    id: "photography",
    title: "Photography Services",
    priceLabel: "STARTING AT $60/HR",
    body: "High-quality photography designed to document your work with clarity and intention. Whether photographing performances, rehearsals, or events, the focus is on capturing documentary style images reflective of each moment.",
    imagePosition: "left",
  },
  {
    id: "videography",
    title: "Videography Services",
    priceLabel: "STARTING AT $60/HR",
    body: "High-quality single-camera videography offering both stationary and following-style film. Ideal for documenting performances, rehearsals, and events with a clear, professional perspective that preserves the art.",
    imagePosition: "right",
  },
  {
    id: "package",
    title: "Photo & Video Package",
    priceLabel: "STARTING AT $110/HR",
    body: "A combined photo & video service for those looking to document their work comprehensively. This package provides a full visual record that can be used for promotion, archives, and future opportunities.",
    imagePosition: "left",
  },
]

export const documentationBio = {
  sectionTitle: "Behind the lens",
  studioName: "Samzen Studios",
  paragraphs: [
    "Samzen (she/her) is the in-house photographer for EAR and a multidisciplinary visual artist based in New York City. Working across both film and digital formats, her practice centers on capturing movement, atmosphere, and authentic human connection through an observational, documentary-style approach.",
    "Her journey into photography began in college, where she spent extensive time in the darkroom developing 35mm film. Working with film introduced her to photography in a hands-on, intentional way and became the foundation for her visual style. Before moving fully into visual production, Samzen spent over a decade involved in music, an experience that continues to inform the way she works within collaborative and creative environments.",
    "Her work spans editorials, behind-the-scenes documentation, short films, music videos, and creative campaigns. Alongside photography, she has contributed to productions through creative direction, casting, set coordination, and visual development, bringing a collaborative and intuitive perspective to every project.",
  ],
} as const

export const DOCUMENTATION_INQUIRY_HREF = "/services/photography-videography/inquiry" as const
