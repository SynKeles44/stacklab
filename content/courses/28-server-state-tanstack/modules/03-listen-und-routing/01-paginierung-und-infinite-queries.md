---
title: Paginierung und Infinite Queries
summary: Seitenweise blättern ohne Flackern und Endlos-Listen mit „Mehr laden“ – mit placeholderData und useInfiniteQuery.
duration: 25
sources:
  - title: TanStack Query – Paginated Queries
    url: https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries
  - title: TanStack Query – Infinite Queries
    url: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
  - title: TanStack Query – Prefetching
    url: https://tanstack.com/query/latest/docs/framework/react/guides/prefetching
  - title: TanStack Query – useInfiniteQuery Referenz
    url: https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery
quiz:
  - type: single
    question: "Was bewirkt `placeholderData: keepPreviousData` bei einer paginierten Query?"
    options:
      - Alle Seiten werden in einem Array zusammengeführt.
      - Beim Wechsel auf eine neue Seite bleiben die Daten der alten Seite sichtbar, bis die neue geladen ist.
      - Die alte Seite wird nie neu geladen.
      - Die Query lädt nur noch aus dem Cache.
    answer: 1
    explanation: Jede Seite ist ein eigener Cache-Eintrag. Ohne Platzhalter würde die Liste beim Blättern kurz leer werden. Mit keepPreviousData bleibt die alte Seite stehen, und isPlaceholderData ist true.
  - type: match
    question: Ordne jedem Teil von useInfiniteQuery seine Aufgabe zu.
    pairs:
      - { left: "initialPageParam", right: "Parameter für die allererste Seite" }
      - { left: "getNextPageParam", right: "Berechnet aus der letzten Seite den Parameter der nächsten" }
      - { left: "fetchNextPage()", right: "Lädt die nächste Seite und hängt sie an" }
      - { left: "hasNextPage", right: "Gibt es laut getNextPageParam noch eine Seite?" }
    explanation: Gibt getNextPageParam `undefined` oder `null` zurück, ist hasNextPage false – das Ende der Liste ist erreicht.
  - type: cloze
    text: "Bei useInfiniteQuery liegen die geladenen Seiten in `data.___`. Zu einer flachen Liste machst du sie mit `data.pages.___((seite) => seite.eintraege)`."
    blanks:
      - [pages]
      - [flatMap]
    explanation: Jede Seite bleibt im Cache einzeln erhalten, für die Anzeige fügst du sie mit flatMap zusammen.
  - type: find-bug
    question: Der Button „Mehr laden“ verschwindet nie, auch auf der letzten Seite nicht. Welche Zeile ist schuld?
    language: ts
    code: |
      useInfiniteQuery({
        queryKey: ['feed'],
        queryFn: ({ pageParam }) => ladeFeed(pageParam),
        initialPageParam: 0,
        getNextPageParam: (letzteSeite) => letzteSeite.naechsterCursor ?? 0,
      })
    bug_line: 5
    explanation: "Ist `naechsterCursor` null, liefert der Ausdruck 0 statt `undefined`. Für TanStack Query gibt es dann immer eine nächste Seite (wieder ab 0). Richtig: `letzteSeite.naechsterCursor ?? undefined`."
