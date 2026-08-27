/**
 * Profile Email Functions
 * 
 * Sends transactional emails for profile-related events using Postmark.
 * 
 * For documentation on adding new email types, see: EMAIL_SYSTEM.md
 * 
 * @see EMAIL_SYSTEM.md for setup, usage, and best practices
 */

import { getPublicAppUrl } from "@/lib/config/app-url"
import { SIGNUP_ACCOUNT_FEEDBACK_FORM_URL } from "@/lib/config/site-contact"
import { postmarkClient } from "./postmark"

type ProfileEmailType =
  | "admin-new-user"
  | "profile-approved"
  | "email-confirmation"
  | "password-reset"
  | "welcome-email"
  | "donation-page-updated-admin"

type SendAdminNewUserEmailArgs = {
  to: string
  userName: string
  userEmail: string
  profileType: string
  /** Optional; Postmark template may show {{organization_name}} */
  organizationName?: string
  userId: string
}

type SendProfileApprovedEmailArgs = {
  to: string
  firstName: string
  userName: string
  userId: string
}

type SendEmailConfirmationArgs = {
  to: string
  firstName: string
  verificationUrl: string
}

type SendPasswordResetArgs = {
  to: string
  firstName: string
  resetUrl: string
}

type SendWelcomeEmailArgs = {
  to: string
  firstName: string
}

/** TemplateModel already built by `buildDonationPageUpdatedAdminTemplateModel`. */
type SendDonationPageUpdatedAdminEmailArgs = {
  to: string
  templateModel: Record<string, string>
}

type SendProfileEmailArgs =
  | SendAdminNewUserEmailArgs
  | SendProfileApprovedEmailArgs
  | SendEmailConfirmationArgs
  | SendPasswordResetArgs
  | SendWelcomeEmailArgs
  | SendDonationPageUpdatedAdminEmailArgs

export async function sendProfileEmail(
  type: ProfileEmailType,
  args: SendProfileEmailArgs
): Promise<unknown> {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log(`[EMAIL] Email sending disabled. Would send ${type} to ${args.to}`)
    return
  }

  if (!postmarkClient) {
    throw new Error(
      "Postmark client not initialized. POSTMARK_SERVER_TOKEN is missing."
    )
  }

  const baseUrl = getPublicAppUrl()
  if (!process.env.POSTMARK_FROM_NAME || !process.env.POSTMARK_FROM_EMAIL) {
    const missing = []
    if (!process.env.POSTMARK_FROM_NAME) missing.push("POSTMARK_FROM_NAME")
    if (!process.env.POSTMARK_FROM_EMAIL) missing.push("POSTMARK_FROM_EMAIL")
    
    throw new Error(
      `Missing Postmark sender environment variables: ${missing.join(", ")}. ` +
      "Please set both POSTMARK_FROM_NAME and POSTMARK_FROM_EMAIL in your environment."
    )
  }
  
  const fromAddress = `${process.env.POSTMARK_FROM_NAME} <${process.env.POSTMARK_FROM_EMAIL}>`

  let templateModel: Record<string, string>

  if (type === "admin-new-user") {
    const adminArgs = args as SendAdminNewUserEmailArgs
    templateModel = {
      user_name: adminArgs.userName || "Unknown User",
      user_email: adminArgs.userEmail || "No email provided",
      profile_type: adminArgs.profileType || "unknown",
      organization_name: adminArgs.organizationName?.trim() || "",
      cta_url: `${baseUrl}/admin/profiles`,
    }
  } else if (type === "profile-approved") {
    const approvedArgs = args as SendProfileApprovedEmailArgs
    templateModel = {
      first_name: approvedArgs.firstName,
      user_name: approvedArgs.userName,
      cta_url: `${baseUrl}/profile`,
    }
  } else if (type === "email-confirmation") {
    const confirmationArgs = args as SendEmailConfirmationArgs
    templateModel = {
      first_name: confirmationArgs.firstName,
      verification_url: confirmationArgs.verificationUrl,
    }
  } else if (type === "welcome-email") {
    const welcomeArgs = args as SendWelcomeEmailArgs
    templateModel = {
      first_name: welcomeArgs.firstName,
      dashboard_url: `${baseUrl}/profile`,
      feedback_url: SIGNUP_ACCOUNT_FEEDBACK_FORM_URL,
    }
  } else if (type === "donation-page-updated-admin") {
    const donationPageArgs = args as SendDonationPageUpdatedAdminEmailArgs
    templateModel = donationPageArgs.templateModel
  } else {
    const resetArgs = args as SendPasswordResetArgs
    templateModel = {
      first_name: resetArgs.firstName,
      reset_url: resetArgs.resetUrl,
    }
  }

  const emailData = {
    From: fromAddress,
    To: args.to,
    TemplateAlias: type,
    TemplateModel: templateModel,
  }

  return await postmarkClient.sendEmailWithTemplate(emailData)
}
