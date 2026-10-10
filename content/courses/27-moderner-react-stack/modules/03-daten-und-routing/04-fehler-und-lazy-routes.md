---
title: Fehlerseiten und Lazy Routes
summary: Fehler aus Loadern und Komponenten mit ErrorBoundary abfangen, gezielt 404 auslösen und selten genutzte Seiten mit lazy erst bei Bedarf laden.
duration: 20
sources:
  - title: React Router – Error Boundaries
    url: https://reactrouter.com/how-to/error-boundary
  - title: React Router – Route Object (lazy)
    url: https://reactrouter.com/start/data/route-object
  - title: Vite – Code Splitting
    url: https://vite.dev/guide/features#dynamic-import
  - title: MDN – import()
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Operators/import
quiz:
  - type: single
    question: >-
      Ein Loader wirft `data('Buch nicht gefunden', { status: 404 })`. Was zeigt die App?
    options:
      - Eine weiße Seite und einen Fehler in der Konsole
      - Die nächstgelegene ErrorBoundary; dort liefert isRouteErrorResponse(error) true mit status 404
      - Die Komponente der Route mit leeren Daten
      - Die Standard-404-Seite des Webservers
    answer: 1
    explanation: >
      Geworfene Fehler – auch absichtlich geworfene Antworten – landen in der nächsten ErrorBoundary nach oben im
      Routen-Baum. `isRouteErrorResponse` unterscheidet solche Antworten von echten Programmfehlern.
  - type: multiple
    question: Welche Aussagen über ErrorBoundary und errorElement stimmen?
    options:
      - "`ErrorBoundary: Komponente` und `errorElement: <Element />` erfüllen denselben Zweck."
      - Eine Route darf beide gleichzeitig haben.
      - Hat eine Kind-Route keine eigene ErrorBoundary, übernimmt die der Eltern-Route.
      - In der Fehlerkomponente liest du den Fehler mit useRouteError().
    answers: [0, 2, 3]
    explanation: Beide Schreibweisen schließen sich gegenseitig aus. Fehler „blubbern“ nach oben bis zur nächsten Route mit Fehleranzeige.
  - type: match
    question: Ordne jeden Begriff seiner Bedeutung zu.
    pairs:
      - { left: "lazy", right: "Route-Eigenschaft, die Code erst bei Bedarf lädt" }
      - { left: "import('./stats')", right: "dynamischer Import, der ein Promise liefert" }
      - { left: "Chunk", right: "eigene JavaScript-Datei im Build" }
      - { left: "Code-Splitting", right: "Aufteilen des Bundles in mehrere Dateien" }
    explanation: Ein dynamischer Import ist das Signal für Vite, an dieser Stelle einen eigenen Chunk zu erzeugen.
  - type: find-bug
    question: Die Statistik-Seite soll ein eigener Chunk werden, landet aber trotzdem im Haupt-Bundle. Warum?
    language: tsx
    code: |
      import { createBrowserRouter } from 'react-router'
      import { RootLayout } from '@/routes/root'
      import { StatsPage } from '@/routes/stats'

      export const router = createBrowserRouter([
        {
          path: '/',
          Component: RootLayout,
          children: [
            {
              path: 'statistik',
              lazy: async () => {
                const module = await import('@/routes/stats')
                return { Component: module.StatsPage }
              },
            },
          ],
        },
      ])
    bug_line: 3
    explanation: Der statische Import in Zeile 3 zieht das Modul ins Haupt-Bundle. Für Code-Splitting darf das Modul nur dynamisch über `import()` geladen werden.
