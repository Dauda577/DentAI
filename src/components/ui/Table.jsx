import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import Skeleton from './Skeleton'
import Pagination from './Pagination'

/**
 * Generic table. One instance drives Patients, Reports, and the Dashboard's
 * Recent Diagnoses table — columns and data shape are the only per-page
 * differences.
 *
 * columns: { key, header, render?(row), sortable? }[]
 * pagination: { page, pageCount, onPageChange } | undefined
 * sort: { key, direction } | undefined, onSortChange: (key) => void
 */
export default function Table({
  columns,
  data = [],
  loading = false,
  emptyMessage = 'Nothing to show yet.',
  sort,
  onSortChange,
  pagination,
  onRowClick,
}) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                  {col.sortable ? (
                    <button
                      onClick={() => onSortChange?.(col.key)}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {col.header}
                      {sort?.key === col.key ? (
                        sort.direction === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/60">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full max-w-[10rem]" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!loading &&
              data.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      onRowClick(row)
                    }
                  }}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  className={`border-b border-border/60 ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-card-hover focus-visible:bg-card-hover focus-visible:outline-none'
                      : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-foreground">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {pagination && <Pagination {...pagination} />}
    </div>
  )
}
