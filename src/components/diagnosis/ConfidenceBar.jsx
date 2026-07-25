import ProgressBar from '@/components/ui/ProgressBar'
import { getConfidenceLevel } from '@/constants/status'

const TONE_BY_LEVEL = { high: 'success', medium: 'warning', low: 'error' }

export default function ConfidenceBar({ value }) {
  const level = getConfidenceLevel(value)
  return (
    <div className="flex items-center gap-2">
      <ProgressBar value={value * 100} tone={TONE_BY_LEVEL[level]} className="w-28" />
      <span className="text-xs tabular-nums text-muted-foreground">{Math.round(value * 100)}%</span>
    </div>
  )
}
