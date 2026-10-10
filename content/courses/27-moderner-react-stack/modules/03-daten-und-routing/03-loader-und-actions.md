---
title: Daten laden mit loader, Formulare mit action
summary: Daten vor dem Rendern mit loader und useLoaderData laden, Formulare mit Form und action verarbeiten, Eingaben mit Zod prüfen und Fehler oder Weiterleitungen zurückgeben.
duration: 25
sources:
  - title: React Router – Data Loading (Data Mode)
    url: https://reactrouter.com/start/data/data-loading
  - title: React Router – Actions (Data Mode)
    url: https://reactrouter.com/start/data/actions
  - title: React Router – Pending UI (Data Mode)
    url: https://reactrouter.com/start/data/pending-ui
  - title: React Router – Form Validation
    url: https://reactrouter.com/how-to/form-validation
  - title: Zod – Formatting errors
    url: https://zod.dev/error-formatting
quiz:
  - type: single
    question: Wann ruft React Router den `loader` einer Route auf?
    options:
      - Nachdem die Komponente das erste Mal gerendert hat, wie bei useEffect.
      - Bevor die Komponente der Route gerendert wird – bei jeder Navigation zu dieser Route.
      - Nur einmal beim Start der App.
      - Nur, wenn du ihn in der Komponente aufrufst.
    answer: 1
    explanation: >
      Der Loader läuft vor dem Rendern. Die Komponente bekommt die fertigen Daten über `useLoaderData()` und muss
      keinen Ladezustand für den ersten Aufruf verwalten.
  - type: multiple
    question: Was passiert, nachdem eine `action` erfolgreich durchgelaufen ist?
    options:
      - Gibt sie `redirect('/')` zurück, navigiert der Router zur Startseite.
      - Die Loader der sichtbaren Routen laufen neu, damit die Seite aktuelle Daten zeigt.
      - Der Browser lädt die komplette Seite neu vom Server.
      - Gibt sie Daten zurück, kann die Komponente sie mit useActionData() lesen.
    answers: [0, 1, 3]
    explanation: >
      Diese automatische Revalidierung ist ein großer Vorteil des Data Mode: Du musst nach dem Speichern nichts von
      Hand neu laden. Ein voller Seiten-Reload findet nicht statt.
  - type: match
    question: Ordne jedem Wert von `useNavigation().state` die Situation zu.
    pairs:
      - { left: "idle", right: "Nichts passiert gerade" }
      - { left: "submitting", right: "Ein Formular wird an eine action geschickt" }
      - { left: "loading", right: "Loader laufen für die nächste Seite" }
    explanation: Mit `navigation.state === 'submitting'` deaktivierst du z. B. den Absende-Button und zeigst „Wird gesendet …“.
  - type: find-bug
    question: Ungültige Eingaben führen zur Fehlerseite statt zu Meldungen am Formular. Welche Zeile ist schuld?
    language: tsx
    code: |
      export async function contactAction({ request }: ActionFunctionArgs) {
        const formData = await request.formData()
        const values = Object.fromEntries(formData)
        const contact = ContactSchema.parse(values)
        await saveContact(contact)
        return redirect('/danke')
      }
    bug_line: 4
    explanation: >
      `parse` wirft bei ungültigen Eingaben – der Fehler landet in der ErrorBoundary. Für Formulare nimmst du
      `safeParse` und gibst bei Fehlern `data({ errors: … }, { status: 400 })` zurück.
