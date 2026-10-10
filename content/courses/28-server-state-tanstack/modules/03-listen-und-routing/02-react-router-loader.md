---
title: TanStack Query und React-Router-Loader
summary: Daten schon beim Navigieren laden, statt erst beim Rendern – mit queryOptions, Loadern und Actions im Data Mode von React Router.
duration: 25
sources:
  - title: TanStack Query – Query Options
    url: https://tanstack.com/query/latest/docs/framework/react/guides/query-options
  - title: TanStack Query – Prefetching & Router Integration
    url: https://tanstack.com/query/latest/docs/framework/react/guides/prefetching
  - title: React Router – Data Loading
    url: https://reactrouter.com/start/data/data-loading
  - title: React Router – Actions
    url: https://reactrouter.com/start/data/actions
quiz:
  - type: single
    question: Welches Problem lösen Router-Loader zusammen mit TanStack Query vor allem?
    options:
      - Sie ersetzen den Cache von TanStack Query.
      - Sie starten das Laden schon beim Navigieren und vermeiden Wasserfälle aus nacheinander gestarteten Requests.
      - Sie machen Requests überflüssig.
      - Sie funktionieren nur mit serverseitigem Rendering.
    answer: 1
    explanation: Ohne Loader lädt eine Komponente erst, wenn sie gerendert wird – und ihre Kinder erst danach. Der Loader startet alle Requests der Route gleichzeitig, sobald die Navigation beginnt.
  - type: multiple
    question: Was gehört in eine mit `queryOptions` definierte Funktion wie `aufgabeQuery(id)`?
    options:
      - queryKey
      - queryFn
      - Optionen wie staleTime
      - Das JSX der Detailseite
    answers: [0, 1, 2]
    explanation: queryOptions bündelt alles, was eine Query beschreibt. Dasselbe Objekt nutzt du im Loader und in der Komponente – so können Key und Funktion nie auseinanderlaufen.
  - type: cloze
    text: "Im Loader sorgt `await queryClient.___(aufgabeQuery(id))` dafür, dass die Daten im Cache liegen. Die Komponente liest sie danach mit `use___Query(aufgabeQuery(id))` – `data` ist dort nie undefined."
    blanks:
      - [query]
      - [Suspense]
    explanation: query liefert frische Daten aus dem Cache oder lädt sie. useSuspenseQuery findet sie danach sofort im Cache.
  - type: find-bug
    question: Die Detailseite zeigt nach dem Speichern im Formular noch den alten Titel. Welche Zeile fehlt sinngemäß bzw. ist falsch?
    language: ts
    code: |
      export async function bearbeitenAction({ request, params }: ActionFunctionArgs) {
        const formular = await request.formData()
        await aufgabeSpeichern(Number(params.id), { titel: String(formular.get('titel')) })
        return redirect(`/aufgaben/${params.id}`)
      }
    bug_line: 4
    explanation: "Vor dem Redirect fehlt `await queryClient.invalidateQueries({ queryKey: aufgabenKeys.all })`. Sonst hält der Cache die alten Daten für frisch, und der Loader der Detailseite liefert sie einfach wieder aus."
