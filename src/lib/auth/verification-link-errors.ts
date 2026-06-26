import { AUTH_EMAIL_LINK_EXPIRY_LABEL } from "@/lib/auth/email-link-expiry"

export type AuthLinkErrorKind =
  | "verification_expired"
  | "auth_link_invalid"
  | "missing_payload"
  | "session_failed"

export function authLinkErrorKindFromCode(errorCode: string | null): AuthLinkErrorKind {
  if (errorCode === "otp_expired") return "verification_expired"
  return "auth_link_invalid"
}

export function getAuthLinkErrorContent(kind: AuthLinkErrorKind): {
  title: string
  description: string
} {
  switch (kind) {
    case "verification_expired":
      return {
        title: "This verification link has expired",
        description:
          `Email verification links expire after ${AUTH_EMAIL_LINK_EXPIRY_LABEL} for security. Enter the email you used to sign up and we’ll send a new link.`,
      }
    case "auth_link_invalid":
      return {
        title: "We couldn’t verify this link",
        description:
          "The link may be invalid, already used, or expired. Request a new verification email below, or sign in if you’ve already verified.",
      }
    case "missing_payload":
      return {
        title: "This sign-in link is incomplete",
        description:
          "The link may have expired or been opened incorrectly. Request a new verification email below, or try signing in.",
      }
    case "session_failed":
      return {
        title: "We couldn’t complete sign-in",
        description:
          "Something went wrong while confirming your account. Try requesting a new verification email, or sign in with your password.",
      }
  }
}
