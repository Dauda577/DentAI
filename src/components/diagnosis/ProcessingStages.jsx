import { motion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'
import ProgressBar from '@/components/ui/ProgressBar'
import { DIAGNOSIS_STAGE, DIAGNOSIS_STAGE_LABEL } from '@/constants/status'

const STAGE_ORDER = [
  DIAGNOSIS_STAGE.UPLOADING,
  DIAGNOSIS_STAGE.PREPARING,
  DIAGNOSIS_STAGE.PROCESSING,
  DIAGNOSIS_STAGE.GENERATING,
  DIAGNOSIS_STAGE.FINALIZING,
]

export default function ProcessingStages({ currentStage, progress = 0 }) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)

  return (
    <div className="flex flex-col gap-6">
      <ProgressBar value={progress} showLabel tone="primary" />

      <ol className="flex flex-col gap-3">
        {STAGE_ORDER.map((stage, i) => {
          const isDone = currentIndex > i || currentIndex === -1
          const isActive = currentIndex === i

          return (
            <motion.li
              key={stage}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors
                ${isActive ? 'border-primary/40 bg-primary/5' : 'border-border'}`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-success" />
              ) : isActive ? (
                <Loader2 className="h-4.5 w-4.5 shrink-0 animate-spin text-primary" />
              ) : (
                <span className="h-4.5 w-4.5 shrink-0 rounded-full border-2 border-border" />
              )}
              <span className={`text-sm ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {DIAGNOSIS_STAGE_LABEL[stage]}
              </span>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
