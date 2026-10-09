import confetti from 'canvas-confetti'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function celebrateSmall(origin?: { x: number; y: number }): void {
  if (reduced()) return
  void confetti({ particleCount: 60, spread: 70, startVelocity: 32, origin: origin ?? { x: 0.5, y: 0.7 }, colors: ['#7c3aed', '#22d3ee', '#a78bfa', '#34d399'], disableForReducedMotion: true })
}

export function celebrateBig(): void {
  if (reduced()) return
  const end = Date.now() + 1200
  const colors = ['#7c3aed', '#22d3ee', '#a78bfa', '#34d399', '#fbbf24']
  ;(function frame() {
    void confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true })
    void confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

export function originFromElement(element: Element | null): { x: number; y: number } | undefined {
  if (!element) return undefined
  const rect = element.getBoundingClientRect()
  return { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight }
}
