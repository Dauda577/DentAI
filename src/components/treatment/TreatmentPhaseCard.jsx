import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

const STATUS_TONE = { Recommended: 'success', Conditional: 'warning', Monitor: 'info' }

export default function TreatmentPhaseCard({ phase }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-medium text-foreground">{phase.title}</h3>
            <Badge tone={STATUS_TONE[phase.status] ?? 'neutral'}>{phase.status}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{phase.duration}</p>
        </div>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="flex flex-col gap-4 px-5 py-4">
              <div>
                <p className="text-xs text-muted-foreground">Objectives</p>
                <p className="mt-1 text-sm text-foreground">{phase.objectives}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="mt-1 text-sm text-foreground">{phase.description}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recommendations</p>
                <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                  {phase.recommendations?.map((rec) => (
                    <li key={rec}>{rec}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expected outcomes</p>
                <p className="mt-1 text-sm text-foreground">{phase.expectedOutcomes}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
