/**
 * Environment variable validation and access utilities
 * Ensures all required environment variables are present at runtime
 *
 * Optional (footer): NEXT_PUBLIC_INSTAGRAM_URL, NEXT_PUBLIC_YOUTUBE_URL, NEXT_PUBLIC_LINKEDIN_URL
 */

type ClientEnvVar = {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

type ServerEnvVar = {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  /** Optional: fiscal sponsor Stripe account for artist-tagged donations */
  STRIPE_SPONSOR_SECRET_KEY?: string
  /** Optional: webhook signing secret for sponsor Stripe dashboard (same URL as main webhook) */
  STRIPE_SPONSOR_WEBHOOK_SECRET?: string
  TURNSTILE_SECRET_KEY?: string
}

type ServiceEnvVar = {
  SUPABASE_URL: string
  SERVICE_ROLE_KEY: string
}

/**
 * Validates and returns client-side (public) environment variables
 * Only includes variables that are safe to expose to the client
 */
export function getClientEnv(): ClientEnvVar {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseKey) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey,
  }
}

/**
 * Validates and returns server-side environment variables
 * Includes both public and private server-only variables
 */
export function getServerEnv(): ServerEnvVar {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeSponsorSecret = process.env.STRIPE_SPONSOR_SECRET_KEY
  const stripeSponsorWebhookSecret = process.env.STRIPE_SPONSOR_WEBHOOK_SECRET
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY

  if (!supabaseUrl) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseKey) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
  }

  if (!stripeSecretKey) {
    throw new Error('Missing required environment variable: STRIPE_SECRET_KEY')
  }

  if (!stripeWebhookSecret) {
    throw new Error('Missing required environment variable: STRIPE_WEBHOOK_SECRET')
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    STRIPE_SECRET_KEY: stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
    STRIPE_SPONSOR_SECRET_KEY: stripeSponsorSecret,
    STRIPE_SPONSOR_WEBHOOK_SECRET: stripeSponsorWebhookSecret,
    TURNSTILE_SECRET_KEY: turnstileSecret,
  }
}

/**
 * Validates and returns service role environment variables
 * Used for admin operations that require service role access
 * Note: These should match NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * but are kept separate for clarity in server-side operations
 */
export function getServiceEnv(): ServiceEnvVar {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing required environment variable: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing required environment variable: SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY')
  }

  return {
    SUPABASE_URL: supabaseUrl,
    SERVICE_ROLE_KEY: serviceRoleKey,
  }
}

/**
 * Gets optional environment variable with fallback
 */
export function getOptionalEnv(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback
}
