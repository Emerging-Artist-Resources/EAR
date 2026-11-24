/**
 * @jest-environment node
 *
 * Real Postgres/PostgREST coverage for webhook claims, the claim migration, and
 * payment recovery. Containers are disposable and are not the working Supabase
 * database. Stripe signature verification and Postmark are stubbed.
 */
import { NextRequest } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { POST } from "./route"
import {
  claimWebhookEvent,
  completeWebhookEvent,
  failWebhookEvent,
  type WebhookClaim,
} from "@/lib/stripe/webhookEventClaim"
import {
  HISTORICAL_EVENT_ID,
  HISTORICAL_LISTING_ID,
  startDisposableStack,
  type DisposableStack,
} from "./integration/harness"

const mockSend = jest.fn()
const mockState: { client: SupabaseClient | null } = { client: null }

jest.mock("@/lib/supabase/service", () => ({
  getSupabaseServiceClient: () => {
    if (!mockState.client) throw new Error("Disposable Supabase client is not ready")
    return mockState.client
  },
}))

jest.mock("@/lib/config/env", () => ({
  getServerEnv: () => ({
    STRIPE_SECRET_KEY: "sk_test_integration",
    STRIPE_WEBHOOK_SECRET: "whsec_integration",
    STRIPE_SPONSOR_WEBHOOK_SECRET: "whsec_integration_sponsor",
  }),
}))

jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: (body: string) => JSON.parse(body),
    },
  })),
)

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}))

jest.mock("@/lib/launch-flags", () => ({
  isSentryDisabled: () => true,
}))

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

process.env.DISABLE_EMAILS = "false"
process.env.ADMIN_EMAIL = "admin@example.com"

const WRITE_FAIL_LISTING = "11111111-1111-4111-8111-111111111112"
const COMPLETE_FAIL_LISTING = "11111111-1111-4111-8111-111111111113"
const REFUND_LISTING = "11111111-1111-4111-8111-111111111114"
const OVERLAP_LISTING = "11111111-1111-4111-8111-111111111115"
const APPROVED_LISTING = "11111111-1111-4111-8111-111111111116"
const OLD_SHAPE_LISTING = "11111111-1111-4111-8111-111111111117"
const NOTIFY_DONATION = "22222222-2222-4222-8222-222222222223"
const OLD_TOKEN = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1"
const EXPLICIT_TOKEN = "cccccccc-cccc-4ccc-8ccc-ccccccccccc1"
const EXPLICIT_CLAIMED_AT = "2026-01-02T03:04:05.000Z"

let stack: DisposableStack

beforeAll(async () => {
  stack = await startDisposableStack()
  mockState.client = stack.supabase
}, 300_000)

afterAll(async () => {
  await stack?.stop()
}, 60_000)

beforeEach(async () => {
  mockState.client = stack.supabase
  mockSend.mockReset()
  mockSend.mockResolvedValue(undefined)
  process.env.DISABLE_EMAILS = "false"
  process.env.ADMIN_EMAIL = "admin@example.com"
  await stack.resetGates()
})

function claimInput(eventId: string) {
  return {
    eventId,
    eventType: "checkout.session.completed",
    listingId: null,
    donationId: null,
    stripeCreated: new Date().toISOString(),
  }
}

function checkoutEvent(
  id: string,
  metadata: Record<string, string>,
  options?: { sessionId?: string; paymentIntent?: string; created?: number },
) {
  return {
    id,
    object: "event",
    type: "checkout.session.completed",
    created: options?.created ?? Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: options?.sessionId ?? `cs_${id}`,
        object: "checkout.session",
        payment_status: "paid",
        payment_intent: options?.paymentIntent ?? `pi_${id}`,
        amount_total: 2500,
        metadata,
      },
    },
  }
}

