---
title: Fehler, Ladezustände und Devtools
summary: Retries steuern, Fehler lokal oder mit Error Boundaries abfangen, Suspense einsetzen und den Cache mit den Devtools beobachten.
duration: 25
sources:
  - title: TanStack Query – Query Retries
    url: https://tanstack.com/query/latest/docs/framework/react/guides/query-retries
  - title: TanStack Query – Suspense
    url: https://tanstack.com/query/latest/docs/framework/react/guides/suspense
  - title: TanStack Query – QueryErrorResetBoundary
    url: https://tanstack.com/query/latest/docs/framework/react/reference/QueryErrorResetBoundary
  - title: TanStack Query – Devtools
    url: https://tanstack.com/query/latest/docs/framework/react/devtools
  - title: React – Error Boundaries
    url: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
quiz:
  - type: single
    question: Eine Query scheitert im Browser. Wie oft versucht TanStack Query es standardmäßig, bevor `status` zu `error` wird?
    options:
      - Gar nicht – der erste Fehler zählt.
      - Einmal
      - Noch dreimal, mit wachsenden Pausen
      - Endlos, bis der Server antwortet
    answer: 2
    explanation: "Standard ist `retry: 3` mit exponentiell wachsenden Pausen. Erst danach ist die Query im Fehlerzustand – deshalb dauert es eine Weile, bis eine Fehlermeldung erscheint."
  - type: match
    question: Welches Werkzeug passt zu welchem Ziel?
    pairs:
      - { left: "isError + error.message", right: "Fehler direkt in der Komponente anzeigen" }
      - { left: "throwOnError: true", right: "Fehler an die nächste Error Boundary weiterwerfen" }
      - { left: "useSuspenseQuery", right: "Ladezustand an eine Suspense-Grenze abgeben" }
      - { left: "QueryCache mit onError", right: "Eine globale Fehlermeldung für alle Queries zeigen" }
    explanation: Lokale Anzeige, Error Boundary, Suspense und globaler Callback ergänzen sich. Welche du nutzt, hängt davon ab, wo der Nutzer den Fehler sehen soll.
  - type: multiple
    question: Was stimmt über `useSuspenseQuery`?
    options:
      - "`data` ist immer definiert – nie `undefined`."
      - Den Ladezustand zeigt eine umschließende `<Suspense fallback={…}>`-Grenze.
      - Fehler landen bei der nächsten Error Boundary.
      - Es gibt keine Hintergrund-Updates mehr.
    answers: [0, 1, 2]
    explanation: Suspense betrifft nur das erste Laden. Veraltete Daten werden weiterhin im Hintergrund aktualisiert.
  - type: find-bug
    question: Bei einem 404 wartet die Seite lange, bevor der Fehler erscheint. Welche Zeile ändert das sinnvoll?
    language: ts
    code: |
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 3,
          },
        },
      })
    bug_line: 5
    explanation: "Ein 404 wird auch beim vierten Versuch nicht verschwinden. Mit einer Funktion wie `retry: (anzahl, fehler) => fehler.status >= 500 && anzahl < 3` wiederholst du nur Fehler, die vorübergehend sein können."
