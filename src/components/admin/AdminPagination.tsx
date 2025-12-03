"use client"

export function AdminPagination({
  page,
  limit,
  total,
  onPageChange,
}: {
  page: number
  limit: number
  total: number
  onPageChange: (next: number) => void
}) {
  const totalPages = Math.max(Math.ceil(total / limit), 1)
  const canPrev = page > 0
  const canNext = page + 1 < totalPages

  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-sm text-[var(--gray-600)]">
        Page <span className="font-medium">{page + 1}</span> of{" "}
        <span className="font-medium">{totalPages}</span> —{" "}
        <span className="font-medium">{total}</span> total
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className={`px-3 py-2 rounded-md border transition-custom ${
            canPrev
              ? "bg-white hover:bg-[var(--gray-100)]"
              : "bg-[var(--gray-100)] opacity-60 cursor-not-allowed"
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className={`px-3 py-2 rounded-md border transition-custom ${
            canNext
              ? "bg-white hover:bg-[var(--gray-100)]"
              : "bg-[var(--gray-100)] opacity-60 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  )
}
