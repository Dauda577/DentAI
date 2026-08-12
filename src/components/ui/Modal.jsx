import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  const dialogRef = useRef(null)
  const lastFocusedRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    lastFocusedRef.current = document.activeElement
    const focusable = dialogRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.[0]?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
        return
      }
      if (e.key === 'Tab' && focusable?.length) {
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      lastFocusedRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-5xl' }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative w-full ${widths[size]} rounded-card border border-border bg-card shadow-xl`}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="font-display text-base font-medium text-foreground">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-md p-1 text-muted-foreground hover:bg-card-hover hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="px-5 py-4">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
