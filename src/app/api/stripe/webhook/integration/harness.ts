import { createHmac, randomBytes } from "crypto"
import { execFile } from "child_process"
import { readFile } from "fs/promises"
import path from "path"
import { promisify } from "util"
import { PostgrestClient } from "@supabase/postgrest-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Client } from "pg"

const exec = promisify(execFile)

const PG_PORT = 55432
const API_PORT = 55433
const FORBIDDEN_PORTS = new Set([54320, 54321, 54322, 54329])
const NETWORK = "webhook-retry-net"
const PG_NAME = "webhook-retry-pg"
const API_NAME = "webhook-retry-pgrst"
const DB_NAME = "webhook_retry"

export const HISTORICAL_LISTING_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"
export const HISTORICAL_EVENT_ID = "evt_historical"

export type DisposableStack = {
  pg: Client
  supabase: SupabaseClient
  apiUrl: string
  resetGates: () => Promise<void>
  stop: () => Promise<void>
}

if (FORBIDDEN_PORTS.has(PG_PORT) || FORBIDDEN_PORTS.has(API_PORT)) {
  throw new Error("Refusing to use a local Supabase port for the disposable database")
}

function assertDisposableTarget(host: string, port: number, database: string) {
  if (host !== "127.0.0.1") {
    throw new Error("Refusing to connect to a non-local disposable database host")
  }
  if (FORBIDDEN_PORTS.has(port) || port !== PG_PORT) {
    throw new Error(`Refusing database port ${port}`)
  }
  if (database !== DB_NAME) {
    throw new Error(`Refusing database ${database}`)
  }
}

function signServiceJwt(secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")
  const issuedAt = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(
    JSON.stringify({ role: "service_role", iat: issuedAt, exp: issuedAt + 60 * 60 }),
  ).toString("base64url")
  const unsigned = `${header}.${payload}`
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url")
  return `${unsigned}.${signature}`
}

async function docker(args: string[], allowFailure = false): Promise<string> {
  try {
    const { stdout, stderr } = await exec("docker", args, { maxBuffer: 10 * 1024 * 1024 })
    return `${stdout}${stderr}`
  } catch (error) {
    if (allowFailure) return ""
    throw error
  }
}

async function removeContainers() {
  await docker(["rm", "-f", API_NAME, PG_NAME], true)
  await docker(["network", "rm", NETWORK], true)
}

