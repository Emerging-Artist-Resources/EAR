import type { SupabaseClient } from "@supabase/supabase-js"
import type Stripe from "stripe"
import { generateDonationPdf } from "@/lib/pdf/generateDonationPdf"
import {
  type DonationAmountRow,
  formatCurrencyFromCents,
  formatReceiptDate,
  resolveAmountCents,
  resolveCreatedUnix,
  resolveRecipientEmail,
} from "@/lib/stripe/donationHelpers"
import {
  DONATION_TEMPLATE_ADMIN,
  DONATION_TEMPLATE_ARTIST,
  sendInternalDonationTemplatedEmail,
} from "@/lib/email/sendInternalDonationEmail"

type DonationRow = DonationAmountRow & {
  recipient_user_id: string | null
  internal_notification_sent_at: string | null
}

function maskEmailForLog(email: string): string {
  const t = email.trim()
  const at = t.indexOf("@")
  if (at <= 0) return "***"
  const local = t.slice(0, at)
  const domain = t.slice(at + 1)
  const vis = local.slice(0, Math.min(3, local.length))
  return `${vis}***@${domain}`
}

function logPrefix(donationId: string): string {
  return `[donationId=${donationId}]`
}

export async function trySendInternalDonationNotifications({
  supabase,
  donationId,
  session,
  paymentIntent,
}: {
  supabase: SupabaseClient
  donationId: string
  session?: Stripe.Checkout.Session
  paymentIntent?: Stripe.PaymentIntent
}): Promise<void> {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log(`${logPrefix(donationId)} Internal donation notification skipped (DISABLE_EMAILS)`)
    return
  }

  const { data: donation, error: fetchError } = await supabase
    .from("donations")
    .select(
      "id, donor_name, donor_email, message, recipient_name, recipient_user_id, amount, payment_status, internal_notification_sent_at",
    )
    .eq("id", donationId)
    .single()

  if (fetchError || !donation) {
    console.error(`${logPrefix(donationId)} Internal notification: donation not found`, { error: fetchError })
    return
  }

  const row = donation as DonationRow

  if (row.payment_status !== "paid") {
    console.log(`${logPrefix(donationId)} Internal notification skipped: payment not paid`, {
      payment_status: row.payment_status,
    })
    return
  }

  if (row.internal_notification_sent_at) {
    console.log(`${logPrefix(donationId)} Internal notification skipped: already sent`)
    return
  }

  const adminEmailRaw = process.env.ADMIN_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? ""
  const adminEmail = adminEmailRaw.trim()
  const hasAdmin = adminEmail.length > 0
  if (!hasAdmin) {
    console.warn(`${logPrefix(donationId)} Internal notification: missing admin email (ADMIN_EMAIL / ADMIN_NOTIFICATION_EMAIL)`)
  }

  let artistEmail = ""
  if (row.recipient_user_id) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", row.recipient_user_id)
        .maybeSingle()

      if (profileError) {
        console.error(`${logPrefix(donationId)} Failed to fetch artist email`, { error: profileError })
      } else {
        artistEmail = (profile?.email ?? "").trim()
        if (!artistEmail) {
          console.warn(`${logPrefix(donationId)} Internal notification: artist profile has no email`)
        }
      }
    } catch (e) {
      console.error(`${logPrefix(donationId)} Failed to fetch artist email`, e)
    }
  }

  const hasArtist = artistEmail.length > 0

  if (!hasArtist && !hasAdmin) {
    console.warn(`${logPrefix(donationId)} No recipients for internal donation notification`)
    return
  }

  const isoNow = new Date().toISOString()
  const { data: claimedRows, error: claimError } = await supabase
    .from("donations")
    .update({ internal_notification_sent_at: isoNow })
    .eq("id", donationId)
    .eq("payment_status", "paid")
    .is("internal_notification_sent_at", null)
    .select("id")

  if (claimError) {
    console.error(`${logPrefix(donationId)} Internal notification: claim failed`, { error: claimError })
    return
  }

  if (!claimedRows?.length) {
    console.log(`${logPrefix(donationId)} Internal notification skipped: claim not acquired (race or already sent)`)
    return
  }

  const amountCents = resolveAmountCents(session, paymentIntent, row)
  const createdUnix = resolveCreatedUnix(session, paymentIntent)
  const dateStr = formatReceiptDate(createdUnix)
  const amountStr = formatCurrencyFromCents(amountCents)

  const donorEmailResolved = resolveRecipientEmail(session, row)
  const donorName =
    row.donor_name?.trim() ||
    session?.customer_details?.name?.trim() ||
    donorEmailResolved.split("@")[0] ||
    "there"

  const artistDisplayForTemplates = row.recipient_name?.trim() || "the artist"
  const adminTemplateArtistName = row.recipient_user_id ? artistDisplayForTemplates : "EAR"

  const msg = row.message?.trim()

  const artistTemplateModel: Record<string, unknown> = {
    artist_name: artistDisplayForTemplates,
    donor_name: donorName,
    amount: amountStr,
    date: dateStr,
  }
  if (msg) {
    artistTemplateModel.message = msg
  }

  const adminTemplateModel: Record<string, unknown> = {
    artist_name: adminTemplateArtistName,
    donor_name: donorName,
    donor_email: donorEmailResolved || "",
    amount: amountStr,
    date: dateStr,
  }
  if (msg) {
    adminTemplateModel.message = msg
  }

  const pdfBytes = await generateDonationPdf({
    donorName,
    artistDisplayName: artistDisplayForTemplates,
    amountCents,
    dateLabel: dateStr,
    donationId,
  })

  try {
    if (hasArtist) {
      await sendInternalDonationTemplatedEmail({
        to: artistEmail,
        templateAlias: DONATION_TEMPLATE_ARTIST,
        templateModel: artistTemplateModel,
        pdfBytes,
      })
      console.log(
        `${logPrefix(donationId)} Sent artist internal notification`,
        { recipient: maskEmailForLog(artistEmail) },
      )
    }

    if (hasAdmin) {
      await sendInternalDonationTemplatedEmail({
        to: adminEmail,
        templateAlias: DONATION_TEMPLATE_ADMIN,
        templateModel: adminTemplateModel,
        pdfBytes,
      })
      console.log(`${logPrefix(donationId)} Sent admin internal notification`, {
        recipient: maskEmailForLog(adminEmail),
      })
    }
  } catch (error) {
    await supabase.from("donations").update({ internal_notification_sent_at: null }).eq("id", donationId)
    console.error(`${logPrefix(donationId)} Internal notification send failed`, { error })
  }
}