tasks:
  - id: seiten-helfer
    type: code
    language: ts
    title: Die Helfer für eine Endlos-Liste
    description: |
      Die API `/api/beitraege?cursor=…` liefert Seiten der Form `{ eintraege, naechsterCursor }`. Auf der letzten
      Seite ist `naechsterCursor` `null`. Schreibe die Funktionen, die du in `useInfiniteQuery` brauchst:

      1. `naechsterSeitenParam(letzteSeite)` liefert den Cursor der nächsten Seite – oder `undefined`, wenn es
         keine mehr gibt. (Achtung: Ein Cursor kann auch `0` sein!)
      2. `alleEintraege(daten)` macht aus `{ pages: [...] }` eine flache Liste aller Einträge.
      3. `knopfText(hasNextPage, isFetchingNextPage)` liefert `'Lädt …'`, solange die nächste Seite lädt,
         `'Mehr laden'`, wenn es weitere Seiten gibt, und sonst `'Alles geladen'`.
    starter: |
      type Beitrag = { id: number; titel: string }
      type Seite = { eintraege: Beitrag[]; naechsterCursor: number | null }

      function naechsterSeitenParam(letzteSeite: Seite): number | undefined {
        return undefined
      }

      function alleEintraege(daten: { pages: Seite[] } | undefined): Beitrag[] {
        return []
      }

      function knopfText(hasNextPage: boolean, isFetchingNextPage: boolean): string {
        return ''
      }
    tests:
      - name: Cursor der nächsten Seite
        code: |
          assertEqual(naechsterSeitenParam({ eintraege: [], naechsterCursor: 20 }), 20)
          assertEqual(naechsterSeitenParam({ eintraege: [], naechsterCursor: 0 }), 0, 'Ein Cursor 0 ist gültig und darf nicht zu undefined werden.')
      - name: Letzte Seite liefert undefined
        code: |
          assertEqual(naechsterSeitenParam({ eintraege: [{ id: 1, titel: 'A' }], naechsterCursor: null }), undefined)
      - name: Seiten werden flach zusammengefügt
        code: |
          const daten = { pages: [
            { eintraege: [{ id: 1, titel: 'A' }, { id: 2, titel: 'B' }], naechsterCursor: 2 },
            { eintraege: [{ id: 3, titel: 'C' }], naechsterCursor: null },
          ] }
          assertDeepEqual(alleEintraege(daten).map((b) => b.id), [1, 2, 3])
          assertDeepEqual(alleEintraege(undefined), [])
      - name: Knopftext
        code: |
          assertEqual(knopfText(true, true), 'Lädt …')
          assertEqual(knopfText(true, false), 'Mehr laden')
          assertEqual(knopfText(false, false), 'Alles geladen')
    hints:
      - "`??` ersetzt nur `null` und `undefined`, `||` würde auch die 0 ersetzen."
      - "`daten?.pages.flatMap((seite) => seite.eintraege) ?? []`"
    solution: |
      type Beitrag = { id: number; titel: string }
      type Seite = { eintraege: Beitrag[]; naechsterCursor: number | null }

      function naechsterSeitenParam(letzteSeite: Seite): number | undefined {
        return letzteSeite.naechsterCursor ?? undefined
      }

      function alleEintraege(daten: { pages: Seite[] } | undefined): Beitrag[] {
        return daten?.pages.flatMap((seite) => seite.eintraege) ?? []
      }

      function knopfText(hasNextPage: boolean, isFetchingNextPage: boolean): string {
        if (isFetchingNextPage) return 'Lädt …'
        return hasNextPage ? 'Mehr laden' : 'Alles geladen'
      }
  - id: blaettern-ablauf
    type: steps
    title: Was passiert beim Blättern?
    description: "Eine Tabelle nutzt `useQuery({ queryKey: ['kunden', { seite }], queryFn: …, placeholderData: keepPreviousData })`. Verfolge, was beim Blättern passiert."
    steps:
      - situation: Seite 1 ist geladen. Der Nutzer klickt auf „Weiter“, `seite` wird 2.
        question: Was zeigt die Tabelle, während Seite 2 lädt?
        options: [Eine leere Tabelle mit Spinner, Weiter die Zeilen von Seite 1 – isPlaceholderData ist true, Sofort die Zeilen von Seite 2]
        answer: 1
        explanation: Seite 2 ist ein neuer Cache-Eintrag ohne Daten. keepPreviousData zeigt so lange die vorherigen Daten als Platzhalter.
      - situation: Während Seite 2 lädt, klickt der Nutzer erneut auf „Weiter“.
        question: Wie verhinderst du, dass er Seiten überspringt, die er nie gesehen hat?
        options: [Gar nicht, Den Weiter-Button deaktivieren, solange isPlaceholderData true ist, Die staleTime erhöhen]
        answer: 1
        explanation: isPlaceholderData zeigt, dass die angezeigten Daten noch zur alten Seite gehören. Solange blockierst du die Navigation.
      - situation: Der Nutzer geht von Seite 2 zurück auf Seite 1.
        question: Was passiert?
        options: [Seite 1 erscheint sofort aus dem Cache und wird ggf. im Hintergrund aktualisiert, Seite 1 lädt mit Spinner neu, Die Tabelle bleibt leer]
        answer: 0
        explanation: Seite 1 ist noch im Cache (gcTime 5 Minuten). Ist sie veraltet, lädt TanStack Query sie im Hintergrund nach.
