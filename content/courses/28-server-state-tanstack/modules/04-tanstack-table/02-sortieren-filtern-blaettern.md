---
title: Sortieren, Filtern und Blättern im Browser
summary: Features und Zeilenmodelle anmelden, Spaltenköpfe klickbar machen, Filterfelder anbinden und Seiten durchblättern – alles clientseitig.
duration: 25
sources:
  - title: TanStack Table – Sorting Guide
    url: https://tanstack.com/table/latest/docs/guide/sorting
  - title: TanStack Table – Column Filtering Guide
    url: https://tanstack.com/table/latest/docs/guide/column-filtering
  - title: TanStack Table – Pagination Guide
    url: https://tanstack.com/table/latest/docs/guide/pagination
  - title: TanStack Table – Row Models Guide
    url: https://tanstack.com/table/latest/docs/guide/row-models
  - title: TanStack Table – Table State Guide (React)
    url: https://tanstack.com/table/latest/docs/framework/react/guide/table-state
quiz:
  - type: single
    question: Du hast `rowSortingFeature` angemeldet, aber die Zeilen bleiben beim Klick unsortiert. Was fehlt wahrscheinlich?
    options:
      - "Das Zeilenmodell `sortedRowModel: createSortedRowModel()` in tableFeatures"
      - Eine CSS-Klasse für sortierte Spalten
      - Ein zweiter Aufruf von useTable
      - Die Option `manualSorting: true`
    answer: 0
    explanation: Das Feature bringt Zustand und APIs (z. B. getToggleSortingHandler). Die eigentliche Sortierung im Browser rechnet erst das Zeilenmodell. manualSorting würde die Sortierung sogar ausdrücklich abschalten.
  - type: match
    question: Welche Methode brauchst du wofür?
    pairs:
      - { left: "column.getToggleSortingHandler()", right: "Klick-Handler für den Spaltenkopf" }
      - { left: "column.getIsSorted()", right: "Liefert 'asc', 'desc' oder false für den Pfeil" }
      - { left: "column.setFilterValue(text)", right: "Filterwert aus einem Eingabefeld setzen" }
      - { left: "table.getCanNextPage()", right: "Weiter-Button aktivieren oder sperren" }
    explanation: Alle diese Methoden existieren nur, wenn das passende Feature angemeldet ist.
  - type: cloze
    text: "Willst du den Sortier-Zustand selbst halten (z. B. für die URL), übergibst du `state: { sorting }` und den Callback `on___Change`. Für die Startseite mit 20 Zeilen reicht dagegen `___: { pagination: { pageIndex: 0, pageSize: 20 } }`."
    blanks:
      - [Sorting]
      - [initialState]
    explanation: Kontrollierter Zustand braucht Wert und Callback. Wenn dich nur der Startwert interessiert, genügt initialState.
  - type: find-bug
    question: Nach dem Filtern zeigt die Tabelle manchmal eine leere Seite, obwohl es Treffer gibt. In welcher Zeile liegt die Ursache?
    language: ts
    code: |
      const table = useTable({
        features,
        columns,
        data,
        autoResetPageIndex: false,
        initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
      })
    bug_line: 5
    explanation: Standardmäßig springt die Tabelle nach dem Filtern auf Seite 1 zurück. Mit autoResetPageIndex false bleibt sie z. B. auf Seite 4 – auch wenn es nach dem Filtern nur noch eine Seite gibt.
