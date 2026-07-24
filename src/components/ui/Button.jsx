import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:bg-primary-hover disabled:bg-primary/40',
  secondary:
    'bg-card text-foreground border border-border hover:bg-card-hover disabled:opacity-40',
  ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-40',
  danger: 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 disabled:opacity-40',
}

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded-lg font-medium
        transition-colors duration-150 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </button>
  )
}
