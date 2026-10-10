import { BookA, ExternalLink } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { TermPreview } from '@/lib/api'
import { requestUnlock, unlockEvents } from '@/lib/unlocks'

let observer: IntersectionObserver | null = null
const callbacks = new WeakMap<Element, () => void>()

function observe(element: Element, onVisible: () => void): () => void {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          callbacks.get(entry.target)?.()
          observer?.unobserve(entry.target)
        }
      }
    },
    { rootMargin: '0px 0px -15% 0px', threshold: 1 },
  )
  callbacks.set(element, onVisible)
  observer.observe(element)
  return () => observer?.unobserve(element)
}

const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

export function TermLink({ slug, term, children }: { slug: string; term: TermPreview | undefined; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [hover] = useState(canHover)
  const fresh = unlockEvents.use().some((event) => event.terms.some((item) => item.slug === slug))

  useEffect(() => {
    if (!ref.current || !term) return
    return observe(ref.current, () => requestUnlock(slug))
  }, [slug, term])

  const trigger = (
    <Link
      ref={ref}
      to={`/lexikon/${slug}`}
      data-unlocked={fresh ? 'fresh' : undefined}
      className="term-link cursor-help rounded-sm font-medium text-foreground underline decoration-brand/60 decoration-dotted decoration-2 underline-offset-4 transition-colors hover:bg-brand/10 hover:decoration-brand"
      onClick={(event) => {
        if (!hover) event.preventDefault()
      }}
    >
      {children}
    </Link>
  )

  if (!term) return trigger

  const content = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <BookA className="size-4 text-brand" />
        <span className="font-semibold">{term.term}</span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{term.short}</p>
      {term.example && <p className="rounded-md bg-muted px-2 py-1.5 font-mono text-xs leading-relaxed">{term.example.replace(/`/g, '')}</p>}
      <Link to={`/lexikon/${slug}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
        Im Lexikon öffnen <ExternalLink className="size-3" />
      </Link>
    </div>
  )

  if (hover) {
    return (
      <HoverCard openDelay={150} closeDelay={100}>
        <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
        <HoverCardContent className="w-80">{content}</HoverCardContent>
      </HoverCard>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[min(20rem,calc(100vw-2rem))]">{content}</PopoverContent>
    </Popover>
  )
}