tasks:
  - id: pipeline-beschriften
    type: diagram
    title: Beschrifte die Zeilen-Pipeline
    description: Die Zeilen durchlaufen in TanStack Table mehrere Stufen. Ordne die Stufen in der richtigen Reihenfolge den Kästen zu.
    image: /assets/server-state-tanstack/zeilen-pipeline-leer.svg
    slots:
      - { x: 30, y: 40, answer: Core }
      - { x: 50, y: 40, answer: Filtern }
      - { x: 70, y: 40, answer: Sortieren }
      - { x: 90, y: 40, answer: Blättern }
    distractors: [Rendern, Laden]
    hints:
      - Blättern kommt zuletzt – sonst würdest du nur die aktuelle Seite filtern und sortieren.
  - id: pipeline-von-hand
    type: code
    language: ts
    title: Die Pipeline selbst nachbauen
    description: |
      Um zu verstehen, was die Zeilenmodelle tun, baust du sie einmal von Hand. Alle Funktionen geben **neue**
      Arrays zurück und verändern die Eingabe nicht.

      1. `filtern(zeilen, spalte, text)`: Behalte nur Zeilen, deren Wert in `spalte` den `text` enthält –
         ohne Rücksicht auf Groß- und Kleinschreibung. Ein leerer Text behält alle Zeilen.
      2. `sortieren(zeilen, sortierung)`: `sortierung` ist ein Array wie `[{ id: 'alter', desc: true }]` (wie der
         Sortier-Zustand von TanStack Table). Leeres Array = unverändert. Sonst sortierst du nach dem ersten Eintrag:
         Zahlen numerisch, Texte mit `localeCompare`; `desc: true` dreht die Reihenfolge um.
      3. `seite(zeilen, { pageIndex, pageSize })` liefert die Zeilen der Seite (`pageIndex` beginnt bei 0).
      4. `pipeline(zeilen, zustand)` wendet alles in der richtigen Reihenfolge an: filtern, sortieren, blättern.
    starter: |
      type Mitarbeiter = { name: string; team: string; alter: number }
      type Sortierung = { id: keyof Mitarbeiter; desc: boolean }[]
      type Seite = { pageIndex: number; pageSize: number }
      type Zustand = { filter: { spalte: keyof Mitarbeiter; text: string }; sorting: Sortierung; pagination: Seite }

      function filtern(zeilen: Mitarbeiter[], spalte: keyof Mitarbeiter, text: string): Mitarbeiter[] {
        return zeilen
      }

      function sortieren(zeilen: Mitarbeiter[], sortierung: Sortierung): Mitarbeiter[] {
        return zeilen
      }

      function seite(zeilen: Mitarbeiter[], pagination: Seite): Mitarbeiter[] {
        return zeilen
      }

      function pipeline(zeilen: Mitarbeiter[], zustand: Zustand): Mitarbeiter[] {
        return zeilen
      }

      const team: Mitarbeiter[] = [
        { name: 'Mira', team: 'Web', alter: 31 },
        { name: 'Ada', team: 'API', alter: 36 },
        { name: 'Linus', team: 'Web', alter: 28 },
        { name: 'Grace', team: 'API', alter: 45 },
        { name: 'Alan', team: 'Data', alter: 41 },
      ]
    tests:
      - name: filtern ignoriert Groß- und Kleinschreibung
        code: |
          assertDeepEqual(filtern(team, 'team', 'web').map((m) => m.name), ['Mira', 'Linus'])
          assertEqual(filtern(team, 'name', '').length, 5)
      - name: sortieren nach Zahl und Text
        code: |
          assertDeepEqual(sortieren(team, [{ id: 'alter', desc: false }]).map((m) => m.alter), [28, 31, 36, 41, 45])
          assertDeepEqual(sortieren(team, [{ id: 'name', desc: true }]).map((m) => m.name), ['Mira', 'Linus', 'Grace', 'Alan', 'Ada'])
          assertEqual(team[0].name, 'Mira', 'sortieren darf die Eingabe nicht verändern.')
          assertEqual(sortieren(team, []), team)
      - name: seite schneidet richtig
        code: |
          assertDeepEqual(seite(team, { pageIndex: 1, pageSize: 2 }).map((m) => m.name), ['Linus', 'Grace'])
          assertDeepEqual(seite(team, { pageIndex: 5, pageSize: 2 }), [])
      - name: pipeline in der richtigen Reihenfolge
        code: |
          const ergebnis = pipeline(team, {
            filter: { spalte: 'name', text: 'a' },
            sorting: [{ id: 'alter', desc: true }],
            pagination: { pageIndex: 0, pageSize: 2 },
          })
          assertDeepEqual(ergebnis.map((m) => m.name), ['Grace', 'Alan'])
    hints:
      - "Filtern: `String(z[spalte]).toLowerCase().includes(text.toLowerCase())`."
      - "Sortieren: `[...zeilen].sort((a, b) => …)` – die Kopie schützt die Eingabe. Für Zahlen `a - b`, für Texte `String(a).localeCompare(String(b))`, bei `desc` mit -1 multiplizieren."
      - "Seite: `zeilen.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)`."
    solution: |
      type Mitarbeiter = { name: string; team: string; alter: number }
      type Sortierung = { id: keyof Mitarbeiter; desc: boolean }[]
      type Seite = { pageIndex: number; pageSize: number }
      type Zustand = { filter: { spalte: keyof Mitarbeiter; text: string }; sorting: Sortierung; pagination: Seite }

      function filtern(zeilen: Mitarbeiter[], spalte: keyof Mitarbeiter, text: string): Mitarbeiter[] {
        const suche = text.toLowerCase()
        return zeilen.filter((z) => String(z[spalte]).toLowerCase().includes(suche))
      }

      function sortieren(zeilen: Mitarbeiter[], sortierung: Sortierung): Mitarbeiter[] {
        if (sortierung.length === 0) return zeilen
        const { id, desc } = sortierung[0]
        const richtung = desc ? -1 : 1
        return [...zeilen].sort((a, b) => {
          const x = a[id]
          const y = b[id]
          const vergleich = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
          return vergleich * richtung
        })
      }

      function seite(zeilen: Mitarbeiter[], pagination: Seite): Mitarbeiter[] {
        const start = pagination.pageIndex * pagination.pageSize
        return zeilen.slice(start, start + pagination.pageSize)
      }

      function pipeline(zeilen: Mitarbeiter[], zustand: Zustand): Mitarbeiter[] {
        const gefiltert = filtern(zeilen, zustand.filter.spalte, zustand.filter.text)
        return seite(sortieren(gefiltert, zustand.sorting), zustand.pagination)
      }

      const team: Mitarbeiter[] = [
        { name: 'Mira', team: 'Web', alter: 31 },
        { name: 'Ada', team: 'API', alter: 36 },
        { name: 'Linus', team: 'Web', alter: 28 },
        { name: 'Grace', team: 'API', alter: 45 },
        { name: 'Alan', team: 'Data', alter: 41 },
      ]
