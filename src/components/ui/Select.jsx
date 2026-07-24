import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder = 'Select…', id, className = '', ...rest },
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
      <div className="relative">
        <select
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          defaultValue=""
          className={`h-10 w-full appearance-none rounded-lg border bg-card px-3 pr-9 text-sm text-foreground
            outline-none transition-colors focus:border-primary
            ${error ? 'border-destructive' : 'border-border'} ${className}`}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
})

export default Select