tasks:
  - id: lazy-route
    type: terminal
    title: Fehlerseite, 404 und eine lazy Route
    description: |
      Im Ordner `lazy-route` liegt eine Router-App mit Startseite, Detailseite `buecher/:bookId` und einer
      Statistikseite, die bisher statisch importiert wird.

      1. Ändere in `src/routes/book.tsx` den `bookLoader`: Wird kein Buch gefunden, soll er
         `throw data('Dieses Buch gibt es nicht.', { status: 404 })` ausführen statt `null` zurückzugeben. Importiere dafür `data` aus `react-router`.
      2. Lege `src/routes/error-page.tsx` mit `RootErrorBoundary` an: Mit `useRouteError()` den Fehler lesen, bei
         `isRouteErrorResponse(error)` Status und Text anzeigen, sonst eine allgemeine Meldung.
      3. Hänge sie in `src/router.tsx` als `ErrorBoundary: RootErrorBoundary` an die Root-Route.
      4. Mache die Route `statistik` lazy: Entferne den statischen Import von `@/routes/stats` und lade `StatsPage`
         und `statsLoader` in `lazy: async () => { … await import('@/routes/stats') … }`.
      5. Baue mit `bun run build` und schau mit `ls dist/assets`, ob ein eigener Chunk für `stats` entstanden ist.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert einige Sekunden).
    workdir: lazy-route
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "app",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "tsc -b && vite build",
          "preview": "vite preview"
        },
        "dependencies": {
          "react": "^19.2.8",
          "react-dom": "^19.2.8"
        },
        "devDependencies": {
          "@types/node": "^24.13.3",
          "@types/react": "^19.2.18",
          "@types/react-dom": "^19.2.7",
          "@vitejs/plugin-react": "^6.1.1",
          "typescript": "^7.0.2",
          "vite": "^8.3.0"
        }
      }
      EOF
      cat > tsconfig.json <<'EOF'
      {
        "files": [],
        "references": [
          { "path": "./tsconfig.app.json" },
          { "path": "./tsconfig.node.json" }
        ]
      }
      EOF
      cat > tsconfig.app.json <<'EOF'
      {
        "compilerOptions": {
          "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
          "target": "es2023",
          "lib": ["ES2023", "DOM"],
          "module": "esnext",
          "types": ["vite/client"],
          "skipLibCheck": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "moduleDetection": "force",
          "noEmit": true,
          "jsx": "react-jsx",
          "strict": true,
          "noUnusedLocals": true,
          "noUnusedParameters": true
        },
        "include": ["src"]
      }
      EOF
      cat > tsconfig.node.json <<'EOF'
      {
        "compilerOptions": {
          "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
          "target": "es2023",
          "lib": ["ES2023"],
          "types": ["node"],
          "skipLibCheck": true,
          "module": "nodenext",
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "moduleDetection": "force",
          "noEmit": true,
          "strict": true
        },
        "include": ["vite.config.ts"]
      }
      EOF
      cat > vite.config.ts <<'EOF'
      import react from '@vitejs/plugin-react'
      import { defineConfig } from 'vite'

      export default defineConfig({
        plugins: [react()],
      })
      EOF
      cat > index.html <<'EOF'
      <!doctype html>
      <html lang="de">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Stacklab App</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.tsx"></script>
        </body>
      </html>
      EOF
      printf 'node_modules\ndist\n*.local\n' > .gitignore
      mkdir -p src
      cat > src/main.tsx <<'EOF'
      import { StrictMode } from 'react'
      import { createRoot } from 'react-dom/client'
      import './index.css'
      import App from './App.tsx'

      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <App />
        </StrictMode>,
      )
      EOF
      cat > src/App.tsx <<'EOF'
      export default function App() {
        return <h1>Hallo Stack</h1>
      }
      EOF
      printf 'body {\n  font-family: system-ui, sans-serif;\n}\n' > src/index.css
      bun install >/dev/null 2>&1
      bun add tailwindcss @tailwindcss/vite >/dev/null 2>&1
      cat > vite.config.ts <<'EOF'
      import path from 'node:path'
      import tailwindcss from '@tailwindcss/vite'
      import react from '@vitejs/plugin-react'
      import { defineConfig } from 'vite'

      export default defineConfig({
        plugins: [react(), tailwindcss()],
        resolve: {
          alias: {
            '@': path.resolve(import.meta.dirname, './src'),
          },
        },
      })
      EOF
      cat > tsconfig.json <<'EOF'
      {
        "files": [],
        "references": [
          { "path": "./tsconfig.app.json" },
          { "path": "./tsconfig.node.json" }
        ],
        "compilerOptions": {
          "paths": {
            "@/*": ["./src/*"]
          }
        }
      }
      EOF
      jq '.compilerOptions.paths = {"@/*": ["./src/*"]}' tsconfig.app.json > tsconfig.app.tmp && mv tsconfig.app.tmp tsconfig.app.json
      printf '@import "tailwindcss";\n' > src/index.css
      cat > src/App.tsx <<'EOF'
      export default function App() {
        return <h1 className="p-8 text-3xl font-bold">Hallo Stack</h1>
      }
      EOF
      bun add react-router >/dev/null 2>&1
      mkdir -p src/routes src/data
      cat > src/data/books.ts <<'EOF'
      export type Book = { id: string; title: string; author: string; year: number }

      export const books: Book[] = [
        { id: 'momo', title: 'Momo', author: 'Michael Ende', year: 1973 },
        { id: 'krabat', title: 'Krabat', author: 'Otfried Preußler', year: 1971 },
      ]
      EOF
      cat > src/routes/root.tsx <<'EOF'
      import { Link, NavLink, Outlet } from 'react-router'
      import { books } from '@/data/books'

      export function RootLayout() {
        return (
          <div className="mx-auto max-w-3xl p-6">
            <nav className="mb-6 flex gap-4">
              <NavLink to="/" end>Bücher</NavLink>
              <NavLink to="/statistik">Statistik</NavLink>
            </nav>
            <Outlet />
          </div>
        )
      }

      export function HomePage() {
        return (
          <ul>
            {books.map((book) => (
              <li key={book.id}><Link to={`/buecher/${book.id}`}>{book.title}</Link></li>
            ))}
          </ul>
        )
      }
      EOF
      cat > src/routes/book.tsx <<'EOF'
      import { useLoaderData, type LoaderFunctionArgs } from 'react-router'
      import { books } from '@/data/books'

      export async function bookLoader({ params }: LoaderFunctionArgs) {
        const book = books.find((entry) => entry.id === params.bookId)
        if (!book) {
          return null
        }
        return { book }
      }

      export function BookPage() {
        const result = useLoaderData<typeof bookLoader>()
        if (!result) return <p>Nicht gefunden</p>
        return <h1 className="text-2xl font-bold">{result.book.title} ({result.book.year})</h1>
      }
      EOF
      cat > src/routes/stats.tsx <<'EOF'
      import { useLoaderData } from 'react-router'
      import { books } from '@/data/books'

      export async function statsLoader() {
        const years = books.map((book) => book.year)
        return { count: books.length, oldest: Math.min(...years), newest: Math.max(...years) }
      }

      export function StatsPage() {
        const stats = useLoaderData<typeof statsLoader>()
        return (
          <section>
            <h1 className="text-2xl font-bold">Statistik</h1>
            <p>{stats.count} Bücher, erschienen zwischen {stats.oldest} und {stats.newest}.</p>
          </section>
        )
      }
      EOF
      cat > src/router.tsx <<'EOF'
      import { createBrowserRouter } from 'react-router'
      import { HomePage, RootLayout } from '@/routes/root'
      import { BookPage, bookLoader } from '@/routes/book'
      import { StatsPage, statsLoader } from '@/routes/stats'

      export const router = createBrowserRouter([
        {
          path: '/',
          Component: RootLayout,
          children: [
            { index: true, Component: HomePage },
            { path: 'buecher/:bookId', loader: bookLoader, Component: BookPage },
            { path: 'statistik', loader: statsLoader, Component: StatsPage },
          ],
        },
      ])
      EOF
      cat > src/main.tsx <<'EOF'
      import { StrictMode } from 'react'
      import { createRoot } from 'react-dom/client'
      import { RouterProvider } from 'react-router/dom'
      import { router } from '@/router'
      import './index.css'

      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <RouterProvider router={router} />
        </StrictMode>,
      )
      EOF
      rm -f src/App.tsx
    checks:
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cat > "$d/t.ts" <<'EOF'
          import { bookLoader } from '../src/routes/book'
          const found = (await bookLoader({ params: { bookId: 'momo' }, request: new Request('http://localhost/buecher/momo'), context: {} } as never)) as any
          let status = 'kein Fehler'
          try {
            await bookLoader({ params: { bookId: 'gibtsnicht' }, request: new Request('http://localhost/buecher/gibtsnicht'), context: {} } as never)
          } catch (error: any) {
            status = String(error?.init?.status ?? error?.status ?? 'anderer Fehler')
          }
          console.log(found?.book?.id, status)
          EOF
          bun "$d/t.ts"; status=$?; rm -rf "$d"; exit $status
        stdout_equals: "momo 404"
        message: bookLoader soll für unbekannte IDs throw data('…', { status 404 }) ausführen und für bekannte weiterhin { book } liefern.
      - type: file_contains
        path: src/routes/error-page.tsx
        pattern: "useRouteError\\(\\)"
        message: In src/routes/error-page.tsx fehlt useRouteError().
      - type: file_contains
        path: src/routes/error-page.tsx
        pattern: "isRouteErrorResponse\\("
        message: RootErrorBoundary soll mit isRouteErrorResponse(error) zwischen 404-Antworten und Programmfehlern unterscheiden.
      - type: file_contains
        path: src/router.tsx
        pattern: "ErrorBoundary\\s*:\\s*RootErrorBoundary|errorElement\\s*:"
        message: Die Root-Route in src/router.tsx braucht ErrorBoundary RootErrorBoundary.
      - type: command
        run: grep -Ec "^\s*import[^(]*from\s+['\"]@/routes/stats['\"]" src/router.tsx
        stdout_equals: "0"
        expect_exit: 1
        message: src/router.tsx importiert @/routes/stats noch statisch. Entferne die Import-Zeile – das Modul darf nur per import() geladen werden.
      - type: file_contains
        path: src/router.tsx
        pattern: "lazy\\s*:[\\s\\S]*import\\(\\s*['\"]@/routes/stats['\"]\\s*\\)"
        message: Die Route statistik soll lazy sein und @/routes/stats per await import('@/routes/stats') laden.
      - type: command
        run: bun run build >/dev/null 2>&1
        message: bun run build schlägt fehl. Führe ihn aus und lies die Fehlermeldung.
      - type: command
        run: ls dist/assets | grep -c "^stats-.*\.js$"
        stdout_equals: "1"
        message: Im Build fehlt ein eigener Chunk stats-….js. Prüfe, ob stats wirklich nur noch dynamisch importiert wird.
    hints:
      - "Importiere `data` zusätzlich aus react-router, dann: `if (!book) { throw data('Dieses Buch gibt es nicht.', { status: 404 }) }`."
      - "Lazy-Route: `{ path: 'statistik', lazy: async () => { const { StatsPage, statsLoader } = await import('@/routes/stats'); return { loader: statsLoader, Component: StatsPage } } }`"
      - "Fehlerseite: `const error = useRouteError(); if (isRouteErrorResponse(error)) return <h1>{error.status} {error.statusText}</h1>`"
    solution: |
      ```bash
      cd lazy-route
      sed -i "s#^import { useLoaderData, type LoaderFunctionArgs } from 'react-router'#import { data, useLoaderData, type LoaderFunctionArgs } from 'react-router'#" src/routes/book.tsx
      sed -i 's#    return null#    throw data('"'"'Dieses Buch gibt es nicht.'"'"', { status: 404 })#' src/routes/book.tsx
      cat > src/routes/error-page.tsx <<'EOF'
      import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

      export function RootErrorBoundary() {
        const error = useRouteError()
        if (isRouteErrorResponse(error)) {
          return (
            <main className="p-6">
              <h1 className="text-2xl font-bold">{error.status} {error.statusText}</h1>
              <p>{String(error.data)}</p>
              <Link to="/">Zur Startseite</Link>
            </main>
          )
        }
        return (
          <main className="p-6">
            <h1 className="text-2xl font-bold">Unerwarteter Fehler</h1>
            <p>{error instanceof Error ? error.message : 'Bitte lade die Seite neu.'}</p>
          </main>
        )
      }
      EOF
      cat > src/router.tsx <<'EOF'
      import { createBrowserRouter } from 'react-router'
      import { HomePage, RootLayout } from '@/routes/root'
      import { BookPage, bookLoader } from '@/routes/book'
      import { RootErrorBoundary } from '@/routes/error-page'

      export const router = createBrowserRouter([
        {
          path: '/',
          Component: RootLayout,
          ErrorBoundary: RootErrorBoundary,
          children: [
            { index: true, Component: HomePage },
            { path: 'buecher/:bookId', loader: bookLoader, Component: BookPage },
            {
              path: 'statistik',
              lazy: async () => {
                const { StatsPage, statsLoader } = await import('@/routes/stats')
                return { loader: statsLoader, Component: StatsPage }
              },
            },
          ],
        },
      ])
      EOF
      bun run build
      ls dist/assets
      ```
  - id: fehler-wohin
    type: dragdrop
    title: Wo landet der Fehler?
    description: |
      Die Root-Route hat eine ErrorBoundary, die Route `buecher/:bookId` hat zusätzlich eine eigene. Ordne jede
      Situation der Fehleranzeige zu, die erscheint.
    targets:
      - { id: buch, label: ErrorBoundary von buecher/:bookId }
      - { id: root, label: ErrorBoundary der Root-Route }
      - { id: keine, label: Gar keine – das ist kein Fehler }
    items:
      - { label: "bookLoader wirft data('…', { status: 404 })", target: buch }
      - { label: "BookPage stürzt beim Rendern mit einem TypeError ab", target: buch }
      - { label: "statsLoader (ohne eigene ErrorBoundary) wirft einen Fehler", target: root }
      - { label: "Eine URL passt zu keiner Route", target: root }
      - { label: "Eine action gibt data({ errors }, { status: 400 }) zurück", target: keine }
    hints:
      - Fehler wandern im Routen-Baum nach oben bis zur ersten Route mit Fehleranzeige. Zurückgegebene Daten sind kein Fehler.
