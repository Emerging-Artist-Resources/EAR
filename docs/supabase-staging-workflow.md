# Supabase + staging workflow (Performance Calendar)

This project uses **Supabase** for PostgreSQL, auth, and RLS. Schema changes are managed with **versioned SQL migrations** under `supabase/migrations/`. Treat **Git + migrations** as the source of truth—not ad-hoc edits in the Supabase Dashboard on staging or production.

---

## Environments (mental model)

| Environment        | Purpose                         | Next.js (e.g. Vercel)     | Supabase project        |
|--------------------|----------------------------------|---------------------------|-------------------------|
| **Local**          | Day-to-day development           | `.env.local` → local API  | `supabase start`        |
| **Staging**        | Pre-production verification      | Preview / staging URL     | Staging Supabase project |
| **Production**     | Live users                       | Production URL            | Production Supabase project |

Use **separate Supabase projects** for staging and production. Never point staging and production at the same database.

---

## One-time: baseline and “correct state”

After you align **remote migration history** with your repo (e.g. CLI prompt *“Update remote migration history table?”* → **Y** when you intend to mark the remote as caught up):

1. **Commit all migration files** so the team shares one history:

   ```bash
   git add supabase/migrations
   git commit -m "chore(db): sync migrations with staging baseline"
   ```

2. Goal: **committed migrations = what you apply to staging/prod**. Local optional DB is for experimentation and generating diffs.

---

## Repeatable workflow: change the database

### A. Make the change locally

**Option 1 — Studio (fast iteration)**  
With local stack running (`supabase start`), use **Supabase Studio** at [http://127.0.0.1:54323](http://127.0.0.1:54323) (port is set in `supabase/config.toml` under `[studio]`).

**Option 2 — SQL in a migration file**  
Create a new file in `supabase/migrations/` with a timestamp prefix, e.g. `YYYYMMDDHHMMSS_my_change.sql`, and write idempotent SQL where possible (`IF NOT EXISTS`, etc.).

**Important:** RLS policies, functions, triggers, and grants belong in migrations too—not only tables.

---

### B. Generate a migration from local drift (when you used Studio)

From the project root (`performance-calendar/`), with **Docker running** and **local Supabase started**:

```bash
supabase start   # if not already running
supabase db diff -f describe_change
```

That creates a new file under `supabase/migrations/`. Rename the `-f` slug to something readable (the filename still gets a timestamp).

**If you skip Studio and hand-write SQL**, you can skip `db diff` and only commit the migration file you added.

---

### C. Review the migration

- Read the generated SQL; remove noise; ensure it matches what you intended.
- Prefer **forward-only** migrations for shared branches (avoid rewriting history of files already applied to staging/prod).

---

### D. Apply to **staging**

1. **Link** the CLI to your **staging** project (once per clone/machine, or when switching projects):

   ```bash
   supabase link --project-ref <STAGING_PROJECT_REF>
   ```

   Find `<STAGING_PROJECT_REF>` in the Supabase Dashboard: **Project Settings → General → Reference ID**.

2. Push migrations:

   ```bash
   supabase db push
   ```

   You do **not** need to run `link` before every push if this directory is already linked to staging; run `link` again only when changing which remote project this folder targets.

3. Optionally verify:

   ```bash
   supabase migration list
   ```

---

### E. Verify the **Next.js** app against staging

On **Vercel** (or your host):

- **Preview / staging** deployment should use the staging project’s  
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Server-only** secrets (`SUPABASE_SERVICE_ROLE_KEY`, etc.) must be set for the same environment and **never** exposed to the browser.

**React / Next.js practices:**

- Client components: only use the **anon** key and RLS-safe queries.
- API routes / Server Actions / `getSupabaseServerClient()`: session-scoped access; use **service role** only where you already do server-side privileged work (and never pass it to the client).
- After schema changes, update any TypeScript types or Zod schemas that mirror DB shapes so the UI and API stay in sync.

Smoke-test: auth, listing submit, admin paths, and any feature touched by the migration.

---

### F. Apply to **production**

1. Ensure the migration is **merged and committed** on the branch you release from.

2. Link to **production** (or use CI—see below):

   ```bash
   supabase link --project-ref <PRODUCTION_PROJECT_REF>
   supabase db push
   ```

3. **Production discipline:** run migrations in a controlled window; have a rollback story (often a follow-up migration, not `db reset` on prod).

---

## Optional: smoke-test migration

To validate the pipeline end-to-end:

1. Add a nullable column in a migration (or via Studio + `db diff`).
2. `supabase db push` to staging; confirm in Studio and in the app.
3. Remove it in a **new** migration if you were only testing—avoid reverting already-applied migration files on shared environments.

---

## Rules of thumb

### Do

- **Local → migration file → commit → push to staging → test → push to prod.**
- Keep **secrets out of Git**; use `.env.local` locally and host env vars for deployed apps.
- Match **Postgres major version** between local and remote (`supabase/config.toml` `[db] major_version` vs hosted project).

### Don’t

- Don’t rely on **Dashboard-only** schema edits on staging/prod without capturing them in `supabase/migrations/`.
- Don’t commit **service role** keys or database passwords.
- Don’t assume **Preview** deployments use production Supabase unless you explicitly configured that (usually they should not).

---

## CI/CD (recommended next step)

For production, many teams run `supabase db push` from GitHub Actions using `SUPABASE_ACCESS_TOKEN` and project ref, **only** on merge to `main` (or a release branch), after staging verification. That avoids manual `link` mistakes and keeps deploys auditable.

---

## Local Next.js + local Supabase

To point the app at the local stack, set in `.env.local` (values from `supabase start` output):

- `NEXT_PUBLIC_SUPABASE_URL` → local API URL (often `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → local anon key

Use a **separate** `.env.local` from staging/production so you never accidentally hit prod data during development.

---

## Related paths in this repo

- `supabase/migrations/` — applied in order; source of truth for schema.
- `supabase/config.toml` — local ports, DB version, seed paths.
- `src/lib/supabase/` — browser, server, and service-role clients.

---

## Troubleshooting

- **`db diff` errors / shadow DB:** Ensure Docker is running and `supabase start` succeeded; check `[db] major_version` matches hosted Postgres.
- **Migration already applied errors:** Use `supabase migration list` locally and in dashboard; resolve drift with team agreement (repair baselines carefully—prefer Supabase docs for `migration repair` scenarios).
- **App works locally but not on staging:** Almost always **wrong env vars** (URL/key) or RLS/policy differences after a migration.
