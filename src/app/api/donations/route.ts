import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/helpers"
import {
  handleApiError,
  createSuccessResponse,
  validateRequestBody,
  createErrorResponse,
  ErrorCodes,
} from "@/lib/api/utils"
import { createDonationRequestSchema } from "@/lib/validations/donations"
import { computeGrossChargeCents } from "@/lib/payments/computeDonationCharge"
import { donationStripeAccountForRecipient } from "@/lib/payments/donationStripeAccount"
import {
  getDonationRecipientByUserId,
  isApprovedRecipient,
} from "@/features/profile/server/artistDonationRecipient"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import {
  DESIGNATION_STALE_OPTION_MESSAGE,
  parseActiveDonationDesignationConfig,
} from "@/lib/donations/donationDesignationConfig"
import { resolveDonationRecipientDisplayName } from "@/lib/profile/donationRecipientDisplayName"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const donationData = validateRequestBody(body, createDonationRequestSchema)

    const auth = await getAuthenticatedUser()
    /** Service role: RLS is not applied on this insert. `donor_id` is set from the session when present. */
    const supabase = getSupabaseServiceClient()

    let recipientUserId: string | null = donationData.recipient_user_id ?? null
    let recipientName: string | null = null
    let designationOptionId: string | null = null
    let designationLabelSnapshot: string | null = null

    const designationInput = donationData.designation_option_id?.trim() ?? ""

    if (recipientUserId) {
      const recipientProfile = await getDonationRecipientByUserId(recipientUserId)

      if (!recipientProfile) {
        return createErrorResponse(ErrorCodes.BAD_REQUEST, "Recipient not found", undefined, 400)
      }

      if (!isApprovedRecipient(recipientProfile)) {
        return createErrorResponse(
          ErrorCodes.FORBIDDEN,
          "This artist is not currently eligible to receive donations",
          undefined,
          403,
        )
      }

      if (donationData.recipient_slug) {
        const normalized = donationData.recipient_slug.trim().toLowerCase()
        if (!recipientProfile.slug || recipientProfile.slug !== normalized) {
          return createErrorResponse(
            ErrorCodes.BAD_REQUEST,
            "Recipient does not match the donation link",
            undefined,
            400,
          )
        }
      }

      recipientName = resolveDonationRecipientDisplayName({
        name: recipientProfile.name,
        organization_name: recipientProfile.organization_name,
        profile_type: recipientProfile.profile_type,
      })

      const activeConfig = parseActiveDonationDesignationConfig(recipientProfile.donation_designation_config)
      if (!activeConfig) {
        if (designationInput) {
          return createErrorResponse(ErrorCodes.BAD_REQUEST, "Invalid designation.", undefined, 400)
        }
      } else {
        if (!designationInput) {
          return createErrorResponse(ErrorCodes.BAD_REQUEST, "Please choose a designation.", undefined, 400)
        }
        const match = activeConfig.options.find((o) => o.id === designationInput)
        if (!match) {
          return createErrorResponse(ErrorCodes.BAD_REQUEST, DESIGNATION_STALE_OPTION_MESSAGE, undefined, 400)
        }
        designationOptionId = match.id
        designationLabelSnapshot = match.label
      }
    } else if (donationData.recipient_slug || donationData.recipient_name) {
      return createErrorResponse(
        ErrorCodes.BAD_REQUEST,
        "Invalid recipient parameters for a generic donation",
        undefined,
        400,
      )
    } else if (designationInput) {
      return createErrorResponse(ErrorCodes.BAD_REQUEST, "Invalid designation.", undefined, 400)
    }

    const baseGiftCents = donationData.amount
    const coverCard = Boolean(donationData.cover_card_fee)
    const coverFiscal = recipientUserId ? Boolean(donationData.cover_fiscal_fee) : false
    const chargedCents = computeGrossChargeCents(baseGiftCents, coverFiscal, coverCard)
    const stripeAccount = donationStripeAccountForRecipient(recipientUserId)

    const { data, error } = await supabase
      .from("donations")
      .insert({
        base_gift_cents: baseGiftCents,
        amount: chargedCents,
        fee_model_version: 2,
        stripe_account: stripeAccount,
        currency: "usd",
        payment_status: "requires_payment",
        donor_id: auth?.user.id ?? null,
        donor_name: donationData.donor_name?.trim() || null,
        donor_email: donationData.donor_email,
        message: donationData.message?.trim() || null,
        recipient_user_id: recipientUserId,
        recipient_name: recipientName,
        cover_card_fee: coverCard,
        cover_fiscal_fee: coverFiscal,
        designation_option_id: designationOptionId,
        designation_label_snapshot: designationLabelSnapshot,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to create donation:", error)
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to create donation" } },
        { status: 500 },
      )
    }

    return createSuccessResponse({ id: data.id }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