---
Zwei Dinge unterscheiden eine Demo von einer echten App: Was passiert, wenn etwas schiefgeht? Und wie schnell
startet die App, wenn sie wächst? React Router beantwortet beides direkt an der Route – mit **Error Boundaries**
und **Lazy Routes**.

## Fehler fangen mit ErrorBoundary

Wirft ein Loader, eine Action oder eine Komponente beim Rendern einen Fehler, zeigt React Router statt der Seite
die [[error-boundary|ErrorBoundary]] der Route an:

```tsx title="src/routes/error-page.tsx"
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

export function RootErrorBoundary() {
  const error = useRouteError()
  if (isRouteErrorResponse(error)) {
    return <h1>{error.status} {error.statusText}</h1>   // z. B. 404 Not Found
  }
  return <p>{error instanceof Error ? error.message : 'Unbekannter Fehler'}</p>
}
```

```tsx title="src/router.tsx (Ausschnitt)"
{ path: '/', Component: RootLayout, ErrorBoundary: RootErrorBoundary, children: [ … ] }
```

Statt `ErrorBoundary: RootErrorBoundary` kannst du auch `errorElement: <RootErrorBoundary />` schreiben – beides
gleichzeitig geht nicht. Die Komponente bekommt keine Props; den Fehler liest sie mit `useRouteError()`.

