export const fiscalServicesHero = {
  title: "Fiscal Services",
} as const

export const FISCAL_SERVICES_INQUIRY_HREF = "/services/fiscal-services/inquiry" as const

export const FISCAL_SERVICES_HERO_IMAGE = "/images/fiscal-service/hero-image.jpg" as const

export const FISCAL_SERVICES_FINAL_IMAGE = "/images/fiscal-service/final-image.JPG" as const

export type FiscalServiceAction =
  | { type: "link"; label: string; href: string }
  | { type: "static"; label: string }

export type FiscalServiceBlock = {
  id: string
  title: string
  subheading: string
  servicesIntro: string
  services: readonly string[]
  action: FiscalServiceAction
}

export const fiscalServiceSections: FiscalServiceBlock[] = [
  {
    id: "hourly",
    title: "Hourly Fiscal Services",
    subheading:
      "Receive guidance on selecting and implementing financial management tools.",
    servicesIntro: "Services are customizable to include:",
    services: [
      "Accounting software setup and configuration",
      "Payroll processor selection and setup",
      "Financial reporting systems",
      "Donation tracking systems",
      "Expense management workflows",
      "Recordkeeping best practices",
      "Grant Preparation Assistance",
    ],
    action: {
      type: "link",
      label: "Inquire here",
      href: FISCAL_SERVICES_INQUIRY_HREF,
    },
  },
  {
    id: "mentorship",
    title: "Fiscal Mentorship | Coming Soon",
    subheading:
      "Build the foundation for a financially organized creative practice or organization. A one-on-one or small-group mentorship program focused on establishing the financial and operational systems needed for sustainability, so you can focus on your artistry.",
    servicesIntro: "Services are customizable to include:",
    services: [
      "Designing a Chart of Accounts (COA)",
      "Choosing an Accounting System",
      "Understanding financial responsibilities for your staff & independent contractors",
      "Insurance Compliance",
      "Selecting donation and fundraising platforms",
      "Establishing organizational bank accounts",
      "Creating operating and project budgets",
      "Financial policies and procedures",
      "Revenue tracking and reporting systems",
    ],
    action: {
      type: "static",
      label: "Application opens June 15th",
    },
  },
  {
    id: "bookkeeping",
    title: "Bookkeeping | Coming Soon",
    subheading: "Professional bookkeeping services tailored to artists, fiscally sponsored projects, and small nonprofit organizations.",
    servicesIntro: "Services Include:",
    services: [
      "Establishment of a Chart of Accounts (ongoing modifications)",
      "Posting of receipts and disbursements from bank account",
      "Posting of credit card charges and reconciliation of monthly statement",
      "Financial reporting to include: Profit & Loss, Profit & Loss Detail, Year-to-Date vs. Budget, Balance Sheet",
      "Accounts Payable and Accounts Receivable (Pledges/Grants Receivable)",
      "Reconciliation of Bank, Brokerage, and third-party Accounts (PayPal, Stripe, etc.)",
      "Facilitation and administration of Fiscal Year-End Reporting",
    ],
    action: {
      type: "link",
      label: "Inquire here",
      href: FISCAL_SERVICES_INQUIRY_HREF,
    },
  },
]

export const fiscalServicesCustomSupport = {
  title: "Need Customized Support?",
  body: "We also offer individualized services tailored to the unique needs of artists, collectives, and small nonprofit organizations. Contact us to discuss your project and goals.",
  actionLabel: "Contact us",
} as const
