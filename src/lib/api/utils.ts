import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { isSentryDisabled } from '@/lib/launch-flags'

/**
 * Standard API error response structure
 */
export type ApiError = {
  code: string
  message?: string
  details?: unknown
}

/**
 * Standard API response structure
 */
export type ApiResponse<T = unknown> = {
  data?: T
  error?: ApiError
}

/**
 * Common error codes used across the application
 */
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
} as const

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: string,
  message?: string,
  details?: unknown,
  status = 500
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  )
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status })
}

/** Supabase/Postgres errors when a listing id is invalid or missing. */
export function isListingNotFoundError(error: unknown): boolean {
  if (error == null) return false

  const code =
    typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code
      : ""
  const message =
    typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : error instanceof Error
        ? error.message
        : ""

  if (code === "PGRST116" || code === "22P02") return true
  if (/not found/i.test(message)) return true
  if (/invalid input syntax for type uuid/i.test(message)) return true
  if (/JSON object requested, multiple \(or no\) rows returned/i.test(message)) return true

  return false
}

/**
 * Handles errors in API routes with consistent error responses
 */
export function handleApiError(
  error: unknown,
  context?: { route?: string },
): NextResponse<ApiResponse> {
  console.error('API Error:', error)

  if (!isSentryDisabled() && error instanceof Error) {
    Sentry.captureException(error, {
      tags: context?.route ? { route: context.route } : undefined,
    })
  } else if (!isSentryDisabled() && error) {
    Sentry.captureException(error)
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return createErrorResponse(
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      error.issues,
      400
    )
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, error.message, undefined, 401)
    }

    if (error.message === 'Forbidden') {
      return createErrorResponse(ErrorCodes.FORBIDDEN, error.message, undefined, 403)
    }

    if (error.message.includes('not found') || error.message.includes('Not Found')) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, error.message, undefined, 404)
    }

    // Generic error
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      process.env.NODE_ENV === 'development' ? error.message : 'An internal error occurred',
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
      500
    )
  }

  // Unknown error type
  return createErrorResponse(
    ErrorCodes.INTERNAL_ERROR,
    'An unexpected error occurred',
    undefined,
    500
  )
}

/**
 * Wraps an API route handler with error handling
 */
export function withErrorHandling<T>(
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (req: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(req)
    } catch (error) {
      return handleApiError(error) as NextResponse<ApiResponse<T>>
    }
  }
}

/**
 * Validates request body against a Zod schema
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: { parse: (data: unknown) => T }
): T {
  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw error
    }
    throw new Error('Invalid request body')
  }
}

/**
 * Gets query parameter with type safety
 */
export function getQueryParam(
  req: NextRequest,
  key: string,
  defaultValue?: string
): string | undefined {
  const url = new URL(req.url)
  return url.searchParams.get(key) ?? defaultValue
}

/** Trimmed query param, or undefined when missing/blank. */
export function getOptionalQueryParam(
  req: NextRequest,
  key: string,
): string | undefined {
  const value = getQueryParam(req, key)?.trim()
  return value || undefined
}

/**
 * Gets query parameter as array
 */
export function getQueryParamArray(
  req: NextRequest,
  key: string
): string[] {
  const url = new URL(req.url)
  const value = url.searchParams.get(key)
  return value ? value.split(',').filter(Boolean) : []
}

/**
 * Gets query parameter as number with validation
 */
export function getQueryParamNumber(
  req: NextRequest,
  key: string,
  defaultValue?: number,
  min?: number,
  max?: number
): number {
  const url = new URL(req.url)
  const value = url.searchParams.get(key)
  
  if (!value) {
    if (defaultValue !== undefined) return defaultValue
    throw new Error(`Missing required query parameter: ${key}`)
  }

  const num = Number(value)
  if (isNaN(num)) {
    throw new Error(`Invalid number for query parameter: ${key}`)
  }

  if (min !== undefined && num < min) {
    throw new Error(`Query parameter ${key} must be at least ${min}`)
  }

  if (max !== undefined && num > max) {
    throw new Error(`Query parameter ${key} must be at most ${max}`)
  }

  return num
}