tasks:
  - id: werkzeug-zuordnen
    type: dragdrop
    title: Welche Anzeige passt?
    description: Ordne jede Situation der passenden Technik zu.
    targets:
      - { id: pending, label: "isPending – großer Ladehinweis" }
      - { id: fetching, label: "isFetching – dezenter Hinweis" }
      - { id: boundary, label: "throwOnError + Error Boundary" }
      - { id: lokal, label: "isError – Meldung mit „Erneut versuchen“" }
    items:
      - { label: "Die Seite öffnet sich zum ersten Mal, es gibt noch keine Daten.", target: pending }
      - { label: "Der Nutzer kehrt in den Tab zurück, die Liste wird im Hintergrund aktualisiert.", target: fetching }
      - { label: "Ohne Profildaten ist die ganze Seite sinnlos – ein Fallback soll den Bereich ersetzen.", target: boundary }
      - { label: "Nur das kleine Wetter-Widget in der Seitenleiste konnte nicht laden.", target: lokal }
    hints:
      - Ein Fehler in einem unwichtigen Widget sollte nicht die ganze Seite ersetzen.
  - id: fehlergrenze
    type: code
    language: tsx
    title: Eine Error Boundary mit „Erneut versuchen“
    description: |
      Mit `throwOnError: true` (oder `useSuspenseQuery`) wirft eine Query ihren Fehler beim Rendern – auffangen muss
      ihn eine **Error Boundary**. Error Boundaries sind in React bis heute Klassenkomponenten.

      `Profil` wirft einen Fehler, solange der „Server“ nicht erreichbar ist. Ergänze die Klasse `Fehlergrenze`:

      1. Die statische Methode `getDerivedStateFromError(fehler)` gibt `{ fehler }` als neuen State zurück.
      2. Ist `this.state.fehler` gesetzt, rendert `render()` ein `<div role="alert">` mit der Fehlermeldung und einem
         `<button className="erneut">Erneut versuchen</button>`.
      3. Der Button setzt den State auf `{ fehler: null }` zurück – dann rendert React die Kinder neu.
      4. Ohne Fehler rendert die Grenze einfach `this.props.children`.

      In einer echten App würdest du beim Zurücksetzen zusätzlich `reset()` aus `QueryErrorResetBoundary` aufrufen,
      damit die Query neu lädt.
    starter: |
      let serverErreichbar = false

      function Profil() {
        if (!serverErreichbar) throw new Error('Netzwerkfehler')
        return <p className="profil">Ada Lovelace</p>
      }

      type GrenzeState = { fehler: Error | null }

      class Fehlergrenze extends React.Component<{ children: React.ReactNode }, GrenzeState> {
        state: GrenzeState = { fehler: null }

        render() {
          return this.props.children
        }
      }

      function App() {
        return (
          <main>
            <button id="server-an" onClick={() => { serverErreichbar = true }}>Server wieder da</button>
            <Fehlergrenze>
              <Profil />
            </Fehlergrenze>
          </main>
        )
      }
    tests:
      - name: der Fehler wird aufgefangen und angezeigt
        code: |
          const alert = query('[role="alert"]')
          assertTrue(alert !== null, 'Die Grenze soll ein Element mit role="alert" rendern.')
          assertTrue(alert.textContent.includes('Netzwerkfehler'), 'Die Fehlermeldung fehlt.')
          assertTrue(query('#server-an') !== null, 'Der Rest der Seite außerhalb der Grenze muss stehen bleiben.')
      - name: erneut versuchen ohne Server zeigt wieder den Fehler
        code: |
          await click('.erneut')
          assertTrue(query('[role="alert"]') !== null, 'Ist der Server noch weg, muss der Fehler wieder erscheinen.')
          assertTrue(query('.profil') === null)
      - name: nach der Reparatur erscheint das Profil
        code: |
          await click('#server-an')
          await click('.erneut')
          assertTrue(query('.profil') !== null, 'Nach dem Zurücksetzen soll Profil neu gerendert werden.')
          assertTrue(query('[role="alert"]') === null)
    hints:
      - "`static getDerivedStateFromError(fehler: Error) { return { fehler } }` – React ruft das auf, wenn ein Kind beim Rendern wirft."
      - "In `render()`: `if (this.state.fehler) return <div role=\"alert\">…</div>`."
      - "Der Button: `onClick={() => this.setState({ fehler: null })}`."
    solution: |
      let serverErreichbar = false

      function Profil() {
        if (!serverErreichbar) throw new Error('Netzwerkfehler')
        return <p className="profil">Ada Lovelace</p>
      }

      type GrenzeState = { fehler: Error | null }

      class Fehlergrenze extends React.Component<{ children: React.ReactNode }, GrenzeState> {
        state: GrenzeState = { fehler: null }

        static getDerivedStateFromError(fehler: Error) {
          return { fehler }
        }

        render() {
          if (this.state.fehler) {
            return (
              <div role="alert">
                <p>Fehler: {this.state.fehler.message}</p>
                <button className="erneut" onClick={() => this.setState({ fehler: null })}>Erneut versuchen</button>
              </div>
            )
          }
          return this.props.children
        }
      }

      function App() {
        return (
          <main>
            <button id="server-an" onClick={() => { serverErreichbar = true }}>Server wieder da</button>
            <Fehlergrenze>
              <Profil />
            </Fehlergrenze>
          </main>
        )
      }
---
Ein Server antwortet nicht immer. Mal ist das WLAN weg, mal hat die API einen schlechten Tag, mal gibt es die
Aufgabe einfach nicht mehr. Gute Apps erkennt man daran, wie sie in diesen Momenten aussehen. TanStack Query
gibt dir dafür mehrere Werkzeuge – vom automatischen Wiederholen bis zur [[error-boundary|Error Boundary]].

## Retries: erst mal nochmal versuchen

Viele Fehler sind vorübergehend: ein kurzer Netzwerkaussetzer, ein Server-Neustart. Deshalb wiederholt
TanStack Query eine gescheiterte Query im Browser standardmäßig **dreimal**, mit wachsenden Pausen
([[exponential-backoff|Exponential Backoff]]: etwa 1, 2, 4 Sekunden, höchstens 30). Währenddessen bleibt
`status` auf `pending`, und `failureCount` zählt mit.

Nicht jeder Fehler verdient einen zweiten Versuch. Ein 404 bleibt ein 404. Mit einer Funktion entscheidest du
selbst:

```ts title="src/queryClient.ts"
export class HttpFehler extends Error {
  status: number
  constructor(status: number) {
    super(`HTTP ${status}`)
    this.status = status
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (anzahl, fehler) =>
        fehler instanceof HttpFehler && fehler.status < 500 ? false : anzahl < 3,
    },
  },
})
```

