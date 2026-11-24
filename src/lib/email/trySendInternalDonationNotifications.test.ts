import type Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"
import { trySendInternalDonationNotifications } from "./trySendInternalDonationNotifications"

const mockSend = jest.fn()

jest.mock("@/lib/email/sendInternalDonationEmail", () => ({
  DONATION_TEMPLATE_ARTIST: "donation-notification-artist",
  DONATION_TEMPLATE_ADMIN: "donation-notification-admin",
  buildDonationPdfAttachmentName: () => "receipt.pdf",
  sendInternalDonationTemplatedEmail: (...args: unknown[]) => mockSend(...args),
}))

jest.mock("@/lib/pdf/donation-receipt", () => ({
  renderDonationReceiptPdf: async () => new Uint8Array([1]),
  toDonationReceiptPdfInput: () => ({}),
}))

type DonationState = {
  id: string
  donor_name: string
  donor_email: string
  message: string
  recipient_name: string
  recipient_user_id: string | null
  amount: number
  payment_status: string
  internal_notification_sent_at: string | null
  cover_card_fee: boolean
  cover_fiscal_fee: boolean
  designation_option_id: string | null
  designation_label_snapshot: string | null
}

function donationClient(donation: DonationState) {
  const updates: Record<string, unknown>[] = []
  const client = {
    updates,
    from(table: string) {
      if (table !== "donations") {
        throw new Error(`unexpected table ${table}`)
      }
      return {
        select() {
          return {
            eq() {
              return {
                single: async () => ({ data: donation, error: null }),
              }
            },
          }
        },
        update(patch: Record<string, unknown>) {
          const builder = {
            eq() {
              return builder
            },
            is() {
              return builder
            },
            select: async () => {
              updates.push(patch)
              if (donation.internal_notification_sent_at) {
                return { data: [], error: null }
              }
              donation.internal_notification_sent_at = (patch.internal_notification_sent_at as string | null) ?? null
              return { data: [{ id: donation.id }], error: null }
            },
            then(
              onfulfilled?: (value: { data: null; error: null }) => unknown,
              onrejected?: (reason: unknown) => unknown,
            ) {
              updates.push(patch)
              donation.internal_notification_sent_at = (patch.internal_notification_sent_at as string | null) ?? null
              return Promise.resolve({ data: null, error: null }).then(onfulfilled, onrejected)
            },
          }
          return builder
        },
      }
    },
  }
  return client
}

function paidDonation(sentAt: string | null): DonationState {
  return {
    id: "don-1",
    donor_name: "Ada",
    donor_email: "ada@example.com",
    message: "thanks",
    recipient_name: "EAR",
    recipient_user_id: null,
    amount: 2500,
    payment_status: "paid",
    internal_notification_sent_at: sentAt,
    cover_card_fee: false,
    cover_fiscal_fee: false,
    designation_option_id: null,
    designation_label_snapshot: null,
  }
}

const session = {
  id: "cs_1",
  amount_total: 2500,
  created: 1_700_000_000,
  customer_email: "ada@example.com",
  metadata: {},
} as Stripe.Checkout.Session

describe("trySendInternalDonationNotifications", () => {
  const originalAdminEmail = process.env.ADMIN_EMAIL

  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@example.com"
    delete process.env.DISABLE_EMAILS
    mockSend.mockReset()
  })

  afterEach(() => {
    if (originalAdminEmail === undefined) delete process.env.ADMIN_EMAIL
    else process.env.ADMIN_EMAIL = originalAdminEmail
  })

  it("does not send when internal_notification_sent_at is set, which is best-effort dedupe rather than delivery confirmation", async () => {
    const client = donationClient(paidDonation("2026-01-01T00:00:00.000Z"))

    await expect(
      trySendInternalDonationNotifications({
        supabase: client as unknown as SupabaseClient,
        donationId: "don-1",
        session,
      }),
    ).resolves.toBeUndefined()

    expect(mockSend).not.toHaveBeenCalled()
    expect(client.updates).toHaveLength(0)
  })

  it("clears the claim timestamp and throws when sending fails so the webhook can retry", async () => {
    const donation = paidDonation(null)
    const client = donationClient(donation)
    mockSend.mockRejectedValue(new Error("postmark down"))

    await expect(
      trySendInternalDonationNotifications({
        supabase: client as unknown as SupabaseClient,
        donationId: "don-1",
        session,
      }),
    ).rejects.toThrow("postmark down")

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(donation.internal_notification_sent_at).toBeNull()
    expect(client.updates.some((patch) => patch.internal_notification_sent_at === null)).toBe(true)
  })
})
