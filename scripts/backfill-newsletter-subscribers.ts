/**
 * One-time backfill: profiles → newsletter_subscribers (queues Mailchimp sync via needs_sync).
 *
 * Usage (from performance-calendar, with .env.local loaded):
 *   npm run newsletter:backfill
 */
async function main() {
  const { getSupabaseServiceClient } = await import("../src/lib/supabase/service")
  const { syncNewsletterPreferences } = await import(
    "../src/features/newsletter/server/syncNewsletterPreferences"
  )

  const supabase = getSupabaseServiceClient()
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, newsletter_ear_opt_in, newsletter_calendar_opt_in")

  if (error) {
    console.error("Failed to load profiles", error)
    process.exit(1)
  }

  let ok = 0
  let skipped = 0
  let failed = 0

  for (const profile of profiles ?? []) {
    if (!profile.email?.trim()) {
      skipped++
      continue
    }

    const ear = profile.newsletter_ear_opt_in ?? false
    const calendar = profile.newsletter_calendar_opt_in ?? false

    if (!ear && !calendar) {
      skipped++
      continue
    }

    try {
      await syncNewsletterPreferences({
        email: profile.email,
        earOptIn: ear,
        calendarOptIn: calendar,
        profileId: profile.id,
        source: "backfill",
      })
      ok++
      console.log(`OK ${profile.email}`)
    } catch (err) {
      failed++
      console.error(`FAIL ${profile.email}`, err)
    }
  }

  console.log(`Done. ok=${ok} skipped=${skipped} failed=${failed}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