async function connectWhenReady(config: {
  host: string
  port: number
  user: string
  password: string
  database: string
}): Promise<Client> {
  const started = Date.now()
  let lastError: unknown
  while (Date.now() - started < 60_000) {
    const client = new Client(config)
    try {
      await client.connect()
      await client.query("SELECT 1")
      return client
    } catch (error) {
      lastError = error
      await client.end().catch(() => undefined)
      // Container startup only. Test ordering uses advisory locks, not timers.
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Postgres did not become ready")
}

export async function startDisposableStack(): Promise<DisposableStack> {
  const password = randomBytes(24).toString("hex")
  const jwtSecret = randomBytes(32).toString("hex")
  const redact = (text: string) => text.replaceAll(password, "[redacted]").replaceAll(jwtSecret, "[redacted]")
  assertDisposableTarget("127.0.0.1", PG_PORT, DB_NAME)

  await removeContainers()
  let pg: Client | undefined
  try {
    await docker(["network", "create", NETWORK])
    await docker([
      "run",
      "-d",
      "--name",
      PG_NAME,
      "--network",
      NETWORK,
      "-p",
      `127.0.0.1:${PG_PORT}:5432`,
      "-e",
      `POSTGRES_PASSWORD=${password}`,
      "-e",
      `POSTGRES_DB=${DB_NAME}`,
      "postgres:17-alpine",
    ])

    pg = await connectWhenReady({
      host: "127.0.0.1",
      port: PG_PORT,
      user: "postgres",
      password,
      database: DB_NAME,
    })

    const identity = await pg.query<{ db: string; public_tables: number }>(
      `SELECT current_database() AS db,
              (SELECT count(*)::int FROM information_schema.tables WHERE table_schema = 'public') AS public_tables`,
    )
    const row = identity.rows[0]
    if (!row || row.db !== DB_NAME || row.public_tables !== 0) {
      throw new Error(
        `Refusing to migrate ${row?.db ?? "unknown"} with ${row?.public_tables ?? "unknown"} public tables`,
      )
    }

    const schema = await readFile(
      path.join(process.cwd(), "src/app/api/stripe/webhook/integration/schema.sql"),
      "utf8",
    )
    await pg.query(schema)
    await pg.query(
      `INSERT INTO public.listings (
         id, type, status, contact_name, contact_email,
         payment_required, payment_amount, payment_currency, payment_status
       ) VALUES ($1, 'performance', 'draft', 'Historical Contact', 'historical@example.com', true, 2500, 'usd', 'requires_payment')`,
      [HISTORICAL_LISTING_ID],
    )
    await pg.query(
      `INSERT INTO public.stripe_webhook_events (id, type, listing_id, donation_id, stripe_created)
       VALUES ($1, 'checkout.session.completed', $2, NULL, now())`,
      [HISTORICAL_EVENT_ID, HISTORICAL_LISTING_ID],
    )

    const migration = await readFile(
      path.join(process.cwd(), "supabase/migrations/20261119180000_stripe_webhook_event_claims.sql"),
      "utf8",
    )
    await pg.query(migration)

    if (!/^[0-9a-f]+$/.test(password)) {
      throw new Error("Refusing to create a role with an unexpected password")
    }
    await pg.query(`
      CREATE ROLE service_role NOLOGIN;
      CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD '${password}';
      GRANT service_role TO authenticator;
      GRANT USAGE ON SCHEMA public TO service_role;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
      GRANT EXECUTE ON FUNCTION public.listing_read_gate(uuid) TO service_role;
      GRANT EXECUTE ON FUNCTION public.stripe_webhook_events_claim_barrier() TO service_role;
      GRANT EXECUTE ON FUNCTION public.fail_armed_write() TO service_role;
      GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
    `)

    const apiUrl = `http://127.0.0.1:${API_PORT}`
    if (apiUrl.includes("supabase.co") || FORBIDDEN_PORTS.has(API_PORT)) {
      throw new Error("Refusing PostgREST target")
    }
    const jwt = signServiceJwt(jwtSecret)
    await docker([
      "run",
      "-d",
      "--name",
      API_NAME,
      "--network",
      NETWORK,
      "-p",
      `127.0.0.1:${API_PORT}:3000`,
      "-e",
      `PGRST_DB_URI=postgres://authenticator:${password}@${PG_NAME}:5432/${DB_NAME}`,
      "-e",
      "PGRST_DB_SCHEMAS=public",
      "-e",
      "PGRST_DB_ANON_ROLE=service_role",
      "-e",
      `PGRST_JWT_SECRET=${jwtSecret}`,
      "postgrest/postgrest:v12.2.3",
    ])

    const started = Date.now()
    let last = ""
    while (Date.now() - started < 60_000) {
      try {
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${jwt}`, apikey: jwt },
        })
        if (response.ok) {
          last = ""
          break
        }
        last = `${response.status} ${await response.text()}`
      } catch (error) {
        last = error instanceof Error ? error.message : String(error)
      }
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    if (last) {
      const logs = redact(await docker(["logs", API_NAME], true))
      throw new Error(`PostgREST did not become ready: ${redact(last)}\n${logs}`)
    }

    // supabase-js appends /rest/v1, which the standalone PostgREST process does not serve.
    // This is the same PostgREST query builder the service client uses in production.
    const supabase = new PostgrestClient(apiUrl, {
      headers: { apikey: jwt, Authorization: `Bearer ${jwt}` },
      schema: "public",
    }) as unknown as SupabaseClient
    if (!pg) throw new Error("Postgres client was not connected")
    const client = pg
    return {
      pg: client,
      supabase,
      apiUrl,
      resetGates: async () => {
        await client.query(`
          UPDATE public.test_barrier SET active = false, arrived = 0, goal = 2 WHERE id = 1;
          UPDATE public.test_gate SET armed = false WHERE name = 'listing_read';
          UPDATE public.test_failures SET remaining = 0;
          SELECT pg_advisory_unlock_all();
          DROP POLICY IF EXISTS listings_it_select ON public.listings;
          DROP POLICY IF EXISTS listings_it_update ON public.listings;
          ALTER TABLE public.listings DISABLE ROW LEVEL SECURITY;
        `)
      },
      stop: async () => {
        await client.end().catch(() => undefined)
        await removeContainers()
      },
    }
  } catch (error) {
    await pg?.end().catch(() => undefined)
    await removeContainers()
    if (error instanceof Error) {
      error.message = redact(error.message)
    }
    throw error
  }
}
