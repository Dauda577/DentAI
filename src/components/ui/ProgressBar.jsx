const TONES = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
}

export default function ProgressBar({ value = 0, tone = 'accent', className = '', showLabel = false }) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/40">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${TONES[tone]}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && <span className="text-xs tabular-nums text-muted-foreground">{Math.round(clamped)}%</span>}
    </div>
  )
}
