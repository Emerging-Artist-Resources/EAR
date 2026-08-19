import { 
  fetchSavedEventsFromDb,
  saveListingRepo,
  unsaveListingRepo,
  updateAttendanceStatusRepo,
  checkListingSavedRepo,
  getActivityOverviewRepo,
  fetchServiceInquiriesForUser,
  fetchFiscalSponsorshipDashboardRepo,
  fetchPaidDonationsForExportRepo,
  fetchPaidDonationReceiptRepo,
  updateDonationPageRepo,
  FISCAL_SPONSORSHIP_DONATIONS_PAGE_SIZE,
} from "./repository";
import {
  ProfileSavedEventsFilter,
  SavedEvent,
  SavedListing,
  ActivityOverview,
  ServiceInquirySummary,
  FiscalSponsorshipDashboard,
  FiscalSponsorshipDashboardQuery,
} from "./types";
import type { DonationPageSettings } from "@/lib/donations/donationPageSettings";
import type { UpdateDonationPageData } from "@/lib/validations/donation-page";
import { toDonationPagePersistPayload } from "@/lib/validations/donation-page";
import { buildDonationExportFileName } from "@/lib/donations/donation-export-rows";
import { buildDonationsWorkbook } from "@/lib/donations/donation-excel-export";
import { renderDonationReceiptPdf, toDonationReceiptPdfInput } from "@/lib/pdf/donation-receipt";
import { buildDonationPdfAttachmentName } from "@/lib/email/sendInternalDonationEmail";
import { formatReceiptDate, unixSecondsFromIso } from "@/lib/stripe/donationHelpers";
import { sendProfileEmail } from "@/lib/email/sendProfileEmail";
import { greetingNameFromFullName } from "@/lib/names/person-name";
import { getPublicAppUrl } from "@/lib/config/app-url";
import { normalizeSupabaseVerifyActionLink } from "@/lib/supabase/normalizeVerifyActionLink";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function getSavedEvents(
  userId: string,
  filter: ProfileSavedEventsFilter
): Promise<SavedEvent[]> {
  const events = await fetchSavedEventsFromDb(userId, filter);
  return events;
}

export async function saveListing(userId: string, listingId: string): Promise<SavedListing> {
  return await saveListingRepo(userId, listingId);
}

export async function unsaveListing(userId: string, listingId: string): Promise<void> {
  return await unsaveListingRepo(userId, listingId);
}

export async function updateAttendanceStatus(
  userId: string,
  listingId: string,
  status: "attended" | "missed" | null
): Promise<SavedListing> {
  return await updateAttendanceStatusRepo(userId, listingId, status);
}

export async function checkListingSaved(userId: string, listingId: string): Promise<boolean> {
  return await checkListingSavedRepo(userId, listingId);
}

export async function getActivityOverview(userId: string): Promise<ActivityOverview> {
  return await getActivityOverviewRepo(userId);
}

export async function getServiceInquiries(userId: string): Promise<ServiceInquirySummary[]> {
  return await fetchServiceInquiriesForUser(userId);
}

export async function getFiscalSponsorshipDashboard(
  userId: string,
  options?: FiscalSponsorshipDashboardQuery,
): Promise<FiscalSponsorshipDashboard> {
  const page = options?.page ?? 0;
  const limit = options?.limit ?? FISCAL_SPONSORSHIP_DONATIONS_PAGE_SIZE;
  return fetchFiscalSponsorshipDashboardRepo(userId, {
    page,
    limit,
    dateFrom: options?.dateFrom,
    dateTo: options?.dateTo,
  });
}

export async function exportFiscalSponsorshipDonations(
  userId: string,
  options?: Pick<FiscalSponsorshipDashboardQuery, "dateFrom" | "dateTo">,
): Promise<{ bytes: Buffer; fileName: string }> {
  const donations = await fetchPaidDonationsForExportRepo(userId, {
    dateFrom: options?.dateFrom,
    dateTo: options?.dateTo,
  });
  const bytes = await buildDonationsWorkbook(donations);
  return {
    bytes,
    fileName: buildDonationExportFileName(options?.dateFrom, options?.dateTo),
  };
}

