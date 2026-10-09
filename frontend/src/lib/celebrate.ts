import confetti from 'canvas-confetti'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