Mutationen werden standardmäßig nicht wiederholt – ein doppelter [[http-post|POST]] hätte [[seiteneffekt|Nebenwirkungen]].

## Fehler in der Komponente anzeigen

Der einfachste Weg: Du prüfst `isError` und bietest einen Knopf zum Neuladen an. `refetch()` startet die Query
sofort neu:

```tsx
const { data, isError, error, refetch, isFetching } = useQuery(wetterQuery(ort))

if (isError) {
  return (
    <div role="alert">
      Wetter nicht verfügbar: {error.message}
      <button onClick={() => refetch()} disabled={isFetching}>Erneut versuchen</button>
    </div>
  )
}
```

Der Typ von `error` ist standardmäßig `Error`. Wie du einen eigenen Fehlertyp für die ganze App einträgst,
lernst du in Modul 3.

> [!FEHLER]
> **Bei Fehlern die alten Daten verstecken.** Scheitert ein *Hintergrund*-Refetch, hat die Query trotzdem noch
> ihre alten Daten – `isError` und `data` sind dann gleichzeitig gesetzt. Prüfst du zuerst `isError` und brichst
> ab, verschwindet eine eben noch korrekte Liste. Zeig in diesem Fall die Daten plus einen kleinen Hinweis.

## Error Boundaries und Suspense

Manchmal soll ein Fehler nicht im Widget, sondern **weiter oben** behandelt werden – etwa wenn eine ganze
Seite ohne ihre Daten keinen Sinn ergibt. Mit `throwOnError: true` wirft die Query ihren Fehler beim Rendern,
und die nächste Error Boundary fängt ihn auf.

Noch einen Schritt weiter geht `useSuspenseQuery`. Es gibt Laden **und** Fehler nach oben ab:

```tsx
function Profil({ id }: { id: number }) {
  const { data } = useSuspenseQuery(profilQuery(id))   // data ist nie undefined
  return <h1>{data.name}</h1>
}

<ErrorBoundary fallback={<p>Profil konnte nicht geladen werden.</p>}>
  <Suspense fallback={<p>Lädt …</p>}>
    <Profil id={7} />
  </Suspense>
</ErrorBoundary>
```

[[react-suspense|Suspense]] zeigt das `fallback`, bis die Daten da sind. Die Komponente selbst kennt keinen
Ladezustand mehr – `data` ist garantiert definiert. Damit eine Query nach dem Fehler neu lädt, umschließt du
die Boundary mit `QueryErrorResetBoundary` und rufst beim Zurücksetzen dessen `reset()` auf.

> [!MERKSATZ]
> `useQuery` behandelt Laden und Fehler **in** der Komponente. `useSuspenseQuery` gibt beides an
> **Grenzen** weiter: Suspense für das Laden, Error Boundary für Fehler.

## Globale Fehlermeldungen

Willst du bei **jedem** Hintergrund-Fehler eine kleine Meldung zeigen, hängst du einen Callback an den
Query-Cache – einmal für die ganze App:

```ts
import { QueryCache, QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (fehler, query) => {
      if (query.state.data !== undefined) zeigeToast(`Aktualisierung fehlgeschlagen: ${fehler.message}`)
    },
  }),
})
```

Die Bedingung sorgt dafür, dass die Meldung nur bei Hintergrund-Updates erscheint – beim ersten Laden zeigt
ohnehin die Komponente den Fehler.

## Die Devtools

Was gerade im Cache liegt, siehst du mit den [[react-query-devtools|Query Devtools]]. Sie werden nur im
Entwicklungsmodus eingebunden und fehlen im Produktions-Build automatisch:

```bash title="Terminal"
npm install @tanstack/react-query-devtools
```

```tsx title="src/main.tsx"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Unten rechts erscheint ein Logo. Im Panel siehst du jeden Query Key, seinen Zustand (*fresh*, *stale*,
*fetching*, *inactive*), die Daten und Knöpfe zum Invalidieren, Neuladen oder Simulieren eines Fehlers.

> [!PRAXIS]
> Bei Fragen wie „Warum lädt das nicht neu?“ schaust du zuerst in die Devtools. Meist ist der Key ein anderer,
> als du denkst, oder die Daten sind wegen einer langen `staleTime` noch frisch.

## Zusammenfassung

- Queries werden im Browser standardmäßig **dreimal** wiederholt; mit einer `retry`-Funktion schließt du z. B. 4xx-Fehler aus.
- Lokal zeigst du Fehler mit `isError`, `error` und einem Knopf für `refetch()`.
- Scheitert nur ein Hintergrund-Update, sind die alten `data` noch da – nicht verstecken.
- `throwOnError` und `useSuspenseQuery` geben Fehler an eine **Error Boundary**, Laden an **Suspense** weiter.
- Ein `QueryCache` mit `onError` zeigt globale Meldungen für alle Queries.
- Die **Devtools** zeigen Keys, Zustände und Daten im Cache und fehlen im Produktions-Build.
