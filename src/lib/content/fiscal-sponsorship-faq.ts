export type FiscalSponsorshipFaqAnswer =
  | { type: "paragraphs"; paragraphs: readonly string[] }
  | { type: "list"; intro?: string; items: readonly string[] }

export type FiscalSponsorshipFaqItem = {
  number: string
  question: string
  answer: FiscalSponsorshipFaqAnswer
}

export type FiscalSponsorshipFaqSection = {
  id: string
  title: string
  items: readonly FiscalSponsorshipFaqItem[]
}

export const fiscalSponsorshipFaqPage = {
  title: "Fiscal Sponsorship FAQ",
} as const

export const FISCAL_SPONSORSHIP_FAQ_APPLY_IMAGE = "/images/faq/faq-final-v2.jpg" as const

export const fiscalSponsorshipFaqApply = {
  title: "Apply to Fiscal Sponsorship Here",
  buttonLabel: "Inquire here",
  imageAlt:
    "A motion-blurred black and white photograph of a person jumping energetically, conveying a sense of movement and performance.",
} as const

export const fiscalSponsorshipFaqSections: readonly FiscalSponsorshipFaqSection[] = [
  {
    id: "general",
    title: "General Fiscal Sponsorship",
    items: [
      {
        number: "01",
        question: "What is fiscal sponsorship?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "Emerging Artist Resources (EAR) Fiscal Sponsorship allows artists and creative projects to operate under the 501(c)(3) tax-exempt status of an established nonprofit organization. This means artists can apply for grants and accept tax-deductible donations without having to form their own nonprofit. EAR provides the administrative framework and financial oversight, freeing artists to focus on what matters most: the creative work.",
          ],
        },
      },
      {
        number: "02",
        question: "Why do emerging artists, performing artists, and artists in general need a fiscal sponsor?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "Many artists create work that serves the public through performances, exhibitions, education, and community engagement, but they don't have access to the funding systems designed for nonprofits. Fiscal sponsorship bridges that gap. It allows artists to operate under the 501(c)(3) tax-exempt status of an established nonprofit. This means artists now have access to grants, can receive tax-deductible donations, and build credibility with funders, all without needing to create and manage a nonprofit organization. For emerging artists especially, it provides critical infrastructure, legitimacy, and support at a stage when resources are often limited and the focus needs to remain on developing their work.",
          ],
        },
      },
    ],
  },
  {
    id: "ear-program",
    title: "EAR Fiscal Sponsorship",
    items: [
      {
        number: "03",
        question: "Who is EAR's program for?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "This program is designed for emerging artists, collectives, and independent projects seeking financial infrastructure and administrative support.",
          ],
        },
      },
      {
        number: "04",
        question: "What type of fiscal sponsorship does EAR offer?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "EAR offers Type-C fiscal sponsorship. Type-C sponsorship, also known as a regranting model, is a structure where a nonprofit (like EAR) receives funds on behalf of an artist or project and then distributes those funds to their respective artist. Through this relationship, artists are able to raise tax-deductible donations and apply for funding opportunities using EAR's 501(c)(3) status. Type C allows artists to still operate as an independent project while partnering with EAR solely for fundraising and grant access.",
          ],
        },
      },
      {
        number: "05",
        question: "What are the benefits of Type-C fiscal sponsorship?",
        answer: {
          type: "list",
          intro: "Type-C fiscal sponsorship is designed to be flexible and low barrier, making it especially useful for emerging artists. Key benefits include:",
          items: [
            "Access to funding — Raise tax-deductible donations and apply for grants that require a 501(c)(3) partner.",
            "Creative autonomy — You maintain control over your project's vision, direction, and execution.",
            "Simplified structure — No need to start or manage your own nonprofit organization.",
            "Regular payouts — Funds are regranted to you on a weekly basis, providing consistent access to support.",
            "Flexible administration — You manage your own budget and expense tracking, with fewer reporting requirements than more formal sponsorship models.",
          ],
        },
      },
      {
        number: "06",
        question: "What type of projects does EAR sponsor?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "This program is designed for emerging artists, collectives, and independent projects seeking financial infrastructure and administrative support. We sponsor a wide range of creative projects, including dance, theater, film, multimedia work, performance series, and interdisciplinary collaborations. We prioritize projects that are artist-led, community-oriented, and aligned with our mission of supporting emerging voices.",
          ],
        },
      },
      {
        number: "07",
        question: "How much does fiscal sponsorship cost?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "EAR operates on a percentage-based administrative fee model of 5.5%. This fee supports the infrastructure required to manage funds, maintain compliance, and provide ongoing support.",
          ],
        },
      },
      {
        number: "08",
        question: "What does the 5.5% fee cover?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "EAR operates on a percentage-based administrative fee model of 5.5%. This fee supports the infrastructure required to manage funds, maintain compliance, and provide ongoing support.",
          ],
        },
      },
      {
        number: "09",
        question: "What are the responsibilities of a sponsored artist?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "Sponsored artists are responsible for using funds in alignment with their proposed project, maintaining clear communication with EAR, and fulfilling any required reporting for grants or donations. Artists may also be asked to credit EAR as their fiscal sponsor in relevant materials.",
          ],
        },
      },
      {
        number: "10",
        question: "Are there restrictions on how funds can be used?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "Funds must be used in support of the sponsored project and in alignment with nonprofit guidelines. During onboarding, we provide clear information about eligible expenses to ensure compliance while maintaining flexibility for your creative needs.",
          ],
        },
      },
      {
        number: "11",
        question: "Will being fiscally sponsored affect taxes?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "Yes. Funds you receive through fiscal sponsorship are generally considered taxable income.",
            "If your project receives $600 or more in funds from EAR, you will be issued a 1099-MISC form to report this income. While donations made to your project are tax-deductible for the donor, the funds you receive are still treated as income and may be subject to taxes.",
            "If you have questions, we recommend reaching out to us to better understand how this applies to your specific situation.",
          ],
        },
      },
      {
        number: "12",
        question: "Who has ownership of the sponsored artists work?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "Artists retain full creative and intellectual ownership of their work at all times. EAR's role is to provide financial and administrative support, not to control artistic direction.",
          ],
        },
      },
      {
        number: "13",
        question: "Does EAR help with fundraising?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "While fundraising support isn't included by default, we're here to help when you need it. You can book hourly services with us for personalized support—whether you're building a fundraising strategy, planning a campaign, or refining your approach to donors.",
          ],
        },
      },
      {
        number: "14",
        question: "Can I leave the program when my project ends?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "Yes. That said, there is no reason to leave! With no overhead fees, there is no cost to keeping your account open in case you choose to continue fundraising or receive future donations. If your project concludes or you decide to move on, we will work with you to properly close out your sponsorship, ensuring all funds are distributed and reporting is complete.",
          ],
        },
      },
    ],
  },
  {
    id: "application",
    title: "Application Process",
    items: [
      {
        number: "15",
        question: "How do I apply? What is the process?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "To apply, you will submit a short application outlining your project, goals, and funding needs. Selected applicants may be invited for a follow-up conversation before a final decision is made. Once accepted, we guide you through a simple onboarding process to get you set up and ready to fundraise.",
          ],
        },
      },
      {
        number: "16",
        question: "How long does approval take?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "We aim to have the approval process completed within 1–2 weeks. After you submit an inquiry form, we'll reach out to schedule an initial call.",
            "Once your call is complete, you'll receive a contract. As soon as the contract is signed and your W-9 is submitted, you'll be able to begin accepting donations within 24 hours.",
            "If you're working with a specific grant deadline, please let us know—we'll do our best to accommodate your timeline.",
          ],
        },
      },
      {
        number: "17",
        question: "Is there a minimum or maximum budget requirement?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "There is no strict minimum or maximum budget. We work with projects at various stages and scales, from early development to fully realized productions.",
          ],
        },
      },
      {
        number: "18",
        question: "Do I need to have a legal entity to apply?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "No, projects do not need to be incorporated or have a formal legal structure to apply for Type-C fiscal sponsorship. EAR can sponsor individuals, collectives, and unincorporated projects.",
          ],
        },
      },
      {
        number: "19",
        question: "Can I apply for grants immediately after being accepted?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "Yes. Once your sponsorship agreement is finalized, you can begin applying for grants and receiving tax-deductible donations right away.",
          ],
        },
      },
    ],
  },
  {
    id: "misc",
    title: "Misc. Fiscal Sponsorship",
    items: [
      {
        number: "20",
        question: "Does EAR provide insurance coverage?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "At this time, EAR does not automatically provide insurance coverage for sponsored projects. We're happy to offer guidance on obtaining insurance if your project requires it.",
          ],
        },
      },
      {
        number: "21",
        question: "Do you offer additional services beyond fiscal sponsorship?",
        answer: {
          type: "paragraphs",
          paragraphs: [
            "Yes. EAR also offers additional support services, including photography, videography, and creative consulting. These services are optional and can be tailored to your project's needs.",
          ],
        },
      },
    ],
  },
]
