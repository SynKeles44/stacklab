import { BookA, BookMarked, GraduationCap, Home, LogIn, LogOut, Menu, NotebookPen, Search, Settings } from 'lucide-react'
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
import { clearSession, updateSessionUser, useSession } from '@/lib/auth'
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
    if (user) {
      Api.me()
        .then(({ user: fresh }) => updateSessionUser(fresh))
        .catch(() => undefined)
    }
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
      <div
        aria-hidden
        className={cn(
          'fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary transition-[transform,opacity] duration-500 ease-out',
          navigation.state === 'loading' ? 'scale-x-75 opacity-100' : 'scale-x-100 opacity-0',
        )}
      />

      <header className="sticky top-0 z-40 border-b bg-[var(--app-header)] backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
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
              <nav className="flex flex-col gap-0.5 px-3">
                {NAV.map((item) => <MobileLink key={item.to} {...item} />)}
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

          <Link to="/" className="mr-3 rounded-md focus-visible:ring-2 focus-visible:ring-ring" aria-label="Stacklab Startseite">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'bg-muted text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-8 w-52 items-center gap-2 rounded-md bg-muted px-2.5 text-sm text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:text-foreground lg:flex"
            >
              <Search className="size-4" />
              <span className="flex-1 text-left">Suchen</span>
              <Kbd>⌘K</Kbd>
            </button>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Suchen" onClick={() => setSearchOpen(true)}>
              <Search className="size-5" />
            </Button>
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Benutzermenü">
                    <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-[0.65rem] font-semibold text-background">
                      {initials(user.name)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-medium">{user.name}</div>
                    <div className="truncate text-xs font-normal text-muted-foreground">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/"><Home /> Übersicht</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/lesezeichen"><BookMarked /> Lesezeichen</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/notizen"><NotebookPen /> Notizen</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/einstellungen"><Settings /> Einstellungen</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={logout}><LogOut /> Abmelden</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" variant="default" className="ml-1">
                <Link to={`/anmelden?weiter=${encodeURIComponent(location.pathname)}`}>
                  <LogIn /> Anmelden
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="max-w-xs">
            <Logo className="text-foreground" />
            <p className="mt-3 leading-relaxed">IT lernen, indem du es tust. Open Source unter MIT-Lizenz, läuft komplett auf deinem Rechner.</p>
          </div>
          <nav aria-label="Fußzeile" className="flex gap-16">
            <div className="flex flex-col gap-2">
              <p className="eyebrow mb-1">Lernen</p>
              <Link to="/kurse" className="hover:text-foreground">Kurse</Link>
              <Link to="/lexikon" className="hover:text-foreground">Lexikon</Link>
              <Link to="/suche" className="hover:text-foreground">Suche</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="eyebrow mb-1">Projekt</p>
              <a className="hover:text-foreground" href="https://github.com/SynKeles44/stacklab" target="_blank" rel="noreferrer">Quellcode</a>
              <a className="hover:text-foreground" href="https://github.com/SynKeles44" target="_blank" rel="noreferrer">SynKeles44</a>
            </div>
          </nav>
        </div>
      </footer>

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <UnlockOverlay />
      <ScrollRestoration />
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

function MobileLink({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Home; end: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted', isActive && 'bg-muted')}>
      <Icon className="size-4 text-muted-foreground" /> {label}
    </NavLink>
  )
}