tasks:
  - id: kontakt-action
    type: terminal
    title: Ein Kontaktformular mit action und Zod
    description: |
      Im Ordner `kontakt-action` liegt ein Projekt mit Router (Startseite und `/danke`), Zod und Alias `@`.
      Baue die Seite `/kontakt`.

      1. Exportiere in `src/lib/schemas.ts` ein `ContactSchema` mit `name` (mindestens 2 Zeichen, nach `.trim()`),
         `email` (`z.email()`) und `message` (mindestens 10 Zeichen). Gib jeweils eine deutsche Meldung mit `error` an.
      2. Lege `src/routes/contact.tsx` an und exportiere `contactAction`:
         - Formulardaten lesen (`await request.formData()`), mit `ContactSchema.safeParse(Object.fromEntries(formData))` prüfen,
         - bei Fehlern `data({ errors: z.flattenError(result.error).fieldErrors }, { status: 400 })` zurückgeben,
         - sonst `redirect('/danke')`.
      3. Exportiere in derselben Datei `ContactPage` mit einem `<Form method="post">`, drei Feldern (`name`, `email`,
         `message`), den Fehlermeldungen aus `useActionData` und einem Button, der beim Absenden deaktiviert ist
         (`useNavigation`).
      4. Hänge in `src/router.tsx` die Route `{ path: 'kontakt', action: contactAction, Component: ContactPage }` ein.
      5. Baue mit `bun run build`.

      Klicke zuerst auf **Aufgabe vorbereiten** (das dauert einige Sekunden).
    workdir: kontakt-action
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
      bun add react-router zod >/dev/null 2>&1
      mkdir -p src/routes src/lib
      cat > src/routes/root.tsx <<'EOF'
      import { NavLink, Outlet } from 'react-router'

      export function RootLayout() {
        return (
          <div className="mx-auto max-w-3xl p-6">
            <nav className="mb-6 flex gap-4">
              <NavLink to="/" end>Start</NavLink>
              <NavLink to="/kontakt">Kontakt</NavLink>
            </nav>
            <Outlet />
          </div>
        )
      }

      export function HomePage() {
        return <h1 className="text-2xl font-bold">Buchclub</h1>
      }

      export function ThanksPage() {
        return <h1 className="text-2xl font-bold">Danke für deine Nachricht!</h1>
      }
      EOF
      cat > src/router.tsx <<'EOF'
      import { createBrowserRouter } from 'react-router'
      import { HomePage, RootLayout, ThanksPage } from '@/routes/root'

      export const router = createBrowserRouter([
        {
          path: '/',
          Component: RootLayout,
          children: [
            { index: true, Component: HomePage },
            { path: 'danke', Component: ThanksPage },
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
      - type: file_contains
        path: src/lib/schemas.ts
        pattern: "export\\s+const\\s+ContactSchema\\s*=\\s*z\\.object\\("
        message: In src/lib/schemas.ts fehlt export const ContactSchema = z.object(…).
      - type: file_contains
        path: src/routes/contact.tsx
        pattern: "safeParse\\("
        message: contactAction soll die Eingaben mit safeParse prüfen – parse würde bei Fehlern werfen.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cat > "$d/t.ts" <<'EOF'
          import { contactAction } from '../src/routes/contact'
          const call = (fields: Record<string, string>) => {
            const body = new FormData()
            for (const [key, value] of Object.entries(fields)) body.set(key, value)
            const request = new Request('http://localhost/kontakt', { method: 'POST', body })
            return contactAction({ request, params: {}, context: {} } as never) as Promise<any>
          }
          const bad = await call({ name: ' A ', email: 'nope', message: 'kurz' })
          console.log(bad?.init?.status, Object.keys(bad?.data?.errors ?? {}).sort().join(','))
          EOF
          bun "$d/t.ts"; status=$?; rm -rf "$d"; exit $status
        stdout_equals: "400 email,message,name"
        message: Bei ungültigen Eingaben soll contactAction data({ errors }, { status 400 }) mit Fehlern für name, email und message zurückgeben (errors aus z.flattenError(...).fieldErrors).
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cat > "$d/t.ts" <<'EOF'
          import { contactAction } from '../src/routes/contact'
          const body = new FormData()
          body.set('name', 'Ada')
          body.set('email', 'ada@example.com')
          body.set('message', 'Ich möchte im Buchclub mitmachen.')
          const request = new Request('http://localhost/kontakt', { method: 'POST', body })
          const response = (await contactAction({ request, params: {}, context: {} } as never)) as Response
          console.log(response.status, response.headers.get('Location'))
          EOF
          bun "$d/t.ts"; status=$?; rm -rf "$d"; exit $status
        stdout_equals: "302 /danke"
        message: Bei gültigen Eingaben soll contactAction mit redirect('/danke') weiterleiten.
      - type: file_contains
        path: src/routes/contact.tsx
        pattern: "<Form[^>]*method=[\"']post[\"']"
        message: ContactPage braucht ein <Form method="post"> aus react-router.
      - type: file_contains
        path: src/routes/contact.tsx
        pattern: "useActionData"
        message: ContactPage soll die Fehler mit useActionData() lesen und anzeigen.
      - type: file_contains
        path: src/routes/contact.tsx
        pattern: "useNavigation"
        message: ContactPage soll mit useNavigation() erkennen, ob gerade gesendet wird.
      - type: file_contains
        path: src/router.tsx
        pattern: "path\\s*:\\s*['\"]kontakt['\"][^}]*action\\s*:\\s*contactAction|action\\s*:\\s*contactAction[^}]*path\\s*:\\s*['\"]kontakt['\"]"
        message: In src/router.tsx fehlt die Route { path 'kontakt', action contactAction, Component ContactPage }.
      - type: command
        run: bun run build >/dev/null 2>&1
        message: bun run build schlägt fehl. Führe ihn aus und lies die Fehlermeldung.
    hints:
      - "Imports in contact.tsx: `import { z } from 'zod'` und `import { data, Form, redirect, useActionData, useNavigation, type ActionFunctionArgs } from 'react-router'`."
      - "Fehler anzeigen: `const errors = useActionData<typeof contactAction>()?.errors` und dann `{errors?.email && <p>{errors.email[0]}</p>}`."
      - "Prüft der Check 400, aber mit falschen Feldern? `name: z.string().trim().min(2, …)` – ' A ' ist nach trim() nur ein Zeichen."
    solution: |
      ```bash
      cd kontakt-action
      cat > src/lib/schemas.ts <<'EOF'
      import { z } from 'zod'

      export const ContactSchema = z.object({
        name: z.string().trim().min(2, { error: 'Bitte gib deinen Namen an.' }),
        email: z.email({ error: 'Bitte gib eine gültige E-Mail-Adresse an.' }),
        message: z.string().trim().min(10, { error: 'Die Nachricht braucht mindestens 10 Zeichen.' }),
      })
      EOF
      cat > src/routes/contact.tsx <<'EOF'
      import { z } from 'zod'
      import { data, Form, redirect, useActionData, useNavigation, type ActionFunctionArgs } from 'react-router'
      import { ContactSchema } from '@/lib/schemas'

      export async function contactAction({ request }: ActionFunctionArgs) {
        const formData = await request.formData()
        const result = ContactSchema.safeParse(Object.fromEntries(formData))
        if (!result.success) {
          return data({ errors: z.flattenError(result.error).fieldErrors }, { status: 400 })
        }
        return redirect('/danke')
      }

      export function ContactPage() {
        const errors = useActionData<typeof contactAction>()?.errors
        const navigation = useNavigation()
        const busy = navigation.state === 'submitting'

        return (
          <Form method="post" className="space-y-4">
            <label className="block">
              Name
              <input name="name" className="block w-full rounded-md border p-2" />
              {errors?.name && <span className="text-sm text-red-600">{errors.name[0]}</span>}
            </label>
            <label className="block">
              E-Mail
              <input name="email" type="email" className="block w-full rounded-md border p-2" />
              {errors?.email && <span className="text-sm text-red-600">{errors.email[0]}</span>}
            </label>
            <label className="block">
              Nachricht
              <textarea name="message" className="block w-full rounded-md border p-2" />
              {errors?.message && <span className="text-sm text-red-600">{errors.message[0]}</span>}
            </label>
            <button type="submit" disabled={busy} className="rounded-md border px-4 py-2">
              {busy ? 'Wird gesendet …' : 'Absenden'}
            </button>
          </Form>
        )
      }
      EOF
      cat > src/router.tsx <<'EOF'
      import { createBrowserRouter } from 'react-router'
      import { HomePage, RootLayout, ThanksPage } from '@/routes/root'
      import { ContactPage, contactAction } from '@/routes/contact'

      export const router = createBrowserRouter([
        {
          path: '/',
          Component: RootLayout,
          children: [
            { index: true, Component: HomePage },
            { path: 'kontakt', action: contactAction, Component: ContactPage },
            { path: 'danke', Component: ThanksPage },
          ],
        },
      ])
      EOF
      bun run build
      ```
  - id: formular-ablauf
    type: steps
    title: Was passiert als Nächstes?
    description: Verfolge ein Formular im Data Mode vom Klick bis zur neuen Seite.
    steps:
      - situation: Auf `/kontakt` füllst du das Formular aus und klickst auf „Absenden“. Das Formular ist ein `<Form method="post">` aus react-router.
        question: Was passiert zuerst?
        options:
          - Der Browser schickt einen klassischen POST an den Server und lädt die Seite neu.
          - React Router fängt das Absenden ab und ruft die action der Route mit einem Request-Objekt auf.
          - Gar nichts, du brauchst einen onSubmit-Handler.
        answer: 1
        explanation: "`<Form>` verhält sich wie ein HTML-Formular, aber der Router übernimmt: Er baut einen `Request` mit den Formulardaten und ruft die `action` auf."
      - situation: Die action läuft noch. `useNavigation().state` wird abgefragt.
        question: Welchen Wert hat er?
        options: [idle, submitting, loading]
        answer: 1
        explanation: Während die action läuft, ist der Zustand `submitting`. Ideal, um den Button zu sperren.
      - situation: >
          Die E-Mail-Adresse war ungültig. Die action gibt `data({ errors }, { status: 400 })` zurück.
        question: Was sieht die Person?
        options:
          - Die Fehlerseite der ErrorBoundary
          - Dasselbe Formular, jetzt mit der Fehlermeldung aus useActionData() neben dem E-Mail-Feld
          - Eine leere Seite
        answer: 1
        explanation: Zurückgegebene Daten sind kein Fehler. Die Seite bleibt stehen, und useActionData() liefert die Meldungen.
      - situation: Beim zweiten Versuch ist alles gültig. Die action gibt `redirect('/danke')` zurück.
        question: Was passiert jetzt?
        options:
          - Der Router navigiert zu /danke, führt dort die Loader aus und rendert die Danke-Seite.
          - Die Seite /kontakt wird neu geladen.
        answer: 0
        explanation: Ein Redirect aus der action ist eine normale Navigation – inklusive Loadern der Zielseite.
---
Der klassische Weg, Daten in React zu laden, ist ein `useEffect` mit `fetch` und drei State-Variablen für Daten,
Ladezustand und Fehler – in jeder Komponente neu. Formulare bekommen einen `onSubmit`-Handler, der alles von Hand
erledigt. Der Data Mode von React Router nimmt dir beides ab: **Loader** laden, **Actions** schreiben.

![Ablauf im Data Mode: Lesen mit loader und Zod, Schreiben mit Form, action, safeParse und redirect](/assets/moderner-react-stack/data-mode-ablauf.svg)

## Loader: Daten vor dem Rendern

Ein [[route-loader|Loader]] ist eine (meist asynchrone) Funktion an der Route. Der Router ruft sie auf, **bevor** er
die Komponente rendert:

```tsx title="src/routes/books.tsx"
import { useLoaderData } from 'react-router'
import { BookListSchema } from '@/lib/schemas'

export async function booksLoader() {
  const response = await fetch('/api/books.json')
  if (!response.ok) throw new Error(`API antwortet mit ${response.status}`)
  const books = BookListSchema.parse(await response.json())
  return { books }
}

export function BooksPage() {
  const { books } = useLoaderData<typeof booksLoader>()
  return <ul>{books.map((book) => <li key={book.id}>{book.title}</li>)}</ul>
}
```

```tsx title="src/router.tsx (Ausschnitt)"
{ index: true, loader: booksLoader, Component: BooksPage }
```

`useLoaderData<typeof booksLoader>()` übernimmt den Rückgabetyp des Loaders – dank Zod ist das ein echter, geprüfter
`Book[]`. Kein `useEffect`, kein Ladezustand, kein „undefined beim ersten Rendern“.

Und wenn etwas schiefgeht? Wirft der Loader – weil die API nicht antwortet oder Zod die Daten ablehnt –, rendert
der Router statt der Seite die Fehleranzeige der Route. Die Komponente selbst muss sich um diesen Fall nicht
kümmern. Wie du diese Fehleranzeige baust, zeigt die nächste Lektion.

## Was ein Loader bekommt

Ein Loader bekommt ein Objekt mit `params` und `request`:

```tsx
export async function bookLoader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const highlight = url.searchParams.get('markiert')   // ?markiert=…
  const book = await fetchBook(params.bookId!)          // aus buecher/:bookId
  return { book, highlight }
}
```

> [!MERKSATZ]
> Loader laden, Komponenten zeigen an. Hat eine Seite einen Loader, braucht sie für ihre Daten keinen `useEffect`.

## Actions: Formulare verarbeiten

Eine [[route-action|Action]] ist das Gegenstück für schreibende Vorgänge. Sie wird aufgerufen, wenn ein `<Form>`
mit `method="post"` an die Route geschickt wird, und bekommt einen echten `Request`:

```tsx title="src/routes/contact.tsx"
import { z } from 'zod'
import { data, Form, redirect, useActionData, type ActionFunctionArgs } from 'react-router'
import { ContactSchema } from '@/lib/schemas'

export async function contactAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const result = ContactSchema.safeParse(Object.fromEntries(formData))
  if (!result.success) {
    return data({ errors: z.flattenError(result.error).fieldErrors }, { status: 400 })
  }
  await saveContact(result.data)
  return redirect('/danke')
}
```

| Rückgabe | Wirkung |
|---|---|
| `redirect('/danke')` | Navigation zur Zielseite |
| `data({ errors }, { status: 400 })` | Seite bleibt, `useActionData()` liefert die Fehler |
| ein normales Objekt | ebenfalls über `useActionData()` lesbar |

Beachte: Formulardaten sind immer Text. Ein Feld `<input name="year" type="number">` kommt als `"1973"` an.
Mit `z.coerce.number()` im Schema wandelt Zod den Text beim Prüfen in eine Zahl um – fehlt diese Umwandlung,
scheitert die Prüfung an jedem Zahlenfeld.

Nach jeder Action laufen die Loader der sichtbaren Routen automatisch neu. Diese [[revalidierung|Revalidierung]] sorgt dafür,
dass eine Liste nach dem Speichern sofort den neuen Eintrag zeigt.

> [!FEHLER]
> **Ein normales `<form>` statt `<Form>`.** Das HTML-Formular schickt einen echten POST an den Server und lädt die
> Seite neu – die action wird nie aufgerufen. Importiere `Form` aus `react-router`.

## Fehler anzeigen und Wartezustand

```tsx
export function ContactPage() {
  const errors = useActionData<typeof contactAction>()?.errors
  const navigation = useNavigation()
  const busy = navigation.state === 'submitting'

  return (
    <Form method="post">
      <input name="email" type="email" />
      {errors?.email && <p className="text-destructive">{errors.email[0]}</p>}
      <Button type="submit" disabled={busy}>{busy ? 'Wird gesendet …' : 'Absenden'}</Button>
    </Form>
  )
}
```

`z.flattenError(...).fieldErrors` liefert pro Feld ein Array von Meldungen – genau das Format, das du am Formular
brauchst. [[pending-ui|Pending UI]] wie der gesperrte Button entsteht aus `useNavigation().state`. Wer ohne
Navigation absenden will (etwa ein „Gefällt mir“-Knopf in einer Liste), nimmt `useFetcher()` – mehr dazu in der
[Doku zu Fetchers](https://reactrouter.com/how-to/fetchers).

> [!PRAXIS]
> Weil Loader und Actions normale Funktionen sind, lassen sie sich ohne Browser testen: einen `Request` mit
> `FormData` bauen, die Action aufrufen, das Ergebnis prüfen. Genau so prüft Stacklab gleich deine Aufgabe.

## Zusammenfassung

- Ein `loader` lädt Daten **vor** dem Rendern; die Komponente liest sie mit `useLoaderData<typeof loader>()`.
- Loader bekommen `params` (Pfadparameter) und `request` (z. B. für Suchparameter).
- Eine `action` verarbeitet `<Form method="post">` und bekommt die Daten über `request.formData()`.
- Eingaben prüfst du mit `safeParse`; Fehler gibst du mit `data({ errors }, { status: 400 })` zurück.
- `redirect()` navigiert weiter; danach laufen die Loader automatisch neu.
- `useNavigation().state` zeigt `idle`, `submitting` oder `loading` – Grundlage für Pending UI.