tasks:
  - id: navigation-ablauf
    type: order
    title: Was passiert beim Klick auf einen Link?
    description: "Der Nutzer klickt auf den Link zu `/aufgaben/7`. Die Route hat einen Loader, der `queryClient.query(aufgabeQuery(7))` abwartet, und die Komponente nutzt `useSuspenseQuery(aufgabeQuery(7))`. Bringe die Schritte in die richtige Reihenfolge (die Aufgabe ist noch nicht im Cache)."
    items:
      - "React Router erkennt die Route /aufgaben/:id"
      - "Der Loader startet mit params.id = '7'"
      - "queryClient.query sieht keinen Cache-Eintrag und ruft die queryFn auf"
      - "Die Antwort landet im Cache unter ['aufgaben', 'detail', 7]"
      - "Der Loader ist fertig, die neue Seite wird gerendert"
      - "useSuspenseQuery findet die Daten sofort im Cache"
    hints:
      - Erst wenn alle Loader der Route fertig sind, rendert React Router die neue Seite.
  - id: loader-schreiben
    type: code
    language: ts
    title: Einen Loader mit Cache schreiben
    description: |
      Du schreibst die Datenschicht einer Detailseite. Statt des echten QueryClient gibt es einen kleinen Nachbau,
      dessen Methode `query(optionen)` genauso arbeitet: Sind die Daten im Cache und jünger als `staleTime`,
      liefert sie sie zurück, sonst ruft sie `queryFn` auf.

      1. `aufgabeQuery(id)` liefert ein Objekt mit `queryKey: ['aufgaben', 'detail', id]`, einer `queryFn`, die
         `ladeAufgabe(id)` aufruft, und `staleTime: 30_000`.
      2. `aufgabeLoader({ params })` wandelt `params.id` mit `Number(...)` in eine Zahl um. Ist das Ergebnis keine
         ganze Zahl (`Number.isInteger`), wirft der Loader `new Error('Aufgabe nicht gefunden')`.
      3. Sonst wartet er `await queryClient.query(aufgabeQuery(id))` ab und gibt **nur** `{ id }` zurück – die
         Daten selbst bleiben im Cache, die Komponente liest sie dort.
    starter: |
      type Aufgabe = { id: number; titel: string }

      let anfragen = 0
      async function ladeAufgabe(id: number): Promise<Aufgabe> {
        anfragen++
        return { id, titel: 'Aufgabe ' + id }
      }

      type Optionen = { queryKey: unknown[]; queryFn: () => Promise<unknown>; staleTime?: number }
      const cache = new Map<string, { daten: unknown; um: number }>()
      const queryClient = {
        async query(optionen: Optionen) {
          const hash = JSON.stringify(optionen.queryKey)
          const eintrag = cache.get(hash)
          if (eintrag && Date.now() - eintrag.um < (optionen.staleTime ?? 0)) return eintrag.daten
          const daten = await optionen.queryFn()
          cache.set(hash, { daten, um: Date.now() })
          return daten
        },
      }

      function aufgabeQuery(id: number) {
        return { queryKey: [] as unknown[], queryFn: async () => ({}) as unknown, staleTime: 0 }
      }

      async function aufgabeLoader({ params }: { params: { id?: string } }) {
        return { id: 0 }
      }
    tests:
      - name: aufgabeQuery beschreibt die Query vollständig
        code: |
          const q = aufgabeQuery(7)
          assertDeepEqual(q.queryKey, ['aufgaben', 'detail', 7])
          assertEqual(q.staleTime, 30000)
          const daten = await q.queryFn()
          assertEqual(daten.titel, 'Aufgabe 7')
      - name: der Loader legt die Daten in den Cache und gibt nur die ID zurück
        code: |
          cache.clear()
          const ergebnis = await aufgabeLoader({ params: { id: '5' } })
          assertDeepEqual(ergebnis, { id: 5 })
          assertTrue(cache.has(JSON.stringify(['aufgaben', 'detail', 5])), 'Der Loader soll queryClient.query aufrufen.')
      - name: ein zweiter Besuch nutzt den Cache
        code: |
          cache.clear()
          anfragen = 0
          await aufgabeLoader({ params: { id: '3' } })
          await aufgabeLoader({ params: { id: '3' } })
          assertEqual(anfragen, 1, 'Frische Daten dürfen nicht erneut geladen werden – stimmt die staleTime?')
      - name: ungültige IDs werden abgelehnt
        code: |
          let geworfen = false
          try { await aufgabeLoader({ params: { id: 'abc' } }) } catch (e) { geworfen = e.message === 'Aufgabe nicht gefunden' }
          assertTrue(geworfen, 'Bei id "abc" soll der Loader new Error("Aufgabe nicht gefunden") werfen.')
    hints:
      - "`return { queryKey: ['aufgaben', 'detail', id], queryFn: () => ladeAufgabe(id), staleTime: 30_000 }`"
      - "Im Loader: `const id = Number(params.id)` und `if (!Number.isInteger(id)) throw new Error('Aufgabe nicht gefunden')`."
    solution: |
      type Aufgabe = { id: number; titel: string }

      let anfragen = 0
      async function ladeAufgabe(id: number): Promise<Aufgabe> {
        anfragen++
        return { id, titel: 'Aufgabe ' + id }
      }

      type Optionen = { queryKey: unknown[]; queryFn: () => Promise<unknown>; staleTime?: number }
      const cache = new Map<string, { daten: unknown; um: number }>()
      const queryClient = {
        async query(optionen: Optionen) {
          const hash = JSON.stringify(optionen.queryKey)
          const eintrag = cache.get(hash)
          if (eintrag && Date.now() - eintrag.um < (optionen.staleTime ?? 0)) return eintrag.daten
          const daten = await optionen.queryFn()
          cache.set(hash, { daten, um: Date.now() })
          return daten
        },
      }

      function aufgabeQuery(id: number) {
        return { queryKey: ['aufgaben', 'detail', id], queryFn: () => ladeAufgabe(id), staleTime: 30_000 }
      }

      async function aufgabeLoader({ params }: { params: { id?: string } }) {
        const id = Number(params.id)
        if (!Number.isInteger(id)) throw new Error('Aufgabe nicht gefunden')
        await queryClient.query(aufgabeQuery(id))
        return { id }
      }
