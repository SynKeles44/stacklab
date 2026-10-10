---
title: Die erste Query
summary: QueryClient einrichten, mit useQuery Daten laden und die Zustände pending, error und success sauber anzeigen.
duration: 25
sources:
  - title: TanStack Query – Installation
    url: https://tanstack.com/query/latest/docs/framework/react/installation
  - title: TanStack Query – Quick Start
    url: https://tanstack.com/query/latest/docs/framework/react/quick-start
  - title: TanStack Query – Queries
    url: https://tanstack.com/query/latest/docs/framework/react/guides/queries
  - title: TanStack Query – useQuery Referenz
    url: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
quiz:
  - type: single
    question: Wozu brauchst du den `QueryClientProvider`?
    options:
      - Er ersetzt `fetch` durch eine schnellere Variante.
      - Er stellt den QueryClient – und damit den Cache – allen Komponenten darunter über Context bereit.
      - Er startet einen lokalen Server für die API.
      - Er ist nur in Tests nötig.
    answer: 1
    explanation: Der QueryClient hält den Cache. Der Provider legt ihn in einen React-Context, damit jedes useQuery im Baum denselben Cache nutzt.
  - type: match
    question: Ordne jedem Feld des Query-Ergebnisses seine Bedeutung zu.
    pairs:
      - { left: "isPending", right: "Es gibt noch keine Daten im Cache." }
      - { left: "isFetching", right: "Gerade läuft ein Request – auch im Hintergrund." }
      - { left: "isError", right: "Der letzte Versuch ist endgültig gescheitert." }
      - { left: "data", right: "Die zuletzt erfolgreich geladenen Daten." }
    explanation: "`status` (pending, error, success) beschreibt, ob Daten da sind. `fetchStatus` (fetching, paused, idle) beschreibt, ob gerade geladen wird. Beides ist unabhängig voneinander."
  - type: cloze
    text: "Ein useQuery braucht mindestens zwei Optionen: den ___ (ein Array, das die Daten benennt) und die ___ (eine Funktion, die ein Promise zurückgibt)."
    blanks:
      - [queryKey, Query Key, query key]
      - [queryFn, Query-Funktion, Query Funktion]
    explanation: Der Key benennt den Cache-Eintrag, die Funktion weiß, wie man die Daten holt.
  - type: find-bug
    question: Bei einem 404 zeigt die Komponente keinen Fehler, sondern versucht, `undefined.map` aufzurufen. Wo liegt die Ursache?
    language: ts
    code: |
      async function ladeAufgaben(): Promise<Aufgabe[]> {
        const res = await fetch('/api/aufgaben')
        return res.json()
      }
      const ergebnis = useQuery({ queryKey: ['aufgaben'], queryFn: ladeAufgaben })
    bug_line: 3
    explanation: "`fetch` wirft bei HTTP-Fehlern wie 404 oder 500 **keinen** Fehler. Prüfe vorher `if (!res.ok) throw new Error(...)` – nur ein abgelehntes Promise erkennt TanStack Query als Fehler."
  - type: single
    question: Eine Liste hat schon Daten, und TanStack Query lädt sie im Hintergrund neu. Welche Kombination stimmt?
    options:
      - "status: 'pending', isFetching: true"
      - "status: 'success', isFetching: true"
      - "status: 'success', isFetching: false"
      - "status: 'error', isFetching: true"
    answer: 1
    explanation: Die Daten sind da (success), und gleichzeitig läuft ein Request (isFetching). Deshalb zeigst du in diesem Fall die alten Daten weiter an – höchstens mit einem kleinen Hinweis.
