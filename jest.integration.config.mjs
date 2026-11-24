import nextJest from "next/jest.js"

const createJestConfig = nextJest({
  dir: "./",
})

const config = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/app/api/stripe/webhook/webhook-retry.integration.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 60_000,
  maxWorkers: 1,
}

export default createJestConfig(config)
