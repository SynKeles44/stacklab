import { DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TaskOf } from '@/lib/content-schemas'
import { seededShuffle } from '@/lib/format'
import { cn } from '@/lib/utils'

type Placement = Record<number, string | null>

export function DragDropTask({ task, onSolved, onAttempt }: { task: TaskOf<'dragdrop'>; onSolved: () => void; onAttempt: () => void }) {
  const order = useMemo(() => seededShuffle(task.items.map((_, index) => index), task.id), [task])
  const [placement, setPlacement] = useState<Placement>({})
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const place = (item: number, target: string | null) => {
    setChecked(false)
    setPlacement((previous) => ({ ...previous, [item]: target }))
    setSelected(null)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const item = Number(event.active.id)
    place(item, event.over ? String(event.over.id) : null)
  }

  const unplaced = order.filter((index) => !placement[index])
  const allPlaced = unplaced.length === 0
  const correct = allPlaced && task.items.every((item, index) => placement[index] === item.target)

  const check = () => {
    setChecked(true)
    onAttempt()
    if (correct) onSolved()
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <p className="text-sm text-muted-foreground">Ziehe die Karten in die passenden Felder – oder tippe erst eine Karte und dann ein Feld an.</p>
      <Pool selected={selected} onSelect={setSelected} onTap={() => selected !== null && place(selected, null)}>
        {unplaced.map((index) => (
          <Chip key={index} index={index} label={task.items[index]!.label} selected={selected === index} onSelect={() => setSelected(selected === index ? null : index)} />
        ))}
        {unplaced.length === 0 && <span className="text-sm text-muted-foreground">Alle Karten sind verteilt.</span>}
      </Pool>
      <div className="grid gap-3 sm:grid-cols-2">
        {task.targets.map((target) => (
          <Target key={target.id} id={target.id} label={target.label} active={selected !== null} onTap={() => selected !== null && place(selected, target.id)}>
            {order
              .filter((index) => placement[index] === target.id)
              .map((index) => (
                <Chip
                  key={index}
                  index={index}
                  label={task.items[index]!.label}
                  selected={selected === index}
                  onSelect={() => setSelected(selected === index ? null : index)}
                  state={checked ? (task.items[index]!.target === target.id ? 'right' : 'wrong') : undefined}
                />
              ))}
          </Target>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={check} disabled={!allPlaced}>Prüfen</Button>
        <Button variant="ghost" onClick={() => { setPlacement({}); setChecked(false) }}>
          <RotateCcw /> Neu verteilen
        </Button>
        {checked && (
          <span className={cn('flex items-center gap-1.5 text-sm font-medium', correct ? 'text-success' : 'text-destructive')}>
            {correct ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            {correct ? 'Alles richtig zugeordnet!' : 'Die rot markierten Karten gehören woanders hin.'}
          </span>
        )}
      </div>
    </DndContext>
  )
}

function Pool({ children, onTap }: { children: React.ReactNode; selected: number | null; onSelect: (value: number | null) => void; onTap: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: '__pool__' })
  return (
    <div ref={setNodeRef} onClick={onTap} className={cn('my-3 flex min-h-14 flex-wrap gap-2 rounded-xl border border-dashed p-3', isOver && 'border-brand bg-brand/5')}>
      {children}
    </div>
  )
}

function Target({ id, label, children, active, onTap }: { id: string; label: string; children: React.ReactNode; active: boolean; onTap: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      onClick={onTap}
      className={cn('min-h-24 rounded-xl border-2 border-dashed p-3 transition-colors', isOver && 'border-brand bg-brand/5', active && 'cursor-pointer border-brand/50')}
    >
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function Chip({ index, label, selected, onSelect, state }: { index: number; label: string; selected: boolean; onSelect: () => void; state?: 'right' | 'wrong' }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(index) })
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        'touch-none rounded-lg border bg-card px-3 py-1.5 font-mono text-sm shadow-sm transition-shadow select-none hover:shadow-md',
        selected && 'ring-2 ring-brand',
        isDragging && 'z-10 opacity-80 shadow-lg',
        state === 'right' && 'border-success bg-success/10',
        state === 'wrong' && 'border-destructive bg-destructive/10',
      )}
    >
      {label}
    </button>
  )
}