tasks:
  - id: query-installieren
    type: terminal
    title: TanStack Query installieren und einen QueryClient anlegen
    description: |
      Im Ordner `erste-query` liegt ein kleines Node-Projekt (`package.json` mit `"type": "module"`), in dem React
      schon installiert ist.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Projekt angelegt wird.

      1. Installiere das Paket `@tanstack/react-query` mit npm als normale Abhängigkeit.
      2. Lege die Datei `src/queryClient.ts` an. Sie exportiert eine Konstante `queryClient` – einen
         `new QueryClient(...)` mit diesen Standardoptionen für Queries: `staleTime: 60_000` und `retry: 1`.
      3. Teste deine Datei mit
         `node -e "import('./src/queryClient.ts').then((m) => console.log(m.queryClient.getDefaultOptions()))"`.
         Node.js 24 kann TypeScript-Dateien mit reinen Typangaben direkt ausführen.
    workdir: erste-query
    setup: |
      npm init -y >/dev/null
      npm pkg set type=module
      npm install --no-audit --no-fund react >/dev/null 2>&1
      mkdir -p src
    checks:
      - type: dir_exists
        path: node_modules/@tanstack/react-query
        message: "@tanstack/react-query ist noch nicht installiert. Führe npm install @tanstack/react-query aus."
      - type: command
        run: jq -r '.dependencies["@tanstack/react-query"] // ""' package.json
        stdout_matches: "^\\^?5\\."
        message: In package.json fehlt @tanstack/react-query (Version 5) unter dependencies.
      - type: file_exists
        path: src/queryClient.ts
        message: Die Datei src/queryClient.ts gibt es noch nicht.
      - type: file_contains
        path: src/queryClient.ts
        pattern: "export\\s+const\\s+queryClient\\s*=\\s*new\\s+QueryClient"
        message: Exportiere in src/queryClient.ts eine Konstante queryClient mit new QueryClient(...).
      - type: command
        run: node -e "import('./src/queryClient.ts').then((m) => { const q = m.queryClient.getDefaultOptions().queries ?? {}; console.log(q.staleTime + ' ' + q.retry) })" 2>/dev/null
        stdout_matches: "^60000 1$"
        message: "Die Standardoptionen stimmen noch nicht. Erwartet: defaultOptions: { queries: { staleTime: 60_000, retry: 1 } }."
    hints:
      - "Installieren: `npm install @tanstack/react-query`."
      - "Der Import lautet `import { QueryClient } from '@tanstack/react-query'`."
      - "Die Optionen stehen verschachtelt: `new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } })`."
    solution: |
      ```bash
      cd erste-query
      npm install @tanstack/react-query
      cat > src/queryClient.ts <<'EOF'
      import { QueryClient } from '@tanstack/react-query'

      export const queryClient = new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
        },
      })
      EOF
      node -e "import('./src/queryClient.ts').then((m) => console.log(m.queryClient.getDefaultOptions()))"
      ```
  - id: zustaende-anzeigen
    type: code
    language: tsx
    title: Alle Zustände einer Query anzeigen
    description: |
      Die Komponente `AufgabenAnzeige` bekommt ein Query-Ergebnis, wie es `useQuery` liefert (vereinfacht).
      `App` ist fertig und schaltet per Buttons zwischen Beispiel-Ergebnissen um.

      Rendere je nach `status`:

      1. `pending` → `<p className="laden">Lädt …</p>`
      2. `error` → `<p role="alert">Fehler: …</p>` mit der Fehlermeldung (`error.message`)
      3. `success` mit leerer Liste → `<p className="leer">Keine Aufgaben</p>`
      4. `success` mit Einträgen → `<ul>` mit einem `<li>` je Aufgabe (Text: `titel`, `key`: `id`)
      5. Zusätzlich bei `success` **und** `isFetching`: ein `<span className="aktualisiert">aktualisiert …</span>`
         über der Liste – die alten Daten bleiben sichtbar.
    starter: |
      type Aufgabe = { id: number; titel: string }

      type Ergebnis =
        | { status: 'pending'; isFetching: boolean }
        | { status: 'error'; error: Error; isFetching: boolean }
        | { status: 'success'; data: Aufgabe[]; isFetching: boolean }

      function AufgabenAnzeige({ ergebnis }: { ergebnis: Ergebnis }) {
        return null
      }

      const beispiele: Record<string, Ergebnis> = {
        laden: { status: 'pending', isFetching: true },
        fehler: { status: 'error', error: new Error('Server nicht erreichbar'), isFetching: false },
        leer: { status: 'success', data: [], isFetching: false },
        daten: { status: 'success', data: [{ id: 1, titel: 'Einkaufen' }, { id: 2, titel: 'Sport' }], isFetching: false },
        hintergrund: { status: 'success', data: [{ id: 1, titel: 'Einkaufen' }], isFetching: true },
      }

      function App() {
        const [fall, setFall] = React.useState('laden')
        return (
          <div>
            {Object.keys(beispiele).map((name) => (
              <button key={name} id={name} onClick={() => setFall(name)}>{name}</button>
            ))}
            <AufgabenAnzeige ergebnis={beispiele[fall]} />
          </div>
        )
      }
    tests:
      - name: pending zeigt den Ladehinweis
        code: |
          await click('#laden')
          assertTrue(query('.laden') !== null, 'Bei status pending fehlt <p className="laden">.')
          assertTrue(query('ul') === null, 'Während pending darf noch keine Liste erscheinen.')
      - name: error zeigt die Fehlermeldung
        code: |
          await click('#fehler')
          const fehler = query('[role="alert"]')
          assertTrue(fehler !== null, 'Bei status error fehlt <p role="alert">.')
          assertTrue(fehler.textContent.includes('Server nicht erreichbar'), 'Die Fehlermeldung (error.message) fehlt.')
      - name: leere Liste zeigt einen Hinweis
        code: |
          await click('#leer')
          assertTrue(query('.leer') !== null, 'Bei einer leeren Liste fehlt <p className="leer">Keine Aufgaben</p>.')
          assertEqual(queryAll('li').length, 0)
      - name: Daten werden als Liste gezeigt
        code: |
          await click('#daten')
          assertEqual(queryAll('li').length, 2)
          assertEqual(queryAll('li')[1].textContent, 'Sport')
          assertTrue(query('.aktualisiert') === null, 'Ohne isFetching soll kein Aktualisieren-Hinweis erscheinen.')
      - name: Hintergrund-Laden behält die Daten
        code: |
          await click('#hintergrund')
          assertTrue(query('.aktualisiert') !== null, 'Bei success + isFetching fehlt <span className="aktualisiert">.')
          assertEqual(queryAll('li').length, 1)
          assertTrue(query('.laden') === null, 'Beim Hintergrund-Laden darf kein großer Ladehinweis erscheinen.')
    hints:
      - "Prüfe zuerst `if (ergebnis.status === 'pending') return …` – TypeScript weiß danach, welche Felder es gibt."
      - "Nach den beiden frühen `return`s ist `ergebnis.data` garantiert vorhanden."
      - "Für den Hinweis: `{ergebnis.isFetching && <span className=\"aktualisiert\">aktualisiert …</span>}` vor der Liste."
    solution: |
      type Aufgabe = { id: number; titel: string }

      type Ergebnis =
        | { status: 'pending'; isFetching: boolean }
        | { status: 'error'; error: Error; isFetching: boolean }
        | { status: 'success'; data: Aufgabe[]; isFetching: boolean }

      function AufgabenAnzeige({ ergebnis }: { ergebnis: Ergebnis }) {
        if (ergebnis.status === 'pending') return <p className="laden">Lädt …</p>
        if (ergebnis.status === 'error') return <p role="alert">Fehler: {ergebnis.error.message}</p>
        return (
          <div>
            {ergebnis.isFetching && <span className="aktualisiert">aktualisiert …</span>}
            {ergebnis.data.length === 0 ? (
              <p className="leer">Keine Aufgaben</p>
            ) : (
              <ul>
                {ergebnis.data.map((a) => <li key={a.id}>{a.titel}</li>)}
              </ul>
            )}
          </div>
        )
      }

      const beispiele: Record<string, Ergebnis> = {
        laden: { status: 'pending', isFetching: true },
        fehler: { status: 'error', error: new Error('Server nicht erreichbar'), isFetching: false },
        leer: { status: 'success', data: [], isFetching: false },
        daten: { status: 'success', data: [{ id: 1, titel: 'Einkaufen' }, { id: 2, titel: 'Sport' }], isFetching: false },
        hintergrund: { status: 'success', data: [{ id: 1, titel: 'Einkaufen' }], isFetching: true },
      }

      function App() {
        const [fall, setFall] = React.useState('laden')
        return (
          <div>
            {Object.keys(beispiele).map((name) => (
              <button key={name} id={name} onClick={() => setFall(name)}>{name}</button>
            ))}
            <AufgabenAnzeige ergebnis={beispiele[fall]} />
          </div>
        )
      }
