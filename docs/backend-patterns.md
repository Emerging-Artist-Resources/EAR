# Backend patterns and rules

This document describes how **performance-calendar** handles server-side logic: Route Handlers (App Router), Supabase, auth, validation, and layering. It reflects the current codebase; some older routes mix styles—prefer the patterns below for new work.

---

## 1. Stack at a glance

| Area | Choice |
|------|--------|
| HTTP API | Next.js **Route Handlers** — `src/app/api/**/route.ts` |
| Primary database / auth | **Supabase** (Postgres + Auth) |
| Server Supabase (user session) | `getSupabaseServerClient()` — `@/lib/supabase/server` |
| Privileged Supabase (service role) | `getSupabaseServiceClient()` — `@/lib/supabase/service` |
| Validation | **Zod** — shared schemas in `src/lib/validations/**`, occasional inline schemas in routes |
| Payments | **Stripe** (REST + webhooks); secrets via `getServerEnv()` |
| Env access | `src/lib/env.ts` — `getClientEnv`, `getServerEnv`, `getServiceEnv`, `getOptionalEnv` |

There is **no Prisma usage in `src/`** for this app’s runtime API layer; data access goes through Supabase clients.

---

## 2. Request flow: where code lives

```
Route Handler (route.ts)
    → Auth helpers (optional / required)
    → validateRequestBody / Zod
    → Feature service (orchestration, side effects)
    → Feature repository (queries, inserts)
    → Supabase client
```

**Rules:**

- **Route handlers** should stay thin: parse input, call auth, delegate to `features/*/server` when logic grows or is reused.
- **Repositories** (`features/*/server/repository*.ts`) hold Supabase queries and row shaping; avoid importing React or UI from here.
- **Services** (`features/*/server/service.ts`) coordinate validation, repos, emails, and multi-step workflows.

Smaller endpoints may inline Supabase calls in the route; extract to a repository when the same query appears twice or the handler exceeds ~80–100 lines of domain logic.

---

## 3. API responses and errors

Standard shape is defined in `src/lib/api-utils.ts`:

- Success: `{ data: T }` via **`createSuccessResponse(data, status?)`**
- Failure: `{ error: { code, message?, details? } }` via **`createErrorResponse(code, message?, details?, status?)`**
- Constants: **`ErrorCodes`** (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, etc.)

**Helpers:**

| Helper | Use |
|--------|-----|
| `validateRequestBody(body, schema)` | Parse JSON body with Zod; rethrows `ZodError` for `handleApiError` |
| `handleApiError(error)` | Maps `ZodError` → 400, message `Unauthorized` → 401, messages containing “not found” → 404, else 500 |
| `withErrorHandling(handler)` | Wrapper if you prefer a functional style over try/catch |
| `getQueryParam` / `getQueryParamNumber` / `getQueryParamArray` | Typed query parsing |

**Rules:**

1. Prefer **`createSuccessResponse` / `createErrorResponse`** so clients and `apiFetch` in the frontend stay consistent.
2. Wrap handler bodies in **`try/catch`** and return **`handleApiError(error)`** in the `catch` block (unless you intentionally handle specific errors earlier).
3. For **403 Forbidden**, return **`forbiddenResponse()`** from `@/lib/auth-helpers` (or `createErrorResponse(..., FORBIDDEN, ..., 403)`) explicitly. Thrown `Error("Forbidden")` is **not** mapped to 403 by `handleApiError` today—it becomes a 500—so avoid relying on throwing `"Forbidden"` alone.

**Legacy note:** Some routes still return `NextResponse.json({ error: "..." }, { status })` without the `error.code` shape. New routes should use the helpers above; consider aligning old ones when touching them.

---

## 4. Authentication and authorization

### Session and user identity

- **`getAuthenticatedUser()`** — returns `{ user, role }` or `null` if not signed in. Uses Supabase server client + JWT user; role from `app_metadata` / `user_metadata`, with **`getUserRoleFromProfile`** fallback on `profiles.role`.
- **`requireAuth()`** — throws **`Error("Unauthorized")`** if unauthenticated (works with `handleApiError` → 401).
- **`requireRole("REVIEWER" | "EDITOR" | ...)`** — requires login and role; **ADMIN** is treated as superuser for role-gated operations. Pair with explicit **`hasRole`** + **`createErrorResponse`** / **`forbiddenResponse`** when you need predictable 403 responses.

### Convenience responses

- **`unauthorizedResponse()`** / **`forbiddenResponse()`** — standardized 401/403 using `ErrorCodes`.

### Middleware (`middleware.ts`)

- Runs for **`/admin/:path*`** and **`/api/:path*`**: builds Supabase server client from cookies and refreshes the session.
- **`/api/stripe/webhook`** is **excluded** from special handling so Stripe can POST without a user session.
- **Admin UI** (`/admin/...`): non-ADMIN users are redirected to sign-in. **API routes under `/api/admin/...` are not automatically blocked by role in middleware**—each handler must enforce **`requireRole`** / **`hasRole`**.

**Rule:** Never assume “user hit `/api/...` through the app” equals “authenticated or authorized.” Always enforce in the route (or shared helper) what the operation allows.

---

## 5. Supabase clients: when to use which

| Client | Function | Use when |
|--------|----------|----------|
| Server (anon + cookies) | `getSupabaseServerClient()` | Normal API handlers acting **as the logged-in user**; RLS policies apply. |
| Service role | `getSupabaseServiceClient()` | **Webhooks**, background-style updates, admin operations that must bypass RLS, or when no user cookie exists. |