> [!MERKSATZ]
> Fehler wandern im Routen-Baum nach oben bis zur nächsten Route mit ErrorBoundary. Eine an der Root-Route fängt
> alles ab – auch URLs, zu denen gar keine Route passt.

## Absichtlich scheitern: 404 aus dem Loader

Findet ein Loader nichts, ist das kein Programmfehler, sondern eine normale Situation. Du **wirfst** dann eine
Antwort mit Statuscode:

```tsx
export async function bookLoader({ params }: LoaderFunctionArgs) {
  const book = books.find((entry) => entry.id === params.bookId)
  if (!book) {
    throw data('Dieses Buch gibt es nicht.', { status: 404 })
  }
  return { book }
}
```

Geworfen wird hier kein `Error`, sondern eine Antwort mit Statuscode – genau wie ein Server mit 404 antwortet.
Der Vorteil: Die Komponente `BookPage` muss nie mit „kein Buch“ umgehen – sie wird nur gerendert, wenn es eines
gibt. `isRouteErrorResponse(error)` erkennt in der ErrorBoundary diese Antworten und liefert `status` und `data`.

> [!FEHLER]
> **`null` zurückgeben statt werfen.** Dann muss jede Komponente prüfen, ob Daten da sind, und der Typ aus
> `useLoaderData` ist plötzlich `… | null`. Wirf bei „nicht gefunden“ – das hält die Seiten-Komponente einfach.

