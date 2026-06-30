import type { FiscalSponsorshipStatus } from "@/lib/types/fiscal-sponsorship";

export {
  FISCAL_SPONSORSHIP_INQUIRY_HREF,
  FISCAL_SPONSORSHIP_PAGE_HREF,
} from "./fiscal-sponsorship";

export const fiscalSponsorshipDashboard = {
  none: {
    title: "Get fiscal sponsorship through EAR",
    body: "Partner with EAR to receive tax-deductible donations and access grants without forming your own nonprofit.",
    primaryCta: "Learn about fiscal sponsorship",
    secondaryCta: "Apply now",
  },
  pending: {
    title: "Application under review",
    body: "Your fiscal sponsorship application is being reviewed. We'll reach out when there's an update.",
    secondaryCta: "View application",
  },
  approved: {
    donationsHeading: "Received donations",
    donationsAmountHelper:
      "Amount reflects what the donor was charged, including any fees they chose to cover.",
    emptyDonations: "No donations yet. Share your donation link to get started.",
    missingSlug: "Your fiscal sponsorship is approved, but your public donation link is not set up yet. Contact EAR to configure your page.",
    donationColumns: {
      donor: "Donor",
      email: "Email",
      date: "Date",
      amount: "Amount",
    },
  },
  paused: {
    title: "Fiscal sponsorship paused",
    body: "Your fiscal sponsorship is temporarily paused. New donations are not being accepted at this time.",
  },
  revoked: {
    title: "Fiscal sponsorship revoked",
    body: "Your fiscal sponsorship has been revoked. New donations are not being accepted.",
  },
  donationLink: {
    heading: "Your donation link",
    copyLabel: "Copy link",
    copiedLabel: "Copied!",
    openLabel: "Open page",
  },
  donationSummary: {
    heading: "Donation summary",
    totalLabel: "Total received",
    countLabel: "Donations",
    averageLabel: "Average donation",
  },
} as const;

export const FISCAL_STATUS_LABELS: Record<FiscalSponsorshipStatus, string> = {
  none: "Not enrolled",
  pending: "Pending review",
  approved: "Approved",
  paused: "Paused",
  revoked: "Revoked",
};

export const FISCAL_STATUS_BADGE_CLASS: Record<FiscalSponsorshipStatus, string> = {
  none: "bg-gray-100 text-gray-700",
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-green-50 text-green-800",
  paused: "bg-amber-50 text-amber-800",
  revoked: "bg-red-50 text-red-800",
};

/** Shared hover styles for fiscal sponsorship dashboard actions. */
export const fiscalDashboardButtonClass = {
  secondary: "hover:bg-brand-secondary-hover active:bg-secondary/80",
} as const;
