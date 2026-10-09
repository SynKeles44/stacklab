import { BookA } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { unlockEvents } from '@/lib/unlocks'

export function UnlockOverlay() {
  const events = unlockEvents.use()
  const reduceMotion = useReducedMotion()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6">
      <AnimatePresence initial={false}>
        {events.map((event) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, transform: reduceMotion ? 'none' : 'translateY(12px) scale(0.98)' }}
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            exit={{ opacity: 0, transform: reduceMotion ? 'none' : 'translateY(6px)', transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-auto w-full max-w-sm rounded-xl bg-popover p-3.5 shadow-raised"
          >
            <div className="flex items-start gap-3">
              <BookA className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{event.terms.length === 1 ? 'Neuer Begriff im Lexikon' : `${event.terms.length} neue Begriffe im Lexikon`}</p>
                <ul className="mt-1 space-y-0.5">
                  {event.terms.slice(0, 3).map((term) => (
                    <li key={term.slug} className="truncate text-sm text-muted-foreground">
                      <Link to={`/lexikon/${term.slug}`} className="text-foreground hover:underline">{term.term}</Link> – {term.short}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">{event.count} von {event.total} Begriffen</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
