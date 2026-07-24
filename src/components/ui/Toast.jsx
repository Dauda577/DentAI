import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useContext } from 'react'
import { NotificationContext } from '@/contexts/NotificationContext'

const ICONS = {
  success: { Icon: CheckCircle2, className: 'text-success' },
  error: { Icon: XCircle, className: 'text-destructive' },
  warning: { Icon: AlertTriangle, className: 'text-warning' },
  info: { Icon: Info, className: 'text-accent' },
}

export default function ToastContainer() {
  const ctx = useContext(NotificationContext)
  if (!ctx) return null
  const { toasts, dismiss } = ctx

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const { Icon, className } = ICONS[toast.type] ?? ICONS.info
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 shadow-lg"
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} />
              <p className="flex-1 text-sm text-foreground">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
