// lib/email/sendEmail.ts
import { EmailType } from "./types"

type SendEmailParams = {
  to: string
  type: EmailType
  data: Record<string, any>
}

export async function sendEmail({ to, type, data }: SendEmailParams) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[EMAIL STUB]", type, to, data)
    return
  }

  // Real Postmark logic goes here later
}