---
Deine Mitarbeiter-Tabelle zeigt 300 Zeilen. Niemand scrollt da durch. Nutzer wollen nach dem Alter sortieren,
nach einem Namen filtern und seitenweise blättern. Liegen alle Daten schon im Browser, rechnet TanStack Table das
für dich – du meldest nur an, was die Tabelle können soll.

## Features und Zeilenmodelle anmelden

In Version 9 besteht jede Fähigkeit aus zwei Teilen: dem **Feature** (Zustand und Methoden) und dem
**Zeilenmodell** ([[row-model|Row Model]]), das im Browser die eigentliche Rechenarbeit erledigt.

```ts title="src/spalten.ts"
import {
  columnFilteringFeature, createFilteredRowModel, filterFn_includesString,
  rowSortingFeature, createSortedRowModel, sortFn_alphanumeric,
  rowPaginationFeature, createPaginatedRowModel,
  tableFeatures,
} from '@tanstack/react-table'

export const features = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})
```

Das wirkt ausführlich, hat aber einen Grund: Was du nicht anmeldest, landet nicht im Bundle
([[tree-shaking|Tree Shaking]]). Die Zeilen laufen dann durch eine feste Pipeline:

![Die Zeilen-Pipeline: data, Core, Filtern, Sortieren, Blättern, getRowModel](/assets/server-state-tanstack/zeilen-pipeline.svg)

> [!FEHLER]
> **Feature ohne Zeilenmodell.** Mit `rowSortingFeature` allein hast du zwar `getToggleSortingHandler()` und
> Sortier-Zustand, aber keine sortierten Zeilen. Erst `sortedRowModel: createSortedRowModel()` sortiert im
> Browser. Fehlt eine Methode ganz, ist meist das Feature nicht angemeldet.

## Sortieren per Klick auf den Spaltenkopf

```tsx
<th key={kopf.id} onClick={kopf.column.getToggleSortingHandler()}>
  <table.FlexRender header={kopf} />
  {{ asc: ' ▲', desc: ' ▼' }[kopf.column.getIsSorted() as string] ?? null}
</th>
```

