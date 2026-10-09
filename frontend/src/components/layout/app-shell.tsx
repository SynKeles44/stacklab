import { BookA, BookMarked, GraduationCap, Home, LogIn, LogOut, Menu, NotebookPen, Search, Settings, UserRound } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate, useNavigation } from 'react-router'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { UnlockOverlay } from '@/components/common/unlock-overlay'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Kbd } from '@/components/ui/kbd'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Api } from '@/lib/api'
import { clearSession, useSession } from '@/lib/auth'
import { loadBookmarks } from '@/lib/bookmarks'
import { cn } from '@/lib/utils'
import { SearchPalette } from './search-palette'

const NAV = [
  { to: '/', label: 'Start', icon: Home, end: true },
  { to: '/kurse', label: 'Kurse', icon: GraduationCap, end: false },
  { to: '/lexikon', label: 'Lexikon', icon: BookA, end: false },
]

export function AppShell() {
  const user = useSession()
  const navigation = useNavigation()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    void loadBookmarks(true)
  }, [user?.id])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  const logout = async () => {
    await Api.logout().catch(() => undefined)
    clearSession()
    navigate('/')
  }

  return (
    <div className="flex min-h-svh flex-col">
      <AnimatePresence>
        {navigation.state === 'loading' && (
          <motion.div
            className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-brand-2 to-brand"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.85, transition: { duration: 2, ease: 'easeOut' } }}
            exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.25 } }}
          />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menü öffnen">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle><Logo /></SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV.map((item) => (
                  <MobileLink key={item.to} {...item} />
                ))}
                {user && (
                  <>
                    <div className="my-2 border-t" />
                    <MobileLink to="/lesezeichen" label="Lesezeichen" icon={BookMarked} end />
                    <MobileLink to="/notizen" label="Notizen" icon={NotebookPen} end />
                    <MobileLink to="/einstellungen" label="Einstellungen" icon={Settings} end />
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="mr-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring" aria-label="Stacklab Startseite">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn('rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', isActive && 'bg-muted text-foreground')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="outline" className="hidden h-9 w-56 justify-start gap-2 text-muted-foreground lg:flex" onClick={() => setSearchOpen(true)}>
              <Search className="size-4" />
              <span className="flex-1 text-left">Suchen …</span>
              <Kbd>⌘K</Kbd>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Suchen" onClick={() => setSearchOpen(true)}>
              <Search className="size-5" />
            </Button>
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Benutzermenü">
                    <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-2 to-brand text-xs font-bold text-white">
                      {user.name.slice(0, 2).toUpperCase()}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-semibold">{user.name}</div>
                    <div className="truncate text-xs font-normal text-muted-foreground">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/"><Home /> Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/lesezeichen"><BookMarked /> Lesezeichen</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/notizen"><NotebookPen /> Notizen</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/einstellungen"><Settings /> Einstellungen</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={logout}><LogOut /> Abmelden</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="ml-1">
                <Link to={`/anmelden?weiter=${encodeURIComponent(location.pathname)}`}>
                  <LogIn /> <span className="hidden sm:inline">Anmelden</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <Logo className="opacity-80" />
          <p className="text-center">
            Open Source unter MIT-Lizenz · von{' '}
            <a className="font-medium text-foreground hover:underline" href="https://github.com/SynKeles44" target="_blank" rel="noreferrer">SynKeles44</a>{' '}
            · <a className="hover:underline" href="https://github.com/SynKeles44/stacklab" target="_blank" rel="noreferrer">GitHub</a>
          </p>
          {!user && (
            <Link to="/registrieren" className="flex items-center gap-1 hover:text-foreground">
              <UserRound className="size-4" /> Konto anlegen
            </Link>
          )}
        </div>
      </footer>

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <UnlockOverlay />
      <ScrollRestoration />
    </div>
  )
}

function MobileLink({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Home; end: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted', isActive && 'bg-muted text-brand')}
    >
      <Icon className="size-4" /> {label}
    </NavLink>
  )
}