## Lazy Routes: Code erst bei Bedarf

Ohne weitere Maßnahmen bündelt Vite die ganze App in **eine** JavaScript-Datei. Jede Person lädt dann auch den
Code für Admin-Bereich, Statistiken und Einstellungen – selbst wenn sie diese Seiten nie öffnet.

Mit [[lazy-route|`lazy`]] lädt der Router den Code einer Route erst, wenn sie zum ersten Mal gebraucht wird:

```tsx title="src/router.tsx (Ausschnitt)"
{
  path: 'statistik',
  lazy: async () => {
    const { StatsPage, statsLoader } = await import('@/routes/stats')
    return { loader: statsLoader, Component: StatsPage }
  },
},
```

Der [[dynamischer-import|dynamische Import]] `import('…')` ist das Signal für Vite: Hier entsteht beim Build ein
eigener [[chunk|Chunk]], z. B. `dist/assets/stats-CQ1EG2bq.js`. Dieses Aufteilen heißt
[[code-splitting|Code-Splitting]].

Seit React Router 7.5 gibt es auch eine Objekt-Form, die jede Eigenschaft einzeln lädt, z. B.
`lazy: { Component: async () => (await import('@/routes/stats')).StatsPage }`. Für den Einstieg reicht die
Funktions-Form.

