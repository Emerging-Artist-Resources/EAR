/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { POST, maxDuration } from "./route"
import {
  completeWebhookEvent,
  failWebhookEvent,
  STALE_CLAIM_MS,
  WEBHOOK_ROUTE_MAX_DURATION_SECONDS,
} from "@/lib/stripe/webhookEventClaim"

const mockNotify = jest.fn()
const mockState: { client: SupabaseClient | null } = { client: null }

jest.mock("@/lib/supabase/service", () => ({
  getSupabaseServiceClient: () => mockState.client,
}))

jest.mock("@/lib/email/trySendInternalDonationNotifications", () => ({
  trySendInternalDonationNotifications: (...args: unknown[]) => mockNotify(...args),
}))

jest.mock("@/lib/config/env", () => ({
  getServerEnv: () => ({
    STRIPE_SECRET_KEY: "sk_test",
    STRIPE_WEBHOOK_SECRET: "whsec_ear",
    STRIPE_SPONSOR_WEBHOOK_SECRET: "whsec_sponsor",
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

const LISTING_ID = "11111111-1111-4111-8111-111111111111"
const DONATION_ID = "22222222-2222-4222-8222-222222222222"

type Row = Record<string, unknown>

type Filter =
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "neq"; column: string; value: unknown }
  | { kind: "lt"; column: string; value: string }
  | { kind: "is"; column: string; value: unknown }

type QueryResult = { data: unknown; error: { code?: string; message: string } | null }

class MemoryDb {
  tables: Record<string, Row[]> = {
    stripe_webhook_events: [],
    listings: [],
    donations: [],
  }
  applied: { table: string; patch: Row; matched: number }[] = []
  insertEventError: { message: string; code: string } | null = null
  listingReadError: { message: string } | null = null
  listingUpdateError: { message: string } | null = null
  failNextEventCompletion = false
  beforePaidListingUpdate: (() => void) | null = null
  blockPaidListingUpdate: { entered: () => void; wait: Promise<void> } | null = null
  paidListingUpdateBlocked = false

  client(): SupabaseClient {
    return { from: (table: string) => new Query(this, table) } as unknown as SupabaseClient
  }

  row(table: string, id: string): Row | undefined {
    return this.tables[table].find((entry) => entry.id === id)
  }

  paidUpdates(table: string, matched?: number) {
    return this.applied.filter((entry) => {
      if (entry.table !== table || entry.patch.payment_status !== "paid") return false
      return matched === undefined || entry.matched === matched
    })
  }
}

class Query implements PromiseLike<QueryResult> {
  private op: "none" | "select" | "insert" | "update" = "none"
  private filters: Filter[] = []
  private patch: Row | null = null
  private insertRow: Row | null = null
  private returning = false

  constructor(
    private db: MemoryDb,
    private table: string,
  ) {}

  insert(row: Row) {
    this.op = "insert"
    this.insertRow = { ...row }
    return this
  }

  update(patch: Row) {
    this.op = "update"
    this.patch = { ...patch }
    return this
  }

  select() {
    if (this.op === "none") this.op = "select"
    else this.returning = true
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ kind: "eq", column, value })
    return this
  }

  neq(column: string, value: unknown) {
    this.filters.push({ kind: "neq", column, value })
    return this
  }

  lt(column: string, value: string) {
    this.filters.push({ kind: "lt", column, value })
    return this
  }

  is(column: string, value: unknown) {
    this.filters.push({ kind: "is", column, value })
    return this
  }

  maybeSingle() {
    return this.one(true)
  }

  single() {
    return this.one(false)
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private rows(): Row[] {
    if (!this.db.tables[this.table]) this.db.tables[this.table] = []
    return this.db.tables[this.table]
  }

  private matching(): Row[] {
    return this.rows().filter((row) =>
      this.filters.every((filter) => {
        const value = row[filter.column]
        if (filter.kind === "eq" || filter.kind === "is") return value === filter.value
        if (filter.kind === "neq") return value !== filter.value
        return typeof value === "string" && value < filter.value
      }),
    )
  }

  private async execute(): Promise<QueryResult> {
    if (this.op === "insert") {
      if (this.table === "stripe_webhook_events" && this.db.insertEventError) {
        return { data: null, error: this.db.insertEventError }
      }
      const row = this.insertRow ?? {}
      if (row.id != null && this.rows().some((existing) => existing.id === row.id)) {
        return { data: null, error: { code: "23505", message: "duplicate key" } }
      }
      this.rows().push(row)
      return { data: this.returning ? [{ ...row }] : null, error: null }
    }

    if (this.op === "update") {
      const patch = this.patch ?? {}
      if (this.table === "listings" && this.db.listingUpdateError) {
        return { data: null, error: this.db.listingUpdateError }
      }
      if (this.table === "stripe_webhook_events" && patch.status === "completed" && this.db.failNextEventCompletion) {
        this.db.failNextEventCompletion = false
        return { data: null, error: { message: "failed to mark completed" } }
      }
      if (this.table === "listings" && patch.payment_status === "paid") {
        this.db.beforePaidListingUpdate?.()
        const block = this.db.blockPaidListingUpdate
        if (block && !this.db.paidListingUpdateBlocked) {
          this.db.paidListingUpdateBlocked = true
          block.entered()
          await block.wait
        }
      }
      const matches = this.matching()
      for (const row of matches) Object.assign(row, patch)
      this.db.applied.push({ table: this.table, patch, matched: matches.length })
      return { data: this.returning ? matches.map((row) => ({ ...row })) : null, error: null }
    }

    if (this.table === "listings" && this.db.listingReadError) {
      return { data: null, error: this.db.listingReadError }
    }
    return { data: this.matching().map((row) => ({ ...row })), error: null }
  }

  private async one(maybe: boolean): Promise<QueryResult> {
    const result = await this.execute()
    if (result.error) return { data: null, error: result.error }
    const rows = Array.isArray(result.data) ? result.data : []
    if (maybe) {
      if (rows.length > 1) return { data: null, error: { code: "PGRST116", message: "multiple rows" } }
      return { data: rows[0] ?? null, error: null }
    }
    if (rows.length !== 1) {
      return { data: null, error: { code: "PGRST116", message: "JSON object requested" } }
    }
    return { data: rows[0], error: null }
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
        id: options?.sessionId ?? "cs_test",
        object: "checkout.session",
        payment_status: "paid",
        payment_intent: options?.paymentIntent ?? "pi_test",
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

function paymentIntentEvent(id: string, paymentIntentId: string, chargeId: string | null, created = Math.floor(Date.now() / 1000)) {
  return {
    id,
    object: "event",
    type: "payment_intent.succeeded",
    created,
    data: {
      object: {
        id: paymentIntentId,
        object: "payment_intent",
        latest_charge: chargeId,
      },
    },
  }
}

function blockNextPaidListingUpdate(db: MemoryDb) {
  let release!: () => void
  let entered!: () => void
  const enteredPromise = new Promise<void>((resolve) => {
    entered = resolve
  })
  const wait = new Promise<void>((resolve) => {
    release = resolve
  })
  db.blockPaidListingUpdate = { entered, wait }
  return { enteredPromise, release }
}

describe("stripe webhook retries", () => {
  let db: MemoryDb

  beforeEach(() => {
    db = new MemoryDb()
    mockState.client = db.client()
    mockNotify.mockReset()
    mockNotify.mockResolvedValue(undefined)
  })

  it("keeps the stale claim window above the configured route timeout", () => {
    expect(maxDuration).toBe(300)
    expect(maxDuration).toBe(WEBHOOK_ROUTE_MAX_DURATION_SECONDS)
    expect(STALE_CLAIM_MS).toBeGreaterThan(maxDuration * 1000)
  })

  it("completes a listing checkout once and ignores a duplicate delivery", async () => {
    db.tables.listings.push({
      id: LISTING_ID,
      payment_status: "requires_payment",
      status: "draft",
      stripe_payment_intent_id: null,
    })
    const event = checkoutEvent("evt_listing", { entity_type: "listing", entity_id: LISTING_ID })

    expect((await deliver(event)).status).toBe(200)
    expect((await deliver(event)).status).toBe(200)

    expect(db.row("listings", LISTING_ID)?.payment_status).toBe("paid")
    expect(db.row("listings", LISTING_ID)?.status).toBe("pending")
    expect(db.paidUpdates("listings").filter((entry) => entry.matched > 0)).toHaveLength(1)
    expect(db.row("stripe_webhook_events", "evt_listing")?.status).toBe("completed")
    expect(mockNotify).not.toHaveBeenCalled()
  })

  it("completes a donation checkout once and does not notify again for a duplicate delivery", async () => {
    db.tables.donations.push({
      id: DONATION_ID,
      payment_status: "requires_payment",
      stripe_checkout_session_id: "cs_donation",
      amount: 1000,
    })
    const event = checkoutEvent(
      "evt_donation",
      { entity_type: "donation", entity_id: DONATION_ID },
      { sessionId: "cs_donation" },
    )

    expect((await deliver(event)).status).toBe(200)
    expect((await deliver(event)).status).toBe(200)

    expect(db.row("donations", DONATION_ID)?.payment_status).toBe("paid")
    expect(db.row("donations", DONATION_ID)?.amount).toBe(2500)
    expect(db.paidUpdates("donations").filter((entry) => entry.matched > 0)).toHaveLength(1)
    expect(mockNotify).toHaveBeenCalledTimes(1)
    expect(db.row("stripe_webhook_events", "evt_donation")?.status).toBe("completed")
  })

  it("retries a failed payment write and applies it once", async () => {
    db.tables.listings.push({
      id: LISTING_ID,
      payment_status: "requires_payment",
      status: "draft",
    })
    db.listingUpdateError = { message: "update failed" }
    const event = checkoutEvent("evt_write_fail", { entity_type: "listing", entity_id: LISTING_ID })

    expect((await deliver(event)).status).toBe(500)
    expect(db.row("stripe_webhook_events", "evt_write_fail")?.status).toBe("failed")
    expect(db.row("listings", LISTING_ID)?.payment_status).toBe("requires_payment")

    db.listingUpdateError = null
    expect((await deliver(event)).status).toBe(200)
    expect(db.row("listings", LISTING_ID)?.payment_status).toBe("paid")
    expect(db.paidUpdates("listings").filter((entry) => entry.matched > 0)).toHaveLength(1)
    expect(db.row("stripe_webhook_events", "evt_write_fail")?.status).toBe("completed")
  })

  it("returns a retryable response when claiming the event fails", async () => {
    db.tables.listings.push({ id: LISTING_ID, payment_status: "requires_payment", status: "draft" })
    db.insertEventError = { message: "insert failed", code: "08006" }

    expect((await deliver(checkoutEvent("evt_insert", { entity_type: "listing", entity_id: LISTING_ID }))).status).toBe(
      500,
    )
    expect(db.tables.stripe_webhook_events).toHaveLength(0)
    expect(db.row("listings", LISTING_ID)?.payment_status).toBe("requires_payment")
  })

  it("returns a retryable response when a required listing read fails", async () => {
    db.tables.listings.push({ id: LISTING_ID, payment_status: "requires_payment", status: "draft" })
    db.listingReadError = { message: "read failed" }
    const event = checkoutEvent("evt_read", { entity_type: "listing", entity_id: LISTING_ID })

    expect((await deliver(event)).status).toBe(500)
    expect(db.row("stripe_webhook_events", "evt_read")?.status).toBe("failed")

    db.listingReadError = null
    expect((await deliver(event)).status).toBe(200)
    expect(db.row("listings", LISTING_ID)?.payment_status).toBe("paid")
  })

  it("keeps a checkout for a missing listing retryable", async () => {
    const response = await deliver(checkoutEvent("evt_missing", { entity_type: "listing", entity_id: LISTING_ID }))

    expect(response.status).toBe(500)
    expect(db.row("stripe_webhook_events", "evt_missing")?.status).toBe("failed")
  })

  it("does not let an overlapping delivery of the same event take or release the claim", async () => {
    db.tables.listings.push({ id: LISTING_ID, payment_status: "requires_payment", status: "draft" })
    const gate = blockNextPaidListingUpdate(db)
    const event = checkoutEvent("evt_concurrent", { entity_type: "listing", entity_id: LISTING_ID })

    const first = deliver(event)
    await gate.enteredPromise
    const token = db.row("stripe_webhook_events", "evt_concurrent")?.claim_token

    const second = await deliver(event)
    expect(second.status).toBe(500)
    expect(db.row("stripe_webhook_events", "evt_concurrent")?.claim_token).toBe(token)
    expect(db.row("stripe_webhook_events", "evt_concurrent")?.status).toBe("processing")

    gate.release()
    expect((await first).status).toBe(200)
    expect((await deliver(event)).status).toBe(200)
    expect(db.paidUpdates("listings").filter((entry) => entry.matched > 0)).toHaveLength(1)
    expect(db.row("stripe_webhook_events", "evt_concurrent")?.claim_token).toBe(token)
  })

  it("rejects the original owner after a stale claim is reclaimed", async () => {
    const oldToken = "33333333-3333-4333-8333-333333333333"
    db.tables.stripe_webhook_events.push({
      id: "evt_stale",
      type: "checkout.session.completed",
      status: "processing",
      claim_token: oldToken,
      claimed_at: new Date(Date.now() - STALE_CLAIM_MS - 60_000).toISOString(),
      completed_at: null,
      listing_id: LISTING_ID,
      donation_id: null,
      stripe_created: new Date().toISOString(),
    })
    db.tables.listings.push({ id: LISTING_ID, payment_status: "requires_payment", status: "draft" })
    const gate = blockNextPaidListingUpdate(db)
    const pending = deliver(checkoutEvent("evt_stale", { entity_type: "listing", entity_id: LISTING_ID }))
    await gate.enteredPromise

    const token = db.row("stripe_webhook_events", "evt_stale")?.claim_token
    expect(token).not.toBe(oldToken)
    const client = mockState.client as SupabaseClient
    expect(await completeWebhookEvent(client, "evt_stale", oldToken)).toBe("lost_ownership")
    expect(await failWebhookEvent(client, "evt_stale", oldToken)).toBe("lost_ownership")
    expect(db.row("stripe_webhook_events", "evt_stale")?.claim_token).toBe(token)
    expect(db.row("stripe_webhook_events", "evt_stale")?.status).toBe("processing")

    gate.release()
    expect((await pending).status).toBe(200)
    expect(db.row("stripe_webhook_events", "evt_stale")?.status).toBe("completed")
    expect(db.row("stripe_webhook_events", "evt_stale")?.claim_token).toBe(token)
  })

  it("retries after the completion write fails", async () => {
    db.tables.listings.push({ id: LISTING_ID, payment_status: "requires_payment", status: "draft" })
    db.failNextEventCompletion = true
    const event = checkoutEvent("evt_complete_fail", { entity_type: "listing", entity_id: LISTING_ID })

    expect((await deliver(event)).status).toBe(500)
    expect(db.row("stripe_webhook_events", "evt_complete_fail")?.status).toBe("failed")
    expect(db.row("listings", LISTING_ID)?.payment_status).toBe("paid")

    expect((await deliver(event)).status).toBe(200)
    expect(db.row("stripe_webhook_events", "evt_complete_fail")?.status).toBe("completed")
    expect(db.paidUpdates("listings").filter((entry) => entry.matched > 0)).toHaveLength(1)
  })

  it("keeps an unmatched refund retryable after more than 15 minutes", async () => {
    const created = Math.floor(Date.now() / 1000) - 16 * 60
    const event = refundEvent("evt_refund_early", "pi_late", "ch_late", created)

    expect((await deliver(event)).status).toBe(500)
    expect(db.row("stripe_webhook_events", "evt_refund_early")?.status).toBe("failed")
    expect((await deliver(event)).status).toBe(500)
    expect(db.row("stripe_webhook_events", "evt_refund_early")?.status).toBe("failed")

    db.tables.listings.push({
      id: LISTING_ID,
      payment_status: "paid",
      status: "pending",
      stripe_payment_intent_id: "pi_late",
    })

    expect((await deliver(event)).status).toBe(200)
    expect(db.row("listings", LISTING_ID)?.payment_status).toBe("refunded")
    expect(db.row("stripe_webhook_events", "evt_refund_early")?.status).toBe("completed")
  })

  it("leaves a payment refunded when checkout and refund processing overlap", async () => {
    db.tables.listings.push({
      id: LISTING_ID,
      payment_status: "requires_payment",
      status: "draft",
      stripe_payment_intent_id: "pi_overlap",
    })
    const gate = blockNextPaidListingUpdate(db)
    const checkout = deliver(
      checkoutEvent("evt_overlap_pay", { entity_type: "listing", entity_id: LISTING_ID }, { paymentIntent: "pi_overlap" }),
    )
    await gate.enteredPromise

    const refund = await deliver(refundEvent("evt_overlap_refund", "pi_overlap", "ch_overlap"))
    expect(refund.status).toBe(200)
    expect(db.row("listings", LISTING_ID)?.payment_status).toBe("refunded")

    gate.release()
    expect((await checkout).status).toBe(200)
    expect(db.row("listings", LISTING_ID)?.payment_status).toBe("refunded")
    expect(db.row("listings", LISTING_ID)?.status).toBe("draft")
    expect(db.row("stripe_webhook_events", "evt_overlap_pay")?.status).toBe("completed")
    expect(db.row("stripe_webhook_events", "evt_overlap_refund")?.status).toBe("completed")
    expect(db.paidUpdates("listings", 0)).toHaveLength(1)
  })

  it("treats a conditional paid update that matches zero rows as a settled refund", async () => {
    db.tables.listings.push({
      id: LISTING_ID,
      payment_status: "requires_payment",
      status: "draft",
    })
    db.beforePaidListingUpdate = () => {
      const listing = db.row("listings", LISTING_ID)
      if (listing) listing.payment_status = "refunded"
    }

    const response = await deliver(checkoutEvent("evt_zero", { entity_type: "listing", entity_id: LISTING_ID }))

    expect(response.status).toBe(200)
    expect(db.row("listings", LISTING_ID)?.payment_status).toBe("refunded")
    expect(db.row("listings", LISTING_ID)?.status).toBe("draft")
    expect(db.paidUpdates("listings", 0)).toHaveLength(1)
    expect(db.row("stripe_webhook_events", "evt_zero")?.status).toBe("completed")
  })

  it("retries a donation notification after the payment update succeeds", async () => {
    db.tables.donations.push({
      id: DONATION_ID,
      payment_status: "requires_payment",
      stripe_checkout_session_id: "cs_notify",
      amount: 1000,
    })
    mockNotify.mockRejectedValueOnce(new Error("send failed"))
    const event = checkoutEvent(
      "evt_notify",
      { entity_type: "donation", entity_id: DONATION_ID },
      { sessionId: "cs_notify" },
    )

    expect((await deliver(event)).status).toBe(500)
    expect(db.row("donations", DONATION_ID)?.payment_status).toBe("paid")
    expect(db.row("stripe_webhook_events", "evt_notify")?.status).toBe("failed")

    expect((await deliver(event)).status).toBe(200)
    expect(mockNotify).toHaveBeenCalledTimes(2)
    expect(db.paidUpdates("donations").filter((entry) => entry.matched > 0)).toHaveLength(1)
    expect(db.row("stripe_webhook_events", "evt_notify")?.status).toBe("completed")
  })

  it("does not replay an event the previous handler stored as completed", async () => {
    db.tables.stripe_webhook_events.push({
      id: "evt_overlap",
      type: "checkout.session.completed",
      status: "completed",
      claim_token: null,
      claimed_at: null,
      completed_at: null,
      listing_id: LISTING_ID,
      donation_id: null,
      stripe_created: new Date().toISOString(),
    })
    db.tables.listings.push({ id: LISTING_ID, payment_status: "requires_payment", status: "draft" })

    expect((await deliver(checkoutEvent("evt_overlap", { entity_type: "listing", entity_id: LISTING_ID }))).status).toBe(
      200,
    )
    expect(db.row("listings", LISTING_ID)?.payment_status).toBe("requires_payment")
    expect(db.row("stripe_webhook_events", "evt_overlap")?.status).toBe("completed")
    expect(db.row("stripe_webhook_events", "evt_overlap")?.claim_token).toBeNull()
  })

  it("retries a recent unmatched payment intent and acknowledges an older one", async () => {
    const recent = paymentIntentEvent("evt_pi_recent", "pi_recent", "ch_recent")
    expect((await deliver(recent)).status).toBe(500)
    expect(db.row("stripe_webhook_events", "evt_pi_recent")?.status).toBe("failed")

    const created = Math.floor(Date.now() / 1000) - 16 * 60
    const old = paymentIntentEvent("evt_pi_old", "pi_old", "ch_old", created)
    expect((await deliver(old)).status).toBe(200)
    expect(db.row("stripe_webhook_events", "evt_pi_old")?.status).toBe("completed")
  })

  it("refunds a donation matched by payment intent", async () => {
    db.tables.donations.push({
      id: DONATION_ID,
      payment_status: "paid",
      stripe_payment_intent_id: "pi_donation_refund",
    })

    expect((await deliver(refundEvent("evt_donation_refund", "pi_donation_refund", "ch_donation"))).status).toBe(200)
    expect(db.row("donations", DONATION_ID)?.payment_status).toBe("refunded")
    expect(db.row("stripe_webhook_events", "evt_donation_refund")?.status).toBe("completed")
  })
})
