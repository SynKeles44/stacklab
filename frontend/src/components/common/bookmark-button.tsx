import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toggleBookmark, useIsBookmarked } from '@/lib/bookmarks'
import { cn } from '@/lib/utils'

type Props = { type: 'course' | 'module' | 'lesson' | 'term' | 'task' | 'project'; refKey: string; label: string; url: string; className?: string; size?: 'icon' | 'icon-sm' }

export function BookmarkButton({ type, refKey, label, url, className, size = 'icon' }: Props) {
  const active = useIsBookmarked(type, refKey)
  const [busy, setBusy] = useState(false)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={cn(active && 'text-brand', className)}
          aria-pressed={active}
          aria-label={active ? 'Lesezeichen entfernen' : 'Als Lesezeichen markieren'}
          disabled={busy}
          onClick={async (event) => {
            event.preventDefault()
            event.stopPropagation()
            setBusy(true)
            try {
              await toggleBookmark({ type, ref: refKey, label, url })
            } finally {
              setBusy(false)
            }
          }}
        >
          {active ? <BookmarkCheck className="fill-current/20" /> : <Bookmark />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{active ? 'Lesezeichen entfernen' : 'Lesezeichen setzen'}</TooltipContent>
    </Tooltip>
  )
}