---
Du weißt jetzt, warum Server-Daten einen eigenen Cache brauchen. In dieser Lektion richtest du TanStack Query
ein und lädst deine erste Liste. Am Ende kennst du die drei Zustände einer Query – und weißt, warum „lädt“ und
„lädt gerade nach“ zwei verschiedene Dinge sind.

## Installation und QueryClient

TanStack Query ist ein [[paket|Paket]] aus der [[npm-registry|npm-Registry]]. Für React installierst du die React-Variante:

```bash title="Terminal"
npm install @tanstack/react-query
```

Das Herz der Bibliothek ist der [[query-client|QueryClient]]. Er enthält den Cache und alle Standardoptionen.
Du legst ihn **einmal** für die ganze App an – außerhalb jeder Komponente, damit er beim Rendern nicht neu
entsteht:

```ts title="src/queryClient.ts"
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000 },
  },
})
```

Was `staleTime` bedeutet, lernst du in der nächsten Lektion. Hier merkst du dir nur: Standardwerte für alle
Queries stehen unter `defaultOptions.queries`.

## Der Provider

Damit jede Komponente denselben Cache erreicht, legst du den QueryClient über einen
[[react-context|Context]] in den Komponentenbaum. Das erledigt der `QueryClientProvider`:

```tsx title="src/main.tsx"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient.ts'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

> [!FEHLER]
> **Den QueryClient in einer Komponente erzeugen.** Steht `new QueryClient()` im Funktionskörper von `App`,
> entsteht bei jedem Rendern ein neuer, leerer Cache. Alle Daten sind dann sofort wieder weg. Lege ihn auf
> Modulebene an (oder einmalig mit `useState(() => new QueryClient())`).

## useQuery: Daten laden

Jetzt kann jede Komponente mit dem [[react-hook|Hook]] `useQuery` Daten anfordern:

```tsx title="src/AufgabenListe.tsx"
import { useQuery } from '@tanstack/react-query'

