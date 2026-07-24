import { forwardRef } from 'react'

const Textarea = forwardRef(function Textarea(
  { label, error, hint, id, rows = 4, className = '', ...rest },
  ref
) {
  const inputId = id || rest.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={`resize-y rounded-lg border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground
          outline-none transition-colors focus:border-primary
          ${error ? 'border-destructive' : 'border-border'} ${className}`}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
})

export default Textarea