---
Eine Detailseite lädt die Aufgabe, die Komponente darin lädt die Kommentare, darin lädt jede Zeile den Autor.
Jeder Request startet erst, wenn der vorige fertig ist und die nächste Komponente rendert – ein
**Wasserfall**. React Router kann das Laden schon beim Navigieren anstoßen. Zusammen mit TanStack Query bekommst
du das Beste aus beiden: frühes Laden und einen gemeinsamen Cache.

## Das Wasserfall-Problem

Lädt jede Komponente ihre Daten erst beim Rendern („fetch-on-render“), entsteht dieses Muster:

| Zeit | Ohne Loader | Mit Loader |
|---|---|---|
| 0 ms | Klick, Seite rendert, Aufgabe lädt | Klick, Loader startet Aufgabe **und** Kommentare |
| 300 ms | Aufgabe da, Kommentare starten | beide fertig, Seite rendert komplett |
| 600 ms | Kommentare da | – |

Ein [[request-wasserfall|Request-Wasserfall]] kostet bei jedem Schritt eine volle Netzwerk-Rundreise. Der
[[route-loader|Loader]] einer Route in React Router läuft dagegen **bevor** die Seite rendert und kann alle
Requests gleichzeitig starten.

Kurz zur Erinnerung (ausführlich im Kurs „Moderner React-Stack“): Im [[data-mode|Data Mode]] von [[react-router|React Router]] legst du Routen mit `createBrowserRouter` an und gibst jeder
Route optional eine `loader`-Funktion. Die Komponente liest das Ergebnis mit `useLoaderData`.

## queryOptions: eine Beschreibung für alle

Damit Loader und Komponente **dieselbe** Query meinen, beschreibst du sie einmal mit `queryOptions`:

```ts title="src/queries.ts"
import { queryOptions } from '@tanstack/react-query'
import { ladeAufgabe } from './api.ts'

export const aufgabeQuery = (id: number) =>
  queryOptions({
    queryKey: aufgabenKeys.detail(id),
    queryFn: () => ladeAufgabe(id),
    staleTime: 30_000,
  })
```

[[query-options|queryOptions]] macht zur Laufzeit nichts – es gibt das Objekt einfach zurück. Der Nutzen liegt
bei TypeScript: Der Key „weiß“ jetzt, welcher Datentyp unter ihm liegt. Auch `queryClient.getQueryData(aufgabeQuery(7).queryKey)`
ist damit automatisch richtig typisiert.

