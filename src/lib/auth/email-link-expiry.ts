/** Must match Supabase Auth email OTP expiry (`otp_expiry` in supabase/config.toml and dashboard). */
export const AUTH_EMAIL_LINK_EXPIRY_SECONDS = 86_400

export const AUTH_EMAIL_LINK_EXPIRY_HOURS = AUTH_EMAIL_LINK_EXPIRY_SECONDS / 3600

export const AUTH_EMAIL_LINK_EXPIRY_LABEL = `${AUTH_EMAIL_LINK_EXPIRY_HOURS} hours`
