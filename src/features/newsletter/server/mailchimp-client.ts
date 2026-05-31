import type { getMailchimpEnv } from "./mailchimp-env"

export async function mailchimpRequest(
  env: NonNullable<ReturnType<typeof getMailchimpEnv>>,
  path: string,
  init: RequestInit,
): Promise<Response> {
  const url = `https://${env.serverPrefix}.api.mailchimp.com/3.0${path}`
  const auth = Buffer.from(`anystring:${env.apiKey}`).toString("base64")
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      ...init.headers,
    },
  })
}