export async function getDonationReceiptPdf(
  userId: string,
  donationId: string,
): Promise<{ bytes: Uint8Array; fileName: string }> {
  const row = await fetchPaidDonationReceiptRepo(userId, donationId);
  if (!row) {
    throw new Error("Donation receipt not found");
  }

  const createdUnix = unixSecondsFromIso(row.created_at);
  const input = toDonationReceiptPdfInput(row, {
    dateLabel: formatReceiptDate(createdUnix),
  });
  const bytes = await renderDonationReceiptPdf(input);
  return {
    bytes,
    fileName: buildDonationPdfAttachmentName(input.artistDisplayName, createdUnix),
  };
}

export async function updateDonationPage(
  userId: string,
  data: UpdateDonationPageData,
): Promise<DonationPageSettings> {
  const payload = toDonationPagePersistPayload(data);
  return updateDonationPageRepo(userId, payload);
}

export async function sendNewProfileAdminEmail(
  profile: {
    name: string | null
    email: string | null
    profile_type: string | null
    organization_name?: string | null
  },
  userId: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!adminEmail) {
    console.warn("[EMAIL] ADMIN_NOTIFICATION_EMAIL not set, skipping admin notification")
    return
  }

  const userName = profile.name?.trim() || "Unknown User"
  const userEmail = profile.email?.trim() || "No email provided"
  const profileType = profile.profile_type || "unknown"
  const organizationName = profile.organization_name?.trim() || ""

  await sendProfileEmail("admin-new-user", {
    to: adminEmail,
    userName,
    userEmail,
    profileType,
    organizationName,
    userId,
  })
}

export async function sendProfileApprovalEmail(
  userName: string | null,
  userEmail: string | null,
  userId: string
): Promise<void> {
  if (!userEmail) {
    console.warn("[EMAIL] User email not available, skipping profile approval email")
    return
  }

  const firstName = greetingNameFromFullName(userName)

  await sendProfileEmail("profile-approved", {
    to: userEmail,
    firstName,
    userName: userName || "there",
    userId,
  })
}

export async function sendEmailVerificationEmail(
  userEmail: string,
  userName: string | null
): Promise<void> {
  const supabase = getSupabaseServiceClient()

  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    console.warn(
      "[EMAIL] NEXT_PUBLIC_APP_URL is unset in production; auth links fall back to default origin. Set NEXT_PUBLIC_APP_URL to your public site URL."
    )
  }

  const baseUrl = getPublicAppUrl()
  const redirectTo = `${baseUrl}/auth/callback`

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: userEmail,
    options: {
      redirectTo,
    },
  })

  if (error || !data?.properties?.action_link) {
    console.error("[EMAIL] Failed to generate email verification link:", error)
    throw new Error("Failed to generate email verification link")
  }

  const verificationUrl = normalizeSupabaseVerifyActionLink(data.properties.action_link)
  const firstName = greetingNameFromFullName(userName)

  await sendProfileEmail("email-confirmation", {
    to: userEmail,
    firstName,
    verificationUrl,
  })
}

export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string | null
): Promise<void> {
  const supabase = getSupabaseServiceClient()
  const baseUrl = getPublicAppUrl()
  const redirectTo = `${baseUrl}/auth/callback/recovery`

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: userEmail,
    options: {
      redirectTo,
    },
  })

  if (error || !data?.properties?.action_link) {
    console.error("[EMAIL] Failed to generate password reset link:", error)
    throw new Error("Failed to generate password reset link")
  }

  const resetUrl = normalizeSupabaseVerifyActionLink(data.properties.action_link)
  const firstName = greetingNameFromFullName(userName)

  await sendProfileEmail("password-reset", {
    to: userEmail,
    firstName,
    resetUrl,
  })
}