function refundEvent(id: string, paymentIntentId: string, chargeId: string, created = Math.floor(Date.now() / 1000)) {
  return {
    id,
    object: "event",
    type: "charge.refunded",
    created,
    data: {
      object: {
        id: chargeId,
        object: "charge",
        payment_intent: paymentIntentId,
      },
    },
  }
}

function deliver(event: unknown) {
  return POST(
    new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=test" },
      body: JSON.stringify(event),
    }),
  )
}

async function expectStatus(response: Response, status: number) {
  if (response.status !== status) {
    throw new Error(`expected HTTP ${status}, received ${response.status}: ${await response.text()}`)
  }
}

async function insertListing(
  id: string,
  fields: { status?: string; paymentStatus?: string; paymentIntentId?: string | null } = {},
) {
  await stack.pg.query(
    `INSERT INTO listings (
       id, type, status, contact_name, contact_email,
       payment_required, payment_amount, payment_currency, payment_status,
       stripe_payment_intent_id
     ) VALUES (
       $1, 'performance', $2::public.listing_status, 'Test Contact', 'listing@example.com',
       true, 2500, 'usd', $3::public.payment_status, $4
     )`,
    [id, fields.status ?? "draft", fields.paymentStatus ?? "requires_payment", fields.paymentIntentId ?? null],
  )
}

async function readListing(id: string) {
  const result = await stack.pg.query<{
    status: string
    payment_status: string
    stripe_payment_intent_id: string | null
    updated_at: Date
  }>(
    `SELECT status::text, payment_status::text, stripe_payment_intent_id, updated_at
     FROM listings WHERE id = $1`,
    [id],
  )
  return result.rows[0]
}

async function readEvent(id: string) {
  const result = await stack.pg.query<{
    status: string
    claim_token: string | null
    claimed_at: Date | null
    completed_at: Date | null
    created_at: Date
  }>(
    `SELECT status, claim_token::text, claimed_at, completed_at, created_at
     FROM stripe_webhook_events WHERE id = $1`,
    [id],
  )
  return result.rows[0]
}

async function armFailure(name: string) {
  await stack.pg.query(
    `INSERT INTO test_failures (name, remaining) VALUES ($1, 1)
     ON CONFLICT (name) DO UPDATE SET remaining = 1`,
    [name],
  )
}

