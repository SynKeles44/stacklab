---
title: React Router im Data Mode
summary: Mit createBrowserRouter und RouterProvider Routen als Objekte beschreiben, Layouts mit Outlet verschachteln und mit Link, NavLink und URL-Parametern navigieren.
duration: 25
sources:
  - title: React Router – Data Mode Installation
    url: https://reactrouter.com/start/data/installation
  - title: React Router – Routing (Data Mode)
    url: https://reactrouter.com/start/data/routing
  - title: React Router – Route Object
    url: https://reactrouter.com/start/data/route-object
  - title: React Router – Navigating (Data Mode)
    url: https://reactrouter.com/start/data/navigating
  - title: React Router – Upgrading from v7
    url: https://reactrouter.com/upgrading/v7
quiz:
  - type: single
    question: Woher importierst du in React Router 8 die Komponente `RouterProvider`?
    options:
      - aus `react-router-dom`
      - aus `react-router/dom`
      - aus `react-dom/router`
      - aus `@react-router/dev`
    answer: 1
    explanation: >
      Seit Version 8 gibt es das Paket `react-router-dom` nicht mehr. Fast alles kommt aus `react-router`, nur die
      DOM-spezifischen Teile wie `RouterProvider` aus dem Unterpfad `react-router/dom`.
  - type: multiple
    question: Welche Aussagen über `createBrowserRouter` stimmen?
    options:
      - Du erzeugst den Router einmal außerhalb deiner Komponenten.
      - Routen sind normale JavaScript-Objekte mit `path`, `Component`, `children` usw.
      - Den Router legst du am besten in einen useState, damit React ihn kennt.
      - Kind-Routen erscheinen dort, wo die Eltern-Komponente `<Outlet />` rendert.
    answers: [0, 1, 3]
    explanation: Der Router gehört nicht in den React-State. Du erzeugst ihn einmal auf Modulebene und gibst ihn an `<RouterProvider router={router} />`.
  - type: cloze
    text: "Eine Route, die genau beim Pfad ihrer Eltern-Route angezeigt wird, markierst du mit `___: true`. Einen URL-Parameter wie in `buecher/:bookId` liest du in einer Komponente mit dem Hook `use___()`."
    blanks:
      - [index]
      - [Params]
    explanation: >
      Index-Routen sind die „Startseite“ eines Layouts. `useParams()` liefert ein Objekt wie `{ bookId: 'momo' }`.
  - type: find-bug
    question: Beim Aufruf von /ueber erscheint nur der Header, aber nie der Inhalt der Seite. Wo liegt der Fehler?
    language: tsx
    code: |
      export function RootLayout() {
        return (
          <div>
            <header>
              <NavLink to="/">Start</NavLink>
              <NavLink to="/ueber">Über uns</NavLink>
            </header>
            <main />
          </div>
        )
      }
    bug_line: 8
    explanation: Das Layout rendert keinen `<Outlet />`. Ohne Outlet weiß der Router nicht, wo die passende Kind-Route erscheinen soll. Richtig ist `<main><Outlet /></main>`.
