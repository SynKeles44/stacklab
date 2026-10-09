import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Api } from '@/lib/api'
import { updateSessionUser } from '@/lib/auth'
import { applyUiVariant, type UiVariant, useUiVariant } from '@/lib/ui-variant'
import { cn } from '@/lib/utils'

const OPTIONS: { value: UiVariant; title: string; description: string }[] = [
  { value: 'standard', title: 'Standard', description: 'Ruhig und kompakt, Kacheln und klare Linien.' },
  { value: 'apple', title: 'Apple', description: 'Systemschrift, gruppierte Listen, durchscheinende Leisten, Tab-Leiste auf dem Handy.' },
]

function Preview({ variant }: { variant: UiVariant }) {
  if (variant === 'apple') {
    return (
      <div className="h-24 overflow-hidden rounded-lg bg-[#f2f2f7] p-2 dark:bg-black">
        <div className="mb-1.5 h-2.5 w-14 rounded-sm bg-black/80 dark:bg-white/80" />
        <div className="overflow-hidden rounded-md bg-white dark:bg-[#1c1c1e]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1.5 border-b border-black/5 px-1.5 py-1 last:border-0 dark:border-white/10">
              <span className="size-2.5 rounded-[3px] bg-[#007aff]" />
              <span className="h-1.5 flex-1 rounded-sm bg-black/15 dark:bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="h-24 overflow-hidden rounded-lg bg-muted p-2">
      <div className="mb-1.5 h-2 w-16 rounded-sm bg-foreground/70" />
      <div className="grid grid-cols-2 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-md bg-card p-1.5 shadow-card">
            <span className="block size-2.5 rounded-[3px] bg-primary/30" />
            <span className="mt-1 block h-1.5 w-10 rounded-sm bg-foreground/15" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AppearancePicker() {
  const current = useUiVariant()

  const choose = async (value: string) => {
    const variant = value as UiVariant
    if (variant === current) return
    applyUiVariant(variant)
    try {
      const { user } = await Api.updateMe({ ui_variant: variant })
      updateSessionUser(user)
    } catch {
      toast.error('Die Auswahl konnte nicht gespeichert werden.')
    }
  }

  return (
    <RadioGroup value={current} onValueChange={choose} className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map((option) => (
        <Label
          key={option.value}
          htmlFor={`ui-${option.value}`}
          className={cn('pressable block cursor-pointer rounded-xl bg-card p-3 font-normal shadow-card', current === option.value && 'ring-2 ring-primary')}
        >
          <Preview variant={option.value} />
          <div className="mt-3 flex items-start gap-2">
            <RadioGroupItem id={`ui-${option.value}`} value={option.value} className="mt-0.5" />
            <div>
              <p className="flex items-center gap-1.5 font-medium">
                {option.title} {current === option.value && <Check className="size-3.5 text-primary" />}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{option.description}</p>
            </div>
          </div>
        </Label>
      ))}
    </RadioGroup>
  )
}