describe("stripe webhook retry integration", () => {
  it("backfills existing rows as completed and does not replay them", async () => {
    const definition = await stack.pg.query<{ column_default: string; check_def: string; status_comment: string }>(`
      SELECT
        (SELECT column_default FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'stripe_webhook_events' AND column_name = 'status') AS column_default,
        (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'stripe_webhook_events_status_check') AS check_def,
        (SELECT col_description('public.stripe_webhook_events'::regclass, att.attnum)
          FROM pg_attribute att
          WHERE att.attrelid = 'public.stripe_webhook_events'::regclass AND att.attname = 'status') AS status_comment
    `)
    expect(definition.rows[0]?.column_default).toContain("completed")
    expect(definition.rows[0]?.check_def).toContain("processing")
    expect(definition.rows[0]?.check_def).toContain("failed")
    expect(definition.rows[0]?.check_def).toContain("completed")
    expect(definition.rows[0]?.status_comment).toContain("Defaults to completed")

    const historical = await stack.pg.query<{ backfilled: boolean; status: string; claim_token: string | null }>(
      `SELECT status, claim_token::text, completed_at = created_at AS backfilled
       FROM stripe_webhook_events WHERE id = $1`,
      [HISTORICAL_EVENT_ID],
    )
    expect(historical.rows[0]).toMatchObject({
      status: "completed",
      claim_token: null,
      backfilled: true,
    })

    const before = await readListing(HISTORICAL_LISTING_ID)
    const response = await deliver(
      checkoutEvent(HISTORICAL_EVENT_ID, { entity_type: "listing", entity_id: HISTORICAL_LISTING_ID }),
    )
    await expectStatus(response, 200)
    const after = await readListing(HISTORICAL_LISTING_ID)
    expect(after).toEqual(before)
    expect(after?.payment_status).toBe("requires_payment")
    expect((await readEvent(HISTORICAL_EVENT_ID))?.claim_token).toBeNull()
  })

  it("keeps an old insert shape completed without claim columns or replay", async () => {
    await insertListing(OLD_SHAPE_LISTING)
    await stack.pg.query(
      `INSERT INTO stripe_webhook_events (id, type, listing_id, donation_id, stripe_created)
       VALUES ('evt_old_shape', 'checkout.session.completed', $1, NULL, now())`,
      [OLD_SHAPE_LISTING],
    )

    const stored = await readEvent("evt_old_shape")
    expect(stored).toMatchObject({
      status: "completed",
      claim_token: null,
      claimed_at: null,
      completed_at: null,
    })

    const claim = await claimWebhookEvent(stack.supabase, claimInput("evt_old_shape"))
    expect(claim).toEqual({ outcome: "completed" })
    const before = await readListing(OLD_SHAPE_LISTING)
    await expectStatus(
      await deliver(checkoutEvent("evt_old_shape", { entity_type: "listing", entity_id: OLD_SHAPE_LISTING })),
      200,
    )
    expect(await readListing(OLD_SHAPE_LISTING)).toEqual(before)
    expect((await readEvent("evt_old_shape"))?.claim_token).toBeNull()
  })

  it("retains an explicit processing token and claimed_at", async () => {
    await stack.pg.query(
      `INSERT INTO stripe_webhook_events (
         id, type, listing_id, donation_id, stripe_created, status, claim_token, claimed_at, completed_at
       ) VALUES (
         'evt_explicit', 'checkout.session.completed', NULL, NULL, now(),
         'processing', $1::uuid, $2::timestamptz, NULL
       )`,
      [EXPLICIT_TOKEN, EXPLICIT_CLAIMED_AT],
    )
    const stored = await stack.pg.query<{ matches: boolean }>(
      `SELECT status = 'processing'
         AND claim_token = $1::uuid
         AND claimed_at = $2::timestamptz
         AND completed_at IS NULL AS matches
       FROM stripe_webhook_events WHERE id = 'evt_explicit'`,
      [EXPLICIT_TOKEN, EXPLICIT_CLAIMED_AT],
    )
    expect(stored.rows[0]?.matches).toBe(true)
  })

  it("rejects statuses outside the claim check", async () => {
    await expect(
      stack.pg.query(
        `INSERT INTO stripe_webhook_events (id, type, status)
         VALUES ('evt_bad_status', 'checkout.session.completed', 'queued')`,
      ),
    ).rejects.toMatchObject({ code: "23514" })

    await stack.pg.query(
      `INSERT INTO stripe_webhook_events (id, type, status, claim_token, claimed_at)
       VALUES ('evt_bad_update', 'checkout.session.completed', 'processing', $1::uuid, now())`,
      [OLD_TOKEN],
    )
    await expect(
      stack.pg.query(`UPDATE stripe_webhook_events SET status = 'bogus' WHERE id = 'evt_bad_update'`),
    ).rejects.toMatchObject({ code: "23514" })
    expect((await readEvent("evt_bad_update"))?.status).toBe("processing")
  })

  it("claims a new event as processing", async () => {
    const claim = await claimWebhookEvent(stack.supabase, claimInput("evt_new"))
    expect(claim.outcome).toBe("claimed")
    if (claim.outcome !== "claimed") return
    const stored = await readEvent("evt_new")
    expect(stored?.status).toBe("processing")
    expect(stored?.claim_token).toBe(claim.claimToken)
    expect(stored?.claimed_at).not.toBeNull()
  })

  it("lets exactly one of two concurrent claims own the event", async () => {
    await stack.pg.query("UPDATE test_barrier SET active = true, goal = 2 WHERE id = 1")
    await stack.pg.query("SELECT pg_advisory_lock(91, 1)")
    const pending = Promise.all([
      claimWebhookEvent(stack.supabase, claimInput("evt_concurrent")),
      claimWebhookEvent(stack.supabase, claimInput("evt_concurrent")),
    ])
    let results: WebhookClaim[] | undefined
    try {
      await stack.pg.query("SELECT public.wait_for_advisory_waiters(91, 1, 2)")
      await stack.pg.query("SELECT pg_advisory_unlock(91, 1)")
      results = await pending
    } finally {
      await stack.pg.query("UPDATE test_barrier SET active = false WHERE id = 1")
      await stack.pg.query("SELECT pg_advisory_unlock_all()")
      if (!results) await Promise.allSettled([pending])
    }

    const claimed = results.filter((result) => result.outcome === "claimed")
    const waiting = results.filter((result) => result.outcome === "in_progress")
    expect(results.map((result) => result.outcome).sort()).toEqual(["claimed", "in_progress"])
    expect(claimed).toHaveLength(1)
    expect(waiting).toHaveLength(1)
    const stored = await readEvent("evt_concurrent")
    expect(stored?.status).toBe("processing")
    expect(stored?.claim_token).toBe(claimed[0] && claimed[0].outcome === "claimed" ? claimed[0].claimToken : null)
  })

  it("reclaims a failed event immediately", async () => {
    await stack.pg.query(
      `INSERT INTO stripe_webhook_events (id, type, status, claim_token, claimed_at)
       VALUES ('evt_failed', 'checkout.session.completed', 'failed', $1::uuid, now())`,
      [OLD_TOKEN],
    )
    const claim = await claimWebhookEvent(stack.supabase, claimInput("evt_failed"))
    expect(claim.outcome).toBe("claimed")
    if (claim.outcome !== "claimed") return
    const stored = await readEvent("evt_failed")
    expect(stored?.status).toBe("processing")
    expect(stored?.claim_token).toBe(claim.claimToken)
    expect(stored?.claim_token).not.toBe(OLD_TOKEN)
  })

  it("refuses to take over a fresh processing claim", async () => {
    await stack.pg.query(
      `INSERT INTO stripe_webhook_events (id, type, status, claim_token, claimed_at)
       VALUES ('evt_fresh', 'checkout.session.completed', 'processing', $1::uuid, now())`,
      [OLD_TOKEN],
    )
    const claim = await claimWebhookEvent(stack.supabase, claimInput("evt_fresh"))
    expect(claim).toEqual({ outcome: "in_progress" })
    const stored = await readEvent("evt_fresh")
    expect(stored?.status).toBe("processing")
    expect(stored?.claim_token).toBe(OLD_TOKEN)
  })

  it("reclaims a stale processing claim and ignores the old token", async () => {
    await stack.pg.query(
      `INSERT INTO stripe_webhook_events (id, type, status, claim_token, claimed_at)
       VALUES ('evt_stale', 'checkout.session.completed', 'processing', $1::uuid, now() - interval '16 minutes')`,
      [OLD_TOKEN],
    )
    const claim = await claimWebhookEvent(stack.supabase, claimInput("evt_stale"))
    expect(claim.outcome).toBe("claimed")
    if (claim.outcome !== "claimed") return

    expect(await completeWebhookEvent(stack.supabase, "evt_stale", OLD_TOKEN)).toBe("lost_ownership")
    expect(await failWebhookEvent(stack.supabase, "evt_stale", OLD_TOKEN)).toBe("lost_ownership")

    const stored = await readEvent("evt_stale")
    expect(stored?.status).toBe("processing")
    expect(stored?.claim_token).toBe(claim.claimToken)
    expect(stored?.claim_token).not.toBe(OLD_TOKEN)

    expect(await completeWebhookEvent(stack.supabase, "evt_stale", claim.claimToken)).toBe("updated")
    expect((await readEvent("evt_stale"))?.status).toBe("completed")
  })

  it("skips a completed event", async () => {
    await stack.pg.query(
      `INSERT INTO stripe_webhook_events (id, type, status, completed_at)
       VALUES ('evt_done', 'checkout.session.completed', 'completed', now())`,
    )
    expect(await claimWebhookEvent(stack.supabase, claimInput("evt_done"))).toEqual({ outcome: "completed" })
    const stored = await readEvent("evt_done")
    expect(stored?.status).toBe("completed")
    expect(stored?.claim_token).toBeNull()
    expect(stored?.claimed_at).toBeNull()
  })

  it("retries a failed payment write and then marks the listing paid", async () => {
    await insertListing(WRITE_FAIL_LISTING)
    await armFailure("listing_paid")
    const event = checkoutEvent("evt_write_fail", { entity_type: "listing", entity_id: WRITE_FAIL_LISTING })

    await expectStatus(await deliver(event), 500)
    expect(await readListing(WRITE_FAIL_LISTING)).toMatchObject({
      payment_status: "requires_payment",
      status: "draft",
    })
    expect((await readEvent("evt_write_fail"))?.status).toBe("failed")

    await expectStatus(await deliver(event), 200)
    expect(await readListing(WRITE_FAIL_LISTING)).toMatchObject({
      payment_status: "paid",
      status: "pending",
    })
    expect((await readEvent("evt_write_fail"))?.status).toBe("completed")
  })

  it("finishes a donation notification on retry after the send throws", async () => {
    mockSend.mockReset()
    mockSend.mockRejectedValueOnce(new Error("postmark down"))
    mockSend.mockResolvedValue(undefined)
    await stack.pg.query(
      `INSERT INTO donations (
         id, amount, currency, payment_status, stripe_checkout_session_id,
         donor_name, donor_email, recipient_name, base_gift_cents, stripe_account
       ) VALUES (
         $1, 2500, 'usd', 'requires_payment', 'cs_notify',
         'Donor', 'donor@example.com', 'EAR', 2000, 'ear'
       )`,
      [NOTIFY_DONATION],
    )
    const event = checkoutEvent(
      "evt_notify",
      { entity_type: "donation", entity_id: NOTIFY_DONATION },
      { sessionId: "cs_notify", paymentIntent: "pi_notify" },
    )

    await expectStatus(await deliver(event), 500)
    const afterFailure = await stack.pg.query<{ payment_status: string; internal_notification_sent_at: Date | null }>(
      `SELECT payment_status::text, internal_notification_sent_at FROM donations WHERE id = $1`,
      [NOTIFY_DONATION],
    )
    expect(afterFailure.rows[0]).toMatchObject({
      payment_status: "paid",
      internal_notification_sent_at: null,
    })
    expect((await readEvent("evt_notify"))?.status).toBe("failed")

    await expectStatus(await deliver(event), 200)
    const afterRetry = await stack.pg.query<{ payment_status: string; internal_notification_sent_at: Date | null }>(
      `SELECT payment_status::text, internal_notification_sent_at FROM donations WHERE id = $1`,
      [NOTIFY_DONATION],
    )
    expect(afterRetry.rows[0]?.payment_status).toBe("paid")
    expect(afterRetry.rows[0]?.internal_notification_sent_at).not.toBeNull()
    expect((await readEvent("evt_notify"))?.status).toBe("completed")
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it("recovers when completion tracking fails after payment succeeds", async () => {
    await insertListing(COMPLETE_FAIL_LISTING)
    await armFailure("event_completed")
    const event = checkoutEvent("evt_complete_fail", {
      entity_type: "listing",
      entity_id: COMPLETE_FAIL_LISTING,
    })

    await expectStatus(await deliver(event), 500)
    const paid = await readListing(COMPLETE_FAIL_LISTING)
    expect(paid).toMatchObject({ payment_status: "paid", status: "pending" })
    expect((await readEvent("evt_complete_fail"))?.status).toBe("failed")

    await expectStatus(await deliver(event), 200)
    const retried = await readListing(COMPLETE_FAIL_LISTING)
    expect(retried).toMatchObject({ payment_status: "paid", status: "pending" })
    expect(retried?.updated_at).toEqual(paid?.updated_at)
    expect((await readEvent("evt_complete_fail"))?.status).toBe("completed")
  })

  it("keeps an unmatched refund retryable beyond 15 minutes", async () => {
    const created = Math.floor(Date.now() / 1000) - 16 * 60
    const event = refundEvent("evt_refund_late", "pi_refund_late", "ch_refund_late", created)

    await expectStatus(await deliver(event), 500)
    await expectStatus(await deliver(event), 500)
    expect((await readEvent("evt_refund_late"))?.status).toBe("failed")

    await insertListing(REFUND_LISTING, { paymentStatus: "paid", paymentIntentId: "pi_refund_late", status: "pending" })
    await expectStatus(await deliver(event), 200)
    expect(await readListing(REFUND_LISTING)).toMatchObject({ payment_status: "refunded", status: "pending" })
    expect((await readEvent("evt_refund_late"))?.status).toBe("completed")
  })

  it("leaves payment refunded when checkout and refund overlap", async () => {
    await insertListing(OVERLAP_LISTING, { paymentIntentId: "pi_overlap" })
    await stack.pg.query("SELECT pg_advisory_lock(91, 2)")
    await stack.pg.query("UPDATE test_gate SET armed = true WHERE name = 'listing_read'")
    await stack.pg.query("ALTER TABLE listings ENABLE ROW LEVEL SECURITY")
    await stack.pg.query(`
      CREATE POLICY listings_it_select ON listings
        FOR SELECT TO service_role
        USING (public.listing_read_gate(id));
      CREATE POLICY listings_it_update ON listings
        FOR UPDATE TO service_role
        USING (true)
        WITH CHECK (true);
    `)

    const checkout = deliver(
      checkoutEvent("evt_overlap_pay", { entity_type: "listing", entity_id: OVERLAP_LISTING }, {
        paymentIntent: "pi_overlap",
      }),
    )
    let finished = false
    try {
      await stack.pg.query("SELECT public.wait_for_advisory_waiters(91, 2, 1)")
      await stack.pg.query("UPDATE test_gate SET armed = false WHERE name = 'listing_read'")
      const refund = await deliver(refundEvent("evt_overlap_refund", "pi_overlap", "ch_overlap"))
      await expectStatus(refund, 200)
      await stack.pg.query("SELECT pg_advisory_unlock(91, 2)")
      await expectStatus(await checkout, 200)
      finished = true
    } finally {
      await stack.pg.query("UPDATE test_gate SET armed = false WHERE name = 'listing_read'")
      await stack.pg.query("SELECT pg_advisory_unlock_all()")
      if (!finished) await Promise.allSettled([checkout])
      await stack.resetGates()
    }

    expect(await readListing(OVERLAP_LISTING)).toMatchObject({
      payment_status: "refunded",
      status: "draft",
    })
    expect((await readEvent("evt_overlap_pay"))?.status).toBe("completed")
    expect((await readEvent("evt_overlap_refund"))?.status).toBe("completed")
  })

  it("does not reset an approved listing to pending when checkout is replayed", async () => {
    await insertListing(APPROVED_LISTING, {
      status: "approved",
      paymentStatus: "paid",
      paymentIntentId: "pi_approved",
    })
    const before = await readListing(APPROVED_LISTING)
    const event = checkoutEvent(
      "evt_approved",
      { entity_type: "listing", entity_id: APPROVED_LISTING },
      { paymentIntent: "pi_approved" },
    )

    await expectStatus(await deliver(event), 200)
    expect(await readListing(APPROVED_LISTING)).toEqual(before)

    await expectStatus(await deliver(event), 200)
    expect(await readListing(APPROVED_LISTING)).toEqual(before)
    expect((await readEvent("evt_approved"))?.status).toBe("completed")
  })
})
