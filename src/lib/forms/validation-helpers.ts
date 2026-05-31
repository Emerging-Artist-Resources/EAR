/**
 * Shared validation helper utilities
 * Used by both signup and event form validation
 */

/**
 * Normalizes error messages from Zod validation to user-friendly format
 */
export function normalizeErrorMessage(
  message: string,
  fieldLabel: string
): string {
  const lowerMessage = message.toLowerCase()

  // Handle Zod enum errors
  if (
    message.includes("Invalid option") ||
    message.includes("expected one of") ||
    lowerMessage.includes("invalid input")
  ) {
    return `${fieldLabel} is required`
  }

  // Return custom messages if they contain "required"
  if (message.includes("required") || message.includes("is required")) {
    return message
  }

  // Default fallback
  return `${fieldLabel} is required`
}