Jeder Klick schaltet weiter: aufsteigend, absteigend, unsortiert. Mit gedrückter Umschalttaste sortierst du nach
mehreren Spalten. Pro Spalte stellst du ein, was gilt:

```ts
helper.accessor('alter', { header: 'Alter', sortUndefined: 'last' }),
helper.display({ id: 'aktionen', enableSorting: false, cell: … }),
```

Zahlen sortiert die Tabelle ohne Weiteres; für Texte nutzt sie die angemeldeten `sortFns`.

Denk an [[barrierefreiheit|Barrierefreiheit]]: Ein `<th>` mit `onClick` erreicht man nicht mit der Tastatur.
Besser legst du einen `<button>` in den Spaltenkopf und setzt am `<th>` das Attribut `aria-sort`
(`ascending`, `descending` oder `none`). Mit `kopf.column.getCanSort()` prüfst du vorher, ob die Spalte
überhaupt sortierbar ist – bei Aktions-Spalten rendert du dann nur die Überschrift.

## Filtern

Für einen Spaltenfilter liest und setzt ein Eingabefeld den Filterwert der Spalte:

```tsx
const nameSpalte = table.getColumn('name')

<input
  placeholder="Name suchen …"
  value={(nameSpalte?.getFilterValue() as string) ?? ''}
  onChange={(e) => nameSpalte?.setFilterValue(e.target.value)}
/>
```

Dazu gibst du der Spalte mit `filterFn: 'includesString'` die Filterfunktion (Teiltext, ohne Groß- und
Kleinschreibung). Ein leerer Wert entfernt den Filter. Für ein Suchfeld über **alle** Spalten gibt es zusätzlich
das `globalFilteringFeature`.

## Blättern

```tsx
const table = useTable({
  features, columns, data,
  initialState: { pagination: { pageIndex: 0, pageSize: 20 } },
})

<button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Zurück</button>
<span>Seite {table.state.pagination.pageIndex + 1} von {table.getPageCount()}</span>
<button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Weiter</button>
```

Ändert sich der Filter, springt die Tabelle automatisch auf die erste Seite zurück – sonst stündest du nach dem
Filtern womöglich auf einer Seite, die es nicht mehr gibt.

## Zustand selbst halten

Standardmäßig verwaltet die Tabelle Sortierung, Filter und Seite intern. Willst du einen Wert selbst halten –
etwa um ihn in die URL zu schreiben oder an den Server zu schicken –, machst du ihn **kontrolliert**
(wie eine [[kontrollierte-komponente|kontrollierte Komponente]]):

```tsx
const [sorting, setSorting] = useState<SortingState>([])

const table = useTable({
  features, columns, data,
  state: { sorting },
  onSortingChange: setSorting,
})
```

Wichtig: Immer **beides** übergeben – Wert und Callback. Der Callback bekommt manchmal einen Wert, manchmal
eine [[updater-funktion|Updater-Funktion]]; der Setter von `useState` kann mit beidem umgehen.

> [!MERKSATZ]
> Feature anmelden → Zeilenmodell anmelden → UI an die Methoden der Spalte oder Tabelle hängen. Zustand
> kontrollierst du nur, wenn du ihn außerhalb der Tabelle brauchst.

> [!PRAXIS]
> Clientseitig zu sortieren und zu filtern ist ideal für Listen bis zu einigen tausend Zeilen, die ohnehin
> komplett geladen werden – etwa Einstellungen, Teammitglieder oder die eigenen Projekte. Für größere Mengen
> brauchst du den Server, mehr dazu in der nächsten Lektion.

## Zusammenfassung

- Jede Fähigkeit braucht ein **Feature** (Zustand, Methoden) und für die Browser-Rechnung ein **Zeilenmodell**.
- Die Pipeline lautet: Core → Filtern → Sortieren → Blättern → `getRowModel()`.
- Sortieren: `getToggleSortingHandler()` am Spaltenkopf, `getIsSorted()` für den Pfeil.
- Filtern: `getFilterValue()` / `setFilterValue()` an einem Eingabefeld, `filterFn` pro Spalte.
- Blättern: `initialState.pagination`, `nextPage()`, `getCanNextPage()`, `getPageCount()`.
- Kontrollierter Zustand braucht Wert **und** `on…Change`-Callback.