tasks:
  - id: erster-router
    type: terminal
    title: Zwei Seiten mit gemeinsamem Layout
    description: |
      Im Ordner `erster-router` liegt ein Vite-Projekt mit Tailwind, Alias `@` und installiertem `react-router`.
      Baue daraus eine App mit zwei Seiten im Data Mode.

      1. `src/routes/root.tsx`: Exportiere `RootLayout` mit einem Header, zwei `NavLink`s (zu `/` und `/ueber`)
         und einem `<Outlet />`.
      2. `src/routes/home.tsx` exportiert `HomePage`, `src/routes/about.tsx` exportiert `AboutPage` (je eine Überschrift genügt).
      3. `src/router.tsx`: Exportiere `router = createBrowserRouter([...])` mit einer Route `path: '/'`,
         `Component: RootLayout` und den Kind-Routen `{ index: true, Component: HomePage }` und
         `{ path: 'ueber', Component: AboutPage }`.
      4. `src/main.tsx` rendert `<RouterProvider router={router} />` – importiert aus `react-router/dom`.
      5. Baue mit `bun run build`.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert einige Sekunden).
    workdir: erster-router
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
    checks:
      - type: file_contains
        path: src/routes/root.tsx
        pattern: "<Outlet\\s*/>"
        message: RootLayout in src/routes/root.tsx braucht ein <Outlet />, sonst erscheinen die Seiten nirgends.
      - type: file_contains
        path: src/routes/root.tsx
        pattern: "<NavLink[^>]*to=[\"']/ueber[\"']"
        message: In RootLayout fehlt ein NavLink zu /ueber.
      - type: file_contains
        path: src/router.tsx
        pattern: "createBrowserRouter\\s*\\("
        message: src/router.tsx soll den Router mit createBrowserRouter([...]) erzeugen.
      - type: file_contains
        path: src/router.tsx
        pattern: "export\\s+const\\s+router\\b"
        message: src/router.tsx soll export const router = … enthalten.
      - type: file_contains
        path: src/router.tsx
        pattern: "index\\s*:\\s*true[^}]*HomePage|HomePage[^}]*index\\s*:\\s*true"
        message: Es fehlt die Index-Route { index true, Component HomePage }.
      - type: file_contains
        path: src/router.tsx
        pattern: "path\\s*:\\s*['\"]/?ueber['\"][^}]*AboutPage"
        message: Es fehlt die Kind-Route { path 'ueber', Component AboutPage }.
      - type: file_contains
        path: src/main.tsx
        pattern: "import\\s*\\{[^}]*RouterProvider[^}]*\\}\\s*from\\s*['\"]react-router/dom['\"]"
        message: main.tsx soll RouterProvider aus 'react-router/dom' importieren.
      - type: command
        run: grep -rl "react-router-dom" src || true
        stdout_equals: ""
        message: In src wird noch react-router-dom benutzt. Das Paket gibt es in Version 8 nicht mehr – importiere aus react-router.
      - type: command
        run: bun run build >/dev/null 2>&1
        message: bun run build schlägt fehl. Führe ihn aus und lies die Fehlermeldung.
    hints:
      - "Imports: `import { NavLink, Outlet } from 'react-router'` und `import { createBrowserRouter } from 'react-router'`."
      - "Die Route-Objekte: `{ path: '/', Component: RootLayout, children: [ { index: true, Component: HomePage }, { path: 'ueber', Component: AboutPage } ] }`"
      - "main.tsx: `createRoot(document.getElementById('root')!).render(<StrictMode><RouterProvider router={router} /></StrictMode>)`"
    solution: |
      ```bash
      cd erster-router
      mkdir -p src/routes
      cat > src/routes/root.tsx <<'EOF'
      import { NavLink, Outlet } from 'react-router'

      export function RootLayout() {
        return (
          <div className="mx-auto max-w-3xl p-6">
            <header className="mb-6 flex gap-4">
              <NavLink to="/" end>Start</NavLink>
              <NavLink to="/ueber">Über uns</NavLink>
            </header>
            <Outlet />
          </div>
        )
      }
      EOF
      cat > src/routes/home.tsx <<'EOF'
      export function HomePage() {
        return <h1 className="text-2xl font-bold">Willkommen im Buchclub</h1>
      }
      EOF
      cat > src/routes/about.tsx <<'EOF'
      export function AboutPage() {
        return <h1 className="text-2xl font-bold">Über uns</h1>
      }
      EOF
      cat > src/router.tsx <<'EOF'
      import { createBrowserRouter } from 'react-router'
      import { RootLayout } from '@/routes/root'
      import { HomePage } from '@/routes/home'
      import { AboutPage } from '@/routes/about'

      export const router = createBrowserRouter([
        {
          path: '/',
          Component: RootLayout,
          children: [
            { index: true, Component: HomePage },
            { path: 'ueber', Component: AboutPage },
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
      bun run build
      ```
  - id: navigation-ablauf
    type: order
    title: Was passiert bei einem Klick auf einen Link?
    description: Bring die Schritte einer Navigation im Data Mode in die richtige Reihenfolge.
    items:
      - Du klickst auf `<Link to="/buecher/momo">`.
      - Der Router ändert die URL, ohne die Seite neu vom Server zu laden.
      - Der Router sucht alle Routen, die zur URL passen (Layout und Kind-Route).
      - Die Loader dieser Routen laufen parallel und holen ihre Daten.
      - Die Komponenten werden gerendert – die Kind-Route im `<Outlet />` des Layouts.
    hints:
      - Im Data Mode kommen die Daten **vor** dem Rendern.
---
Ohne Router ist eine React-App eine einzige Seite ohne Adresse: Lesezeichen, Zurück-Button und geteilte Links
funktionieren nicht. [[react-router|React Router]] verbindet URLs mit Komponenten. Im **Data Mode** übernimmt er
zusätzlich das Laden von Daten und das Verarbeiten von Formularen – das schauen wir uns in der nächsten Lektion
an. Hier legst du das Fundament.

## Der Router als Objekt

Im [[data-mode|Data Mode]] beschreibst du alle Routen als Liste von [[route-objekt|Route-Objekten]] und erzeugst
daraus **einmal** einen Router:

```bash title="Terminal"
bun add react-router
```