## Wann sich lazy lohnt

| Lazy laden | Direkt importieren |
|---|---|
| selten besuchte Bereiche (Admin, Statistik) | Startseite, Layout |
| Seiten mit großen Bibliotheken (Charts, Editor) | kleine Seiten, die fast alle sehen |
| Bereiche nach dem Login | Fehlerseite der Root-Route |

> [!PRAXIS]
> Nach dem Umstellen prüfst du mit `bun run build` die Dateigrößen in der Ausgabe. Wird das Haupt-Bundle nicht
> kleiner, importiert meist noch irgendeine Datei das Modul **statisch** – dann landet es trotzdem im Haupt-Bundle.

## Zusammenfassung

- `ErrorBoundary` (oder `errorElement`) an einer Route zeigt Fehler aus Loadern, Actions und Rendern an.
- Fehler wandern nach oben bis zur nächsten Fehleranzeige; eine an der Root-Route fängt alles.
- `throw data('…', { status: 404 })` im Loader meldet „nicht gefunden“; `isRouteErrorResponse` erkennt das.
- `lazy` lädt Komponente und Loader einer Route erst bei Bedarf über `import()`.
- Ein dynamischer Import erzeugt beim Build einen eigenen Chunk – aber nur, wenn nirgends statisch importiert wird.