**Rules:**

1. Default to the **server** client so RLS stays the primary safety net.
2. Use the **service** client only with clear justification; keep those code paths small and auditable.
3. `getServiceEnv()` accepts `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` and `SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`—keep deployment env vars consistent with comments in `env.ts`.

**Donations and Stripe webhook idempotency**

- Schema: [`sql_files/rls_donations_and_stripe_webhook_events.sql`](../sql_files/rls_donations_and_stripe_webhook_events.sql) enables RLS on `donations` and `stripe_webhook_events`.
- **`stripe_webhook_events`:** RLS on, **no** policies for `anon` / `authenticated`—only the service role (e.g. `POST /api/stripe/webhook`) can read/write.
- **`donations`:** INSERT policies allow a constrained “pending” row for `anon` and `authenticated`; SELECT for donor, recipient, or admin; **no** user `UPDATE` / `DELETE` policies—payment fields change only through the **service role** (Stripe webhook, checkout session persistence).
- **`POST /api/donations`** uses **`getSupabaseServerClientAnon()`** when the donor is anonymous (sends `Authorization: Bearer <anon_key>` so PostgREST JWT role is `anon` and `donations_insert_anon` applies) and **`getSupabaseServerClient()`** when logged in (`donor_id = auth.uid()`). **`POST /api/stripe/create-donation-session`**, **`GET /api/donations/[id]`** (success polling), and the webhook use **`getSupabaseServiceClient()`** for `donations` so RLS does not block those paths and financial updates stay server-side.

---

## 6. Environment variables

- **`getClientEnv()`** — safe for use where only public keys are needed (e.g. building the browser-safe Supabase client path).
- **`getServerEnv()`** — Stripe, Supabase service role, webhook secrets, optional sponsor Stripe keys, Turnstile, etc. Call at the start of routes that need those secrets.
- **`getOptionalEnv(key, fallback?)`** — non-critical toggles.

**Rule:** Do not read `process.env.MY_SECRET` scattered across the codebase for required keys—add them to `env.ts` and validate once so misconfiguration fails fast at runtime.

---

## 7. Validation

- **Shared domains** (donations, profile, events): schemas live under **`src/lib/validations/`** (and nested `validations/events/**` where needed).
- **Route-specific** payloads: inline `z.object({ ... })` in the route is acceptable if not reused.
- Use **`validateRequestBody(parsedJson, schema)`** so invalid bodies become **`ZodError`** and uniform 400 responses.

**Rule:** Server validation is mandatory even when the client validates—the API must not trust the browser.

---

## 8. Stripe webhooks

- Implemented in **`src/app/api/stripe/webhook/route.ts`** with **`export const runtime = "nodejs"`** (required for Stripe SDK and raw body).
- Uses **`getServerEnv()`** for keys and **`getSupabaseServiceClient()`** for DB updates.
- Verifies signature with **`stripe.webhooks.constructEvent`**; optional second secret for sponsor account if configured.
- **Idempotency:** records event ids (e.g. in `stripe_webhook_events`) to avoid double-processing.

**Rule:** Never parse the webhook body as JSON before verification; use **`req.text()`** as the Stripe docs require.

---

## 9. Naming and file layout

- One **`route.ts`** per HTTP method group per folder; export named functions **`GET`**, **`POST`**, **`PATCH`**, **`DELETE`** as needed.
- Admin routes live under **`src/app/api/admin/...`**; profile and calendar under their respective segments.
- Feature code: **`src/features/<domain>/server/`** for `repository.ts`, `service.ts`, `types.ts`, etc.

---

## 10. Logging and errors

- Use **`console.error`** for failures you need in server logs today; prefer structured logging if you add a service later.
- Avoid leaking stack traces or internal messages in **production** responses—`handleApiError` already gates detailed messages on **`NODE_ENV === "development"`** for generic `Error`s.

---

## 11. Quick checklist for new API routes

- [ ] Choose Supabase client: server (default) vs service (privileged only).  
- [ ] Enforce auth / role explicitly; do not rely on middleware alone for `/api`.  
- [ ] Validate body and query params with Zod.  
- [ ] Return **`createSuccessResponse`** / **`createErrorResponse`** (or auth helper responses).  
- [ ] **`try/catch`** with **`handleApiError`** for unexpected errors.  
- [ ] Put reusable queries in **`features/*/server/repository`**.  
- [ ] Pull secrets through **`getServerEnv()`** / **`getServiceEnv()`**.  
- [ ] For Stripe (or similar), set **`runtime = "nodejs"`** if the default edge runtime is insufficient.

---

## 12. Related files

| File / area | Role |
|-------------|------|
| `src/lib/api-utils.ts` | Response helpers, error handling, query param utilities |
| `src/lib/auth-helpers.ts` | `getAuthenticatedUser`, `requireAuth`, `requireRole`, `hasRole` |
| `src/lib/authz.ts` | Role extraction from JWT / `profiles` |
| `src/lib/supabase/server.ts` | Cookie-backed Supabase client |
| `src/lib/supabase/service.ts` | Service-role client |
| `src/lib/env.ts` | Validated environment access |
| `middleware.ts` | Session refresh; admin UI gate; webhook bypass |
| `src/features/*/server/*` | Repositories and services |

Update this document when you add new cross-cutting concerns (e.g. rate limiting, OpenAPI, or a unified logger).
