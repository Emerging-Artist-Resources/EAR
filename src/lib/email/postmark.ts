/**
 * Postmark Client Configuration
 * 
 * Initializes the Postmark ServerClient for transactional emails.
 * 
 * Requires: POSTMARK_SERVER_TOKEN environment variable
 * 
 * @see EMAIL_SYSTEM.md for setup and configuration
 */

import { ServerClient } from "postmark"

const postmarkToken = process.env.POSTMARK_SERVER_TOKEN

export const postmarkClient: ServerClient | null = postmarkToken
  ? new ServerClient(postmarkToken)
  : null
