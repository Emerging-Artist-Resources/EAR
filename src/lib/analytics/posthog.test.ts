import posthog, { type CaptureResult } from "posthog-js"

import {
  analyticsEnvironment,
  initPostHog,
  isPostHogEnabled,
  prepareAnalyticsEvent,
  type AnalyticsEnvironment,
} from "@/lib/analytics/posthog"

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
  },
}))

const init = jest.mocked(posthog.init)

const ENV_KEYS = [
  "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
  "NEXT_PUBLIC_POSTHOG_HOST",
  "NEXT_PUBLIC_POSTHOG_ENABLED",
  "NEXT_PUBLIC_VERCEL_ENV",
] as const

function capture(
  properties: CaptureResult["properties"],
  extras: Partial<CaptureResult> = {},
): CaptureResult {
  return {
    uuid: "00000000-0000-4000-8000-000000000001",
    event: "$pageview",
    properties,
    ...extras,
  }
}

function withEnv(values: Record<(typeof ENV_KEYS)[number], string | undefined>, run: () => void) {
  const previous = new Map(ENV_KEYS.map((key) => [key, process.env[key]]))
  for (const key of ENV_KEYS) {
    const value = values[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  try {
    run()
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

describe("isPostHogEnabled", () => {
  const token = "phc_test"
  const host = "https://us.i.posthog.com"

  it("stays off without a token or host", () => {
    expect(isPostHogEnabled({ NEXT_PUBLIC_POSTHOG_HOST: host, NEXT_PUBLIC_VERCEL_ENV: "production" })).toBe(
      false,
    )
    expect(
      isPostHogEnabled({ NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: token, NEXT_PUBLIC_VERCEL_ENV: "production" }),
    ).toBe(false)
    expect(
      isPostHogEnabled({
        NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "",
        NEXT_PUBLIC_POSTHOG_HOST: host,
        NEXT_PUBLIC_VERCEL_ENV: "production",
      }),
    ).toBe(false)
  })

  it("sends in production unless the kill switch is false", () => {
    expect(
      isPostHogEnabled({
        NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: token,
        NEXT_PUBLIC_POSTHOG_HOST: host,
        NEXT_PUBLIC_VERCEL_ENV: "production",
      }),
    ).toBe(true)
    expect(
      isPostHogEnabled({
        NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: token,
        NEXT_PUBLIC_POSTHOG_HOST: host,
        NEXT_PUBLIC_VERCEL_ENV: "production",
        NEXT_PUBLIC_POSTHOG_ENABLED: "false",
      }),
    ).toBe(false)
  })

  it("sends outside production only when explicitly enabled", () => {
    const base = {
      NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: token,
      NEXT_PUBLIC_POSTHOG_HOST: host,
    }
    expect(isPostHogEnabled({ ...base, NEXT_PUBLIC_VERCEL_ENV: "preview" })).toBe(false)
    expect(isPostHogEnabled({ ...base, NEXT_PUBLIC_VERCEL_ENV: "development" })).toBe(false)
    expect(isPostHogEnabled(base)).toBe(false)
    expect(
      isPostHogEnabled({ ...base, NEXT_PUBLIC_VERCEL_ENV: "preview", NEXT_PUBLIC_POSTHOG_ENABLED: "true" }),
    ).toBe(true)
    expect(isPostHogEnabled({ ...base, NEXT_PUBLIC_POSTHOG_ENABLED: "true" })).toBe(true)
  })
})

describe("analyticsEnvironment", () => {
  it.each([
    ["production", "production"],
    ["preview", "preview"],
    ["development", "development"],
    [undefined, "development"],
    ["staging", "development"],
  ] as const)("maps %s to %s", (vercelEnv, expected) => {
    expect(analyticsEnvironment(vercelEnv)).toBe(expected)
  })
})

describe("prepareAnalyticsEvent", () => {
  const environment: AnalyticsEnvironment = "production"

  it("tags the environment and overwrites an existing value", () => {
    const result = prepareAnalyticsEvent(
      capture({
        $current_url: "https://ear.org/calendar",
        $pathname: "/calendar",
        environment: "preview",
        $browser: "Chrome",
      }),
      "development",
    )

    expect(result?.event).toBe("$pageview")
    expect(result?.properties.environment).toBe("development")
    expect(result?.properties.$browser).toBe("Chrome")
  })

  it.each([
    "/admin",
    "/admin/users",
    "/auth/callback",
    "/profile",
    "/api/stripe",
    "/forms/submit",
    "/donations/export",
    "/donate/artist/success",
    "/donate/artist/success/",
  ])("drops a pageview on %s", (pathname) => {
    expect(
      prepareAnalyticsEvent(
        capture({
          $current_url: `https://ear.org${pathname}?session_id=cs_test#paid`,
          $pathname: pathname,
        }),
        environment,
      ),
    ).toBeNull()
  })

  it("drops the event when only the pathname is excluded", () => {
    expect(
      prepareAnalyticsEvent(
        capture({
          $current_url: "https://ear.org/calendar",
          $pathname: "/admin?next=/calendar",
        }),
        environment,
      ),
    ).toBeNull()
  })

  it("keeps public donate pages and strips the query and hash", () => {
    const result = prepareAnalyticsEvent(
      capture({
        $current_url: "https://ear.org/donate/artist?amount=25&email=a@b.com#form",
        $pathname: "/donate/artist",
        $host: "ear.org",
        $referrer: "https://www.google.com/search?q=secret#results",
        $referring_domain: "www.google.com",
        ph_keyword: "secret",
      }),
      environment,
    )

    expect(result?.properties).toMatchObject({
      environment,
      $current_url: "https://ear.org/donate/artist",
      $pathname: "/donate/artist",
      $host: "ear.org",
      $referrer: "https://www.google.com/search",
      $referring_domain: "www.google.com",
    })
    expect(result?.properties.ph_keyword).toBeUndefined()
  })

  it("keeps the organization donate page", () => {
    const result = prepareAnalyticsEvent(
      capture({ $current_url: "https://ear.org/donate", $pathname: "/donate" }),
      environment,
    )
    expect(result?.properties.$pathname).toBe("/donate")
  })

  it("removes an excluded referrer, session entry, and initial URL from a later public pageview", () => {
    const input = capture(
      {
        $current_url: "https://ear.org/calendar?utm_source=email#top",
        $pathname: "/calendar?utm_source=email",
        $host: "ear.org",
        $referrer: "https://ear.org/auth/callback?code=secret#token",
        $referring_domain: "ear.org",
        $session_entry_url: "https://ear.org/admin/users?token=abc#section",
        $session_entry_pathname: "/admin/users",
        $session_entry_host: "ear.org",
        $session_entry_referrer: "https://ear.org/profile/settings?tab=email",
        $session_entry_referring_domain: "ear.org",
        $session_entry_utm_source: "email",
        $session_entry_ph_keyword: "secret",
        ph_keyword: "secret",
        $browser: "Chrome",
        $set: {
          $current_url: "https://ear.org/forms/apply?draft=1",
          $pathname: "/forms/apply",
          $host: "ear.org",
          utm_source: "newsletter",
        },
      },
      {
        $set_once: {
          $initial_current_url: "https://ear.org/donate/artist/success?session_id=cs_123#done",
          $initial_pathname: "/donate/artist/success",
          $initial_host: "ear.org",
          $initial_referrer: "https://news.example/story?id=9",
          $initial_referring_domain: "news.example",
          $initial_utm_campaign: "spring",
          $initial_gclid: "click-id",
          ph_keyword: "secret",
        },
      },
    )

    const result = prepareAnalyticsEvent(input, environment)

    expect(result?.properties).toMatchObject({
      environment,
      $current_url: "https://ear.org/calendar",
      $pathname: "/calendar",
      $host: "ear.org",
      $browser: "Chrome",
    })
    expect(result?.properties.$referrer).toBeUndefined()
    expect(result?.properties.$referring_domain).toBeUndefined()
    expect(result?.properties.$session_entry_url).toBeUndefined()
    expect(result?.properties.$session_entry_pathname).toBeUndefined()
    expect(result?.properties.$session_entry_host).toBeUndefined()
    expect(result?.properties.$session_entry_referrer).toBeUndefined()
    expect(result?.properties.$session_entry_referring_domain).toBeUndefined()
    expect(result?.properties.$session_entry_utm_source).toBeUndefined()
    expect(result?.properties.ph_keyword).toBeUndefined()
    expect(result?.properties.$set).toEqual({ utm_source: "newsletter" })
    expect(result?.$set_once).toEqual({
      $initial_referrer: "https://news.example/story",
      $initial_referring_domain: "news.example",
    })
    expect(input.properties.$current_url).toBe("https://ear.org/calendar?utm_source=email#top")
    expect(input.$set_once?.$initial_utm_campaign).toBe("spring")
  })

  it("strips a public session-entry URL without dropping the pageview", () => {
    const result = prepareAnalyticsEvent(
      capture({
        $current_url: "https://ear.org/about-us",
        $pathname: "/about-us",
        $session_entry_url: "https://ear.org/calendar?utm_source=email#top",
        $session_entry_pathname: "/calendar",
        $session_entry_host: "ear.org",
        $session_entry_utm_medium: "email",
      }),
      environment,
    )

    expect(result?.properties.$session_entry_url).toBe("https://ear.org/calendar")
    expect(result?.properties.$session_entry_pathname).toBe("/calendar")
    expect(result?.properties.$session_entry_host).toBe("ear.org")
    expect(result?.properties.$session_entry_utm_medium).toBeUndefined()
  })

  it("leaves a direct referrer unchanged", () => {
    const result = prepareAnalyticsEvent(
      capture({
        $current_url: "https://ear.org/",
        $pathname: "/",
        $referrer: "$direct",
        $referring_domain: "$direct",
      }),
      environment,
    )

    expect(result?.properties.$referrer).toBe("$direct")
    expect(result?.properties.$referring_domain).toBe("$direct")
    expect(result?.properties.$pathname).toBe("/")
  })
})

describe("initPostHog", () => {
  const enabled = {
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_test",
    NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
    NEXT_PUBLIC_POSTHOG_ENABLED: undefined,
    NEXT_PUBLIC_VERCEL_ENV: "production",
  } as const

  beforeEach(() => {
    init.mockReset()
  })

  it("does not throw when init fails, and does not start without config", () => {
    init.mockImplementation(() => {
      throw new Error("posthog down")
    })
    withEnv(enabled, () => {
      expect(() => initPostHog()).not.toThrow()
    })
    expect(init).toHaveBeenCalledTimes(1)

    init.mockReset()
    withEnv({ ...enabled, NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: undefined }, () => {
      initPostHog()
    })
    expect(init).not.toHaveBeenCalled()

    withEnv({ ...enabled, NEXT_PUBLIC_POSTHOG_ENABLED: "false" }, () => {
      initPostHog()
    })
    expect(init).not.toHaveBeenCalled()
  })

  it("initializes once with cookieless pageview capture", () => {
    withEnv({ ...enabled, NEXT_PUBLIC_VERCEL_ENV: "preview", NEXT_PUBLIC_POSTHOG_ENABLED: "true" }, () => {
      initPostHog()
      initPostHog()
    })

    expect(init).toHaveBeenCalledTimes(1)
    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        api_host: "https://us.i.posthog.com",
        defaults: "2026-08-30",
        capture_pageview: "history_change",
        capture_pageleave: "if_capture_pageview",
        cookieless_mode: "always",
        person_profiles: "never",
        save_campaign_params: false,
        internal_or_test_user_hostname: null,
        autocapture: false,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        capture_performance: false,
        capture_exceptions: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_external_dependency_loading: true,
        advanced_disable_flags: true,
        disable_capture_url_hashes: true,
      }),
    )

    const beforeSend = init.mock.calls[0]?.[1]?.before_send
    if (typeof beforeSend !== "function") {
      throw new Error("expected before_send to be a function")
    }

    const pageview = beforeSend(
      capture({ $current_url: "https://ear.org/calendar?utm=1", $pathname: "/calendar" }),
    )
    expect(pageview?.properties.environment).toBe("preview")
    expect(pageview?.properties.$current_url).toBe("https://ear.org/calendar")

    expect(
      beforeSend(capture({ $current_url: "https://ear.org/admin", $pathname: "/admin" })),
    ).toBeNull()
  })
})
