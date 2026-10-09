import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { RouterProvider } from 'react-router/dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from '@/router'
import './index.css'

const RELOAD_KEY = 'stacklab.chunk-reload'

window.addEventListener('vite:preloadError', (event) => {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return
    sessionStorage.setItem(RELOAD_KEY, '1')
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})
window.setTimeout(() => {
  try {
    sessionStorage.removeItem(RELOAD_KEY)
  } catch {
    return
  }
}, 10_000)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={200}>
        <RouterProvider router={router} />
        <Toaster position="bottom-center" richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
