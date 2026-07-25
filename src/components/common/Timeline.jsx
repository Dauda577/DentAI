const STATUS_DOT = {
  complete: 'bg-success',
  active: 'bg-primary',
  pending: 'bg-border',
}

/**
 * items: { title, subtitle?, status?: 'complete'|'active'|'pending', content? }[]
 */
export default function Timeline({ items = [] }) {
  return (
    <ol className="relative">
      {items.map((item, i) => (
        <li key={i} className="relative flex gap-4 pb-8 last:pb-0">
          {i < items.length - 1 && (
            <span className="absolute left-[7px] top-4 h-full w-px bg-border" aria-hidden="true" />
          )}
          <span
            className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-bg ${
              STATUS_DOT[item.status] ?? STATUS_DOT.pending
            }`}
          />
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
            </div>
            {item.content && <div className="mt-1.5">{item.content}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
