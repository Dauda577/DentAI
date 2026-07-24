import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, hint, id, className = '', ...rest },
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
      <input
        id={inputId}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`h-10 rounded-lg border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground
          outline-none transition-colors focus:border-primary
          ${error ? 'border-destructive' : 'border-border'} ${className}`}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

export default Input
