import { Button } from "@/components/ui/button"

interface ReviewActionsProps {
  comments: string
  onCommentsChange: (comments: string) => void
  onApprove: () => void
  onReject: () => void
  submitting: boolean
}

export function ReviewActions({ 
  comments, 
  onCommentsChange, 
  onApprove, 
  onReject, 
  submitting 
}: ReviewActionsProps) {
  return (
    <div className="pt-4 border-t border-[var(--gray-200)]">
      <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
        Review comments (optional)
      </label>
      <textarea
        className="w-full rounded-md border border-[var(--gray-300)] p-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-600)]"
        rows={3}
        placeholder="Add comments for the submitter…"
        value={comments}
        onChange={e => onCommentsChange(e.target.value)}
      />
      <div className="mt-3 flex gap-3">
        <Button
          onClick={onApprove}
          disabled={submitting}
          className="bg-[var(--success-600)] hover:bg-[var(--success-500)]"
        >
          {submitting ? "Processing…" : "Approve"}
        </Button>
        <Button
          onClick={onReject}
          disabled={submitting}
          className="bg-[var(--error-600)] hover:bg-[var(--error-500)]"
        >
          {submitting ? "Processing…" : "Reject"}
        </Button>
      </div>
    </div>
  )
}