type Aufgabe = { id: number; titel: string }

async function ladeAufgaben(): Promise<Aufgabe[]> {
  const res = await fetch('/api/aufgaben')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function AufgabenListe() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['aufgaben'],
    queryFn: ladeAufgaben,
  })

  if (isPending) return <p>Lädt …</p>
  if (isError) return <p role="alert">Fehler: {error.message}</p>
  return <ul>{data.map((a) => <li key={a.id}>{a.titel}</li>)}</ul>
}
```

Die [[query-function|Query-Funktion]] muss ein [[promise|Promise]] liefern, das bei Erfolg die Daten enthält
und bei einem Problem **abgelehnt** wird. Weil [[fetch-api|`fetch`]] bei den [[statuscode|Statuscodes]] 404 oder 500 nicht von selbst einen Fehler wirft,
prüfst du `res.ok` und wirfst ihn selbst.

> [!MERKSATZ]
> Für TanStack Query gibt es nur zwei Ausgänge: Das Promise wird erfüllt (Daten) oder abgelehnt (Fehler).
> Wie du die Daten holst – `fetch`, ein API-Client, eine lokale Datenbank – ist der Bibliothek egal.

## Zwei Komponenten, ein Cache-Eintrag

Setzt du `<AufgabenListe />` zweimal auf dieselbe Seite, passiert Folgendes: Die erste Komponente legt den
Cache-Eintrag `['aufgaben']` an und startet den Request. Die zweite findet den Eintrag schon vor und hängt sich
an – es geht nur **ein** Request raus. Kommt die Antwort, rendern beide Komponenten mit denselben Daten.

Dieses Verhalten kennst du schon als [[request-deduplizierung|Deduplizierung]]. Es bedeutet für dich: Du darfst
`useQuery` ruhig in jeder Komponente aufrufen, die die Daten braucht. Du musst die Daten nicht in einer
Eltern-Komponente laden und per [[props|Props]] durchreichen. Der Query Key ist der gemeinsame Treffpunkt.

> [!TIPP]
> Damit Key und Funktion an allen Stellen gleich sind, legst du sie später in eine gemeinsame Funktion. Wie das
> geht, lernst du in Modul 3 mit `queryOptions`.

## Zwei Fragen: Gibt es Daten? Wird gerade geladen?

Das Ergebnis von `useQuery` beantwortet zwei unabhängige Fragen:

| Feld | Werte | Frage |
|---|---|---|
| `status` | `pending`, `error`, `success` | Habe ich Daten (oder einen Fehler)? |
| `fetchStatus` | `fetching`, `paused`, `idle` | Läuft gerade ein Request? |

Dazu gibt es Kurzformen: `isPending`, `isError`, `isSuccess` und `isFetching`. `paused` bedeutet: Der
Browser ist offline, der Request wartet.

Die Kombination ist entscheidend. Bei `status: 'success'` und `isFetching: true` hast du **alte Daten**, und im
Hintergrund kommt gerade eine frischere Version. Dann zeigst du die Daten weiter an – kein Spinner, der alles
verdeckt.

```tsx
if (isPending) return <Spinner />             // erstes Laden: noch gar nichts da
return (
  <>
    {isFetching && <small>aktualisiert …</small>} {/* Hintergrund-Update */}
    <Liste eintraege={data} />
  </>
)
```

Dank [[typinferenz|Typinferenz]] weiß TypeScript nach `if (isPending)` und `if (isError)`, dass `data` vom Typ
`Aufgabe[]` ist – kein `data?.map` nötig.

> [!PRAXIS]
> Nutzer hassen springende Seiten. Ein großer Spinner gehört nur zum allerersten Laden. Hintergrund-Updates
> zeigst du dezent an, etwa mit einem kleinen Indikator in der Ecke.

## Zusammenfassung

- Installiere `@tanstack/react-query` und lege **einen** `QueryClient` auf Modulebene an.
- Der `QueryClientProvider` stellt den Cache allen Komponenten bereit.
- `useQuery` braucht einen `queryKey` und eine `queryFn`, die ein Promise liefert.
- Wirf in der Query-Funktion selbst einen Fehler, wenn `res.ok` falsch ist.
- `status` sagt, ob Daten da sind; `fetchStatus` bzw. `isFetching`, ob gerade geladen wird.
- Großer Spinner nur bei `isPending`, Hintergrund-Updates dezent anzeigen.
