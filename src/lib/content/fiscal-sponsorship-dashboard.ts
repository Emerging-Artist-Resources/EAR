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
    emptyFilteredDonations: "No donations in this date range.",
    missingSlug: "Your fiscal sponsorship is approved, but your public donation link is not set up yet. Contact EAR to configure your page.",
    dateFilter: {
      fromLabel: "From",
      toLabel: "To",
      clearLabel: "Clear dates",
    },
    exportExcel: {
      label: "Export to Excel",
      sheetName: "Donations",
      designation: "Designation",
      message: "Message",
    },
    donationColumns: {
      donor: "Donor",
      email: "Email",
      date: "Date",
      amount: "Amount",
      stripeFee: "Stripe fee",
      fiscalFee: "5.5%",
      net: "Net",
      receipt: "Receipt",
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
  customizeDonationPage: {
    trigger: "Customize donation page",
    modalTitle: "Customize donation page",
    saveLabel: "Save changes",
    savingLabel: "Saving…",
    cancelLabel: "Cancel",
    saveSuccess: "Donation page updated",
    message: {
      title: "Message",
      description: "Optional text shown on your public donation page below the headline.",
      label: "Page message",
      placeholder: "Share why you're fundraising or how donations will be used…",
    },
    presets: {
      title: "Donation amount presets",
      description:
        "Quick-select amounts donors see on your page. Enter 1–6 unique whole-dollar values of $1 or more. Empty rows are ignored when you save.",
      addLabel: "Add amount",
      removeLabel: "Remove",
      defaultHint: "When unset, donors see the default quick-select amounts on the public donate page.",
    },
    designation: {
      title: "Donation designation",
      description: "Optional dropdown so donors can direct their gift to a project or fund.",
      enabledLabel: "Show designation dropdown",
      fieldLabel: "Dropdown label",
      fieldPlaceholder: "e.g. Designate your gift to",
      optionLabel: "Option",
      optionPlaceholder: "e.g. General support",
      addOptionLabel: "Add option",
      removeOptionLabel: "Remove option",
    },
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
