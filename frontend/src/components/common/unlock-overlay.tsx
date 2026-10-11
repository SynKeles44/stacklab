import { Sparkles } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { unlockEvents, type UnlockEvent } from '@/lib/unlocks'

export function UnlockOverlay() {
  const events = unlockEvents.use()
  const reduceMotion = useReducedMotion()
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 sm:top-[4.5rem] sm:bottom-auto sm:items-end sm:pr-6"
    >
      <AnimatePresence initial={false}>
        {events.map((event) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, transform: reduceMotion ? 'none' : 'scale(0.95)' }}
            animate={{ opacity: 1, transform: 'scale(1)' }}
            exit={{ opacity: 0, transform: reduceMotion ? 'none' : 'scale(0.98)', transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-auto w-full max-w-sm rounded-xl bg-popover p-3.5 shadow-raised"
          >
            <Content event={event} reduceMotion={reduceMotion === true} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function Content({ event, reduceMotion }: { event: UnlockEvent; reduceMotion: boolean }) {
  const percent = event.total ? Math.max(1, Math.round((event.count / event.total) * 100)) : 0
  return (
    <div className="flex items-start gap-3">
      <motion.span
        initial={reduceMotion ? false : { scale: 0.4, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0.45, delay: 0.05 }}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-spark/15 text-spark"
      >
        <Sparkles className="size-4" />
      </motion.span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{event.terms.length === 1 ? 'Neu in deinem Lexikon' : `${event.terms.length} neue Begriffe im Lexikon`}</p>
        <ul className="mt-1 space-y-0.5">
          {event.terms.slice(0, 3).map((term) => (
            <li key={term.slug} className="truncate text-sm text-muted-foreground">
              <Link to={`/lexikon/${term.slug}`} className="font-medium text-foreground hover:underline">
                {term.term}
              </Link>{' '}
              – {term.short}
            </li>
          ))}
        </ul>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-spark" style={{ width: `${percent}%` }} />
          </span>
          <span className="numeric text-xs text-muted-foreground">
            {event.count} / {event.total}
          </span>
        </div>
      </div>
    </div>
  )
}
