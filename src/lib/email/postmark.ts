/**
 * Postmark Client Configuration
 * 
 * Initializes the Postmark ServerClient for transactional emails.
 * 
 * Requires: POSTMARK_TRANSACTIONAL_TOKEN environment variable
 * 
 * @see EMAIL_SYSTEM.md for setup and configuration
 */

import Postmark from "postmark"

const postmarkToken = process.env.POSTMARK_TRANSACTIONAL_TOKEN

export const postmarkClient: Postmark.ServerClient | null = postmarkToken
  ? new Postmark.ServerClient(postmarkToken)
  : null
