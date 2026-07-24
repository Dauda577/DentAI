import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pageCount, onPageChange }) {
  if (pageCount <= 1) return null

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-xs text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground
            hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground
            hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
