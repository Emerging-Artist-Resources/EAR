/**
 * k6 load test — calendar public API
 *
 * Usage:
 *   BASE_URL=https://your-staging.vercel.app k6 run scripts/load/calendar.js
 *
 * Optional:
 *   K6_VUS=50 K6_DURATION=5m k6 run scripts/load/calendar.js
 */

import http from "k6/http"
import { check, sleep } from "k6"

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001"

export const options = {
  vus: Number(__ENV.K6_VUS || 50),
  duration: __ENV.K6_DURATION || "5m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
}

function calendarRangeUrl() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setMonth(to.getMonth() + 7)
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
    limit: "500",
    includeDeadlines: "true",
  })
  return `${BASE_URL}/api/calendar?${params}`
}

export default function () {
  const scenarios = [
    () => http.get(calendarRangeUrl()),
    () => http.get(`${BASE_URL}/api/calendar/recent`),
    () => http.get(`${BASE_URL}/api/calendar?q=dance&limit=100`),
  ]

  const fn = scenarios[Math.floor(Math.random() * scenarios.length)]
  const res = fn()

  check(res, {
    "status is 200 or 429": (r) => r.status === 200 || r.status === 429,
  })

  sleep(0.5 + Math.random())
}
