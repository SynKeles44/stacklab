/** Renders search excerpts whose matches are wrapped in ⟦ ⟧ markers – as text, never as HTML. */
export function HighlightedExcerpt({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(⟦[^⟧]*⟧)/g)
  return (
    <p className={className}>
      {parts.map((part, index) =>
        part.startsWith('⟦') ? (
          <mark key={index} className="rounded bg-brand/20 px-0.5 text-foreground">
            {part.slice(1, -1)}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  )
}
