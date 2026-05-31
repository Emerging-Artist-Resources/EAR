export const documentationHero = {
  title: "Photography & Videography",
} as const

export const DOCUMENTATION_PHOTOGRAPHY_IMAGE =
  "/images/photo-video-service/photo-image-v2.JPG" as const

export const DOCUMENTATION_VIDEOGRAPHY_IMAGE =
  "/images/photo-video-service/video-image.JPG" as const

export const DOCUMENTATION_PACKAGE_IMAGE =
  "/images/photo-video-service/package-image.jpeg" as const

export const DOCUMENTATION_BIO_SECTION_SRC = "/images/photo-video-service/behind-sam.jpg" as const

export const DOCUMENTATION_BIO_PORTRAIT_SRC =
  "/images/photo-video-service/sam-image.jpeg" as const

/** Native pixel dimensions — use for sharp rendering at natural aspect ratio. */
export const DOCUMENTATION_BIO_PORTRAIT = {
  src: DOCUMENTATION_BIO_PORTRAIT_SRC,
  alt: "Samzen, photographer at Samzen Studios",
  width: 1284,
  height: 1794,
} as const

export type DocumentationServiceBlock = {
  id: string
  title: string
  priceLabel: string
  body: string
  imageSrc: string
  imageAlt: string
  imagePosition: "left" | "right"
}

export const documentationServiceRows: DocumentationServiceBlock[] = [
  {
    id: "photography",
    title: "Photography Services",
    priceLabel: "STARTING AT $60/HR",
    body: "High-quality photography designed to document your work with clarity and intention. Whether photographing performances, rehearsals, or events, the focus is on capturing documentary style images reflective of each moment.",
    imageSrc: DOCUMENTATION_PHOTOGRAPHY_IMAGE,
    imageAlt: "Documentary-style performance photography",
    imagePosition: "left",
  },
  {
    id: "videography",
    title: "Videography Services",
    priceLabel: "STARTING AT $60/HR",
    body: "High-quality single-camera videography offering both stationary and following-style film. Ideal for documenting performances, rehearsals, and events with a clear, professional perspective that preserves the art.",
    imageSrc: DOCUMENTATION_VIDEOGRAPHY_IMAGE,
    imageAlt: "Performance videography in rehearsal",
    imagePosition: "right",
  },
  {
    id: "package",
    title: "Photo & Video Package",
    priceLabel: "STARTING AT $110/HR",
    body: "A combined photo & video service for those looking to document their work comprehensively. This package provides a full visual record that can be used for promotion, archives, and future opportunities.",
    imageSrc: DOCUMENTATION_PACKAGE_IMAGE,
    imageAlt: "Combined photo and video documentation of a performance",
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

export const DOCUMENTATION_HERO_IMAGE = "/images/photo-video-service/hero-image.JPG" as const