import { BookA, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'
import { unlockEvents } from '@/lib/unlocks'

export function UnlockOverlay() {
  const events = unlockEvents.use()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-3 px-4 sm:bottom-6 sm:items-end sm:pr-6">
      <AnimatePresence>
        {events.map((event) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur"
          >
            <motion.div
              className="absolute inset-0 -z-10 opacity-60"
              style={{ background: 'radial-gradient(circle at 20% 0%, color-mix(in oklab, var(--brand) 25%, transparent), transparent 60%)' }}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1.4 }}
              transition={{ duration: 1.2 }}
            />
            <div className="flex items-start gap-3">
              <motion.span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand"
                initial={{ rotate: -30, scale: 0.4 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
              >
                <Sparkles className="size-5" />
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {event.terms.length === 1 ? 'Neuer Begriff freigeschaltet!' : `${event.terms.length} neue Begriffe freigeschaltet!`}
                </p>
                <ul className="mt-1 space-y-1">
                  {event.terms.slice(0, 4).map((term) => (
                    <li key={term.slug} className="text-sm">
                      <Link to={`/lexikon/${term.slug}`} className="font-semibold hover:underline">{term.term}</Link>
                      <span className="text-muted-foreground"> – {term.short}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookA className="size-3.5" /> Dein Lexikon: {event.count} von {event.total} Begriffen
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