## Der Loader füllt den Cache

Der Loader braucht den QueryClient. Weil er außerhalb von React läuft, importierst du den Client aus seinem
Modul (oder übergibst ihn einer Loader-Fabrik):

```tsx title="src/router.tsx"
import { createBrowserRouter, useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from './queryClient.ts'
import { aufgabeQuery } from './queries.ts'

export async function aufgabeLoader({ params }: LoaderFunctionArgs) {
  const id = Number(params.id)
  await queryClient.query(aufgabeQuery(id))
  return { id }
}

function AufgabeDetail() {
  const { id } = useLoaderData<typeof aufgabeLoader>()
  const { data } = useSuspenseQuery(aufgabeQuery(id))
  return <h1>{data.titel}</h1>
}

export const router = createBrowserRouter([
  { path: '/aufgaben/:id', loader: aufgabeLoader, Component: AufgabeDetail },
])
```

`queryClient.query(...)` liefert frische Daten direkt aus dem Cache und lädt nur, wenn nötig. Ältere Beispiele
nutzen dafür `ensureQueryData` oder `fetchQuery`; beide funktionieren noch, sind aber als veraltet markiert.

Der Loader gibt bewusst **nur die ID** zurück. Die Daten leben im Query-Cache – der
[[single-source-of-truth|einzigen Quelle der Wahrheit]]. So aktualisiert sich die Seite auch bei
Hintergrund-Refetches und nach Mutationen, was mit reinen Loader-Daten nicht passieren würde.

> [!MERKSATZ]
> Der **Loader** sorgt dafür, *dass* die Daten früh geladen werden. Die **Komponente** liest sie mit
> `useSuspenseQuery` aus dem Cache und bleibt dadurch reaktiv.

## Actions: ändern und invalidieren

Formulare schickst du im Data Mode an eine [[route-action|Action]] der Route. Nach dem Speichern invalidierst du die
betroffenen Keys, **bevor** du weiterleitest:

```tsx
export async function bearbeitenAction({ request, params }: ActionFunctionArgs) {
  const formular = await request.formData()
  await aufgabeSpeichern(Number(params.id), { titel: String(formular.get('titel')) })
  await queryClient.invalidateQueries({ queryKey: aufgabenKeys.all })
  return redirect(`/aufgaben/${params.id}`)
}
```

Danach läuft der Loader der Zielseite. Weil der Eintrag jetzt veraltet ist, lädt `queryClient.query` ihn frisch.

> [!FEHLER]
> **Den QueryClient in `App` erzeugen und im Loader einen zweiten anlegen.** Dann füllt der Loader einen Cache,
> den keine Komponente liest. Es darf nur **einen** QueryClient geben: Lege ihn in einem eigenen Modul an und
> importiere ihn im Provider und in den Loadern.

> [!PRAXIS]
> Viele Teams kombinieren beides so: Loader für alles, was die Seite zum ersten Anzeigen braucht, `useQuery`
> in Komponenten für Nebensächliches wie Widgets. Und weil der Cache zwischen Seiten bestehen bleibt, ist der
> Weg zurück zur Liste meist sofort da.

## Zusammenfassung

- Lädt jede Komponente erst beim Rendern, entstehen **Wasserfälle** aus nacheinander gestarteten Requests.
- Router-**Loader** laufen vor dem Rendern und können alle Requests einer Route gleichzeitig starten.
- `queryOptions` beschreibt eine Query einmal – für Loader, Komponente und Cache-Zugriffe, typsicher.
- Im Loader füllt `await queryClient.query(...)` den Cache; zurückgegeben werden nur IDs oder Parameter.
- Die Komponente liest mit `useSuspenseQuery` aus dem Cache und bleibt reaktiv.
- In Actions invalidierst du betroffene Keys vor dem Redirect.
