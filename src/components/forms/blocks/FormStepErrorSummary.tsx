import { Alert } from "@/components/ui/alert"

type FormStepErrorSummaryProps = {
  /** When null/empty, nothing is rendered. */
  message: string | null | undefined
  className?: string
}

/**
 * Inline alert for multi-step forms when validation fails (e.g. Continue on a wizard step).
 * Pair with per-field components using `errorMode="always"` after `trigger()`.
 */
export function FormStepErrorSummary({ message, className }: FormStepErrorSummaryProps) {
  if (!message?.trim()) return null

  return (
    <Alert
      variant="error"
      role="alert"
      aria-live="assertive"
      className={className}
    >
      <p className="text-sm font-medium">{message}</p>
    </Alert>
  )
}