---
Eine Kundenliste mit 12 000 Einträgen lädt niemand auf einmal. Die API liefert sie in Häppchen – Seite für
Seite oder als „Mehr laden“-Liste. TanStack Query hat für beide Muster passende Werkzeuge, und beide bauen auf
dem auf, was du schon kennst: Jede Seite ist ein Cache-Eintrag mit eigenem Key.

## Seitenweise blättern

Bei klassischer [[paginierung|Paginierung]] steckt die Seitennummer im Query Key. Jede Seite ist damit ein
eigener Cache-Eintrag:

```tsx title="KundenListe.tsx"
import { keepPreviousData, useQuery } from '@tanstack/react-query'

function KundenListe() {
  const [seite, setSeite] = useState(1)
  const { data, isPending, isPlaceholderData } = useQuery({
    queryKey: ['kunden', { seite }],
    queryFn: () => ladeKunden(seite),
    placeholderData: keepPreviousData,
  })

  if (isPending) return <p>Lädt …</p>
  return (
    <>
      <Tabelle zeilen={data.zeilen} />
      <button onClick={() => setSeite((s) => s - 1)} disabled={seite === 1}>Zurück</button>
      <button
        onClick={() => setSeite((s) => s + 1)}
        disabled={isPlaceholderData || !data.hatMehr}
      >
        Weiter
      </button>
    </>
  )
}
```

Ohne Zusatz wäre Seite 2 beim ersten Besuch leer – die Tabelle würde kurz verschwinden und wieder auftauchen.
[[placeholder-data|placeholderData]] mit dem Helfer `keepPreviousData` zeigt stattdessen die alten Zeilen, bis
die neuen da sind. `isPlaceholderData` verrät dir, dass gerade Platzhalter angezeigt werden – ideal, um den
Weiter-Button zu sperren.

> [!TIPP]
> In Version 4 hieß die Option `keepPreviousData: true`. Seit Version 5 ist es `placeholderData: keepPreviousData`.

## Die nächste Seite vorladen

Noch flüssiger wird es, wenn du die nächste Seite schon lädst, während der Nutzer die aktuelle liest. Dafür
fragst du den QueryClient direkt:

```tsx
const queryClient = useQueryClient()

useEffect(() => {
  if (data?.hatMehr) {
    queryClient.query(kundenSeiteQuery(seite + 1)).catch(() => {})
  }
}, [data, seite, queryClient])
```

`kundenSeiteQuery(seite)` liefert dasselbe Objekt aus `queryKey` und `queryFn` wie oben – wie du solche
wiederverwendbaren Optionen baust, lernst du in der nächsten Lektion. `queryClient.query(...)` liefert die
Daten aus dem Cache, wenn sie frisch sind, und lädt sonst. Der Fehler
wird hier bewusst verschluckt: Scheitert das [[prefetching|Vorladen]], lädt die Seite eben beim Klick. Ältere
Codebasen nutzen dafür noch `prefetchQuery` – das funktioniert weiter, ist aber zugunsten von `query`
als veraltet markiert.

## Endlos-Listen mit useInfiniteQuery

