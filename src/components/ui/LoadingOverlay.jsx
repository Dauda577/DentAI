import { Loader2 } from 'lucide-react'

export default function LoadingOverlay({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