```tsx title="src/router.tsx"
import { createBrowserRouter } from 'react-router'
import { RootLayout } from '@/routes/root'
import { HomePage } from '@/routes/home'
import { AboutPage } from '@/routes/about'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'ueber', Component: AboutPage },
    ],
  },
])
```

```tsx title="src/main.tsx"
import { RouterProvider } from 'react-router/dom'
import { router } from '@/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

Warum außerhalb von React? Der Router ist kein Teil der Oberfläche, sondern ihr Steuerzentrum: Er beobachtet die
URL, startet Loader und entscheidet, welche Komponenten gerendert werden. Würdest du ihn in einer Komponente
erzeugen, entstünde bei jedem Rendern ein neuer Router – samt neu geladener Daten.

> [!FEHLER]
> **Alte Anleitungen kopieren.** Bis Version 7 hieß das Paket für den Browser `react-router-dom`. In React Router 8
> gibt es es nicht mehr: Alles kommt aus `react-router`, nur `RouterProvider` aus `react-router/dom`.

## Was in einem Route-Objekt steht

| Eigenschaft | Bedeutung |
|---|---|
| `path` | URL-Abschnitt, z. B. `'ueber'` oder `'buecher/:bookId'` |
| `index: true` | wird beim Pfad der Eltern-Route selbst angezeigt |
| `Component` | die Komponente der Seite (oder `element: <Seite />`) |
| `children` | verschachtelte Kind-Routen |
| `loader`, `action` | Daten laden, Formulare verarbeiten (nächste Lektion) |
| `ErrorBoundary` | Fehleranzeige (übernächste Lektion) |
| `lazy` | Code der Route erst bei Bedarf laden |

`Component` und `element` machen dasselbe: `Component: HomePage` übergibt die Komponente, `element: <HomePage />`
ein fertiges Element. Die Dokumentation benutzt `Component`.

> [!MERKSATZ]
> Erzeuge den Router **einmal** auf Modulebene – nie in einer Komponente oder im State. Er lebt so lange wie die App.

## Layouts mit Outlet

[[verschachtelte-route|Verschachtelte Routen]] bilden Layouts ab: Die Eltern-Route zeichnet den Rahmen (Header,
Navigation), und an der Stelle von [[outlet|`<Outlet />`]] erscheint die passende Kind-Route.

```tsx title="src/routes/root.tsx"
import { NavLink, Outlet } from 'react-router'

export function RootLayout() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex gap-4">
        <NavLink to="/" end>Start</NavLink>
        <NavLink to="/ueber">Über uns</NavLink>
      </header>
      <Outlet />
    </div>
  )
}
```

Bei `/` rendert der Router `RootLayout` mit `HomePage` im Outlet, bei `/ueber` dasselbe Layout mit `AboutPage`.
Der Header bleibt stehen, nur der Inhalt wechselt.

## Navigieren und URL-Parameter

- `<Link to="/ueber">` navigiert, ohne die Seite neu zu laden.
- `<NavLink>` kann sich selbst hervorheben: `className={({ isActive }) => isActive ? 'font-bold' : ''}`.
  `end` sorgt dafür, dass der Link zu `/` nur bei genau `/` aktiv ist.
- `useNavigate()` liefert eine Funktion für Navigation im Code, z. B. nach einem Timer.

Links ohne führenden Schrägstrich sind **relativ** zur aktuellen Route: In einer Seite unter `/buecher` führt
`<Link to="momo">` nach `/buecher/momo`. Absolute Pfade mit `/` sind beim Einstieg leichter zu durchschauen.

Ein Doppelpunkt im Pfad macht einen Abschnitt zum [[pfadparameter|Pfadparameter]]:

```tsx
{ path: 'buecher/:bookId', Component: BookDetailPage }

function BookDetailPage() {
  const { bookId } = useParams()   // bei /buecher/momo: 'momo'
  return <h1>Buch {bookId}</h1>
}
```

> [!PRAXIS]
> Eine Datei pro Seite unter `src/routes/` und **eine** zentrale `router.tsx` – so sieht jede:r im Team auf einen
> Blick, welche URLs es gibt. Lange Routen-Bäume teilt man in Teilbäume auf, die man in `router.tsx` einhängt.

## Zusammenfassung

- Im Data Mode erzeugst du den Router mit `createBrowserRouter([...])` einmal auf Modulebene.
- `RouterProvider` aus `react-router/dom` macht ihn aktiv; `react-router-dom` gibt es in Version 8 nicht mehr.
- Route-Objekte haben `path`, `index`, `Component`, `children` – und später `loader`, `action`, `ErrorBoundary`, `lazy`.
- Layouts rendern Kind-Routen an der Stelle von `<Outlet />`.
- `Link`/`NavLink` navigieren, `useParams()` liest Pfadparameter wie `:bookId`.