Feeds, Kommentare oder Suchergebnisse zeigt man oft als wachsende Liste mit „Mehr laden“. Hier wäre jede Seite
als eigener Key unpraktisch – du brauchst **alle** bisher geladenen Seiten zusammen. Genau das macht eine
[[infinite-query|Infinite Query]]:

```tsx title="BeitragsFeed.tsx"
import { useInfiniteQuery } from '@tanstack/react-query'

type Seite = { eintraege: Beitrag[]; naechsterCursor: number | null }

function BeitragsFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery({
    queryKey: ['beitraege'],
    queryFn: ({ pageParam }) => ladeBeitraege(pageParam),
    initialPageParam: 0,
    getNextPageParam: (letzteSeite: Seite) => letzteSeite.naechsterCursor ?? undefined,
  })

  if (isPending) return <p>Lädt …</p>
  const beitraege = data.pages.flatMap((seite) => seite.eintraege)

  return (
    <>
      <ul>{beitraege.map((b) => <li key={b.id}>{b.titel}</li>)}</ul>
      <button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
        {isFetchingNextPage ? 'Lädt …' : hasNextPage ? 'Mehr laden' : 'Alles geladen'}
      </button>
    </>
  )
}
```

So funktioniert es:

| Teil | Aufgabe |
|---|---|
| `initialPageParam` | Parameter der ersten Seite – hier Cursor `0` (Pflicht seit Version 5) |
| `queryFn({ pageParam })` | Lädt **eine** Seite zum übergebenen Parameter |
| `getNextPageParam(letzteSeite, alleSeiten)` | Liefert den nächsten Parameter oder `undefined` = Ende |
| `data.pages` / `data.pageParams` | Alle geladenen Seiten und ihre Parameter |
| `fetchNextPage()` / `hasNextPage` | Nächste Seite laden / gibt es noch eine? |

Die API nutzt hier [[cursor-paginierung|Cursor-Paginierung]]: Jede Antwort sagt, wo die nächste Seite
beginnt. Das ist robuster als Seitennummern, wenn zwischendurch Einträge hinzukommen.

> [!FEHLER]
> **`fetchNextPage` während eines laufenden Ladevorgangs erneut auslösen.** Ein „Mehr laden“ beim Scrollen kann
> mehrfach feuern. Prüfe `hasNextPage && !isFetchingNextPage`, bevor du lädst – sonst verlierst du Seiten
> oder lädst sie doppelt.

## Was beim Neuladen passiert

Wird eine Infinite Query veraltet und neu geladen, holt TanStack Query **alle** Seiten nacheinander neu – ab der
ersten, mit frisch berechneten Parametern. So bleibt die Liste in sich stimmig, auch wenn vorn neue Einträge
dazugekommen sind. Bei sehr langen Listen begrenzt `maxPages` die Zahl der Seiten im Cache.

> [!MERKSATZ]
> **Blättern** (eine Seite sichtbar): `useQuery` mit Seite im Key plus `placeholderData: keepPreviousData`.
> **Anhängen** (alle bisherigen Seiten sichtbar): `useInfiniteQuery` mit `getNextPageParam`.

> [!PRAXIS]
> Admin-Tabellen blättern fast immer seitenweise, weil Nutzer gezielt auf Seite 37 springen oder Filter in der
> URL teilen wollen. Feeds und Chat-Verläufe hängen dagegen an – dort zählt das flüssige Weiterlesen.

## Zusammenfassung

- Bei Paginierung gehört die Seite in den Query Key – jede Seite ist ein eigener Cache-Eintrag.
- `placeholderData: keepPreviousData` verhindert leere Tabellen beim Blättern; `isPlaceholderData` sperrt die Navigation.
- Mit `queryClient.query(...)` lädst du die nächste Seite vor.
- `useInfiniteQuery` sammelt Seiten in `data.pages`; `initialPageParam` und `getNextPageParam` steuern den Ablauf.
- Liefert `getNextPageParam` `undefined`, ist `hasNextPage` false.
- Beim Neuladen einer Infinite Query werden alle Seiten nacheinander neu geholt.
