---
title: Serverseitige Tabellen mit Query und Table
summary: Große Datenmengen auf dem Server sortieren, filtern und blättern lassen – mit manual-Optionen, rowCount und dem Tabellen-Zustand im Query Key.
duration: 25
sources:
  - title: TanStack Table – Pagination Guide (Manual Server-Side Pagination)
    url: https://tanstack.com/table/latest/docs/guide/pagination
  - title: TanStack Table – Row Models Guide
    url: https://tanstack.com/table/latest/docs/guide/row-models
  - title: TanStack Query – Paginated Queries
    url: https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries
  - title: TanStack Table – Example with TanStack Query
    url: https://tanstack.com/table/latest/docs/framework/react/examples/with-tanstack-query
quiz:
  - type: single
    question: "Was bewirkt `manualPagination: true`?"
    options:
      - Die Tabelle lädt die nächste Seite automatisch vom Server.
      - Die Tabelle schneidet die Zeilen nicht mehr selbst zu, sondern zeigt `data` als bereits fertige Seite an.
      - Der Nutzer muss die Seitenzahl von Hand eintippen.
      - Die Tabelle zeigt alle Zeilen ohne Seiten.
    answer: 1
    explanation: "manual… schaltet nur die Rechnung im Browser ab – es lädt nichts. Das Laden übernimmt TanStack Query mit dem Tabellen-Zustand im Query Key."
  - type: multiple
    question: Was gehört bei einer serverseitigen Tabelle in den Query Key?
    options:
      - Seite und Seitengröße (pagination)
      - Sortierung (sorting)
      - Spaltenfilter (columnFilters)
      - Die Spaltendefinitionen
    answers: [0, 1, 2]
    explanation: Alles, was der Server zum Berechnen der Seite braucht, gehört in den Key. Die Spalten ändern die Antwort nicht.
  - type: find-bug
    question: Die Tabelle zeigt nach dem Sortieren nur die 20 Zeilen der aktuellen Seite in neuer Reihenfolge – nicht die 20 kleinsten Werte aller Daten. Welche Zeile ist falsch?
    language: ts
    code: |
      const table = useTable({
        features,
        columns,
        data: ergebnis.data?.zeilen ?? leer,
        rowCount: ergebnis.data?.gesamt,
        state: { sorting, pagination },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        manualPagination: true,
        manualSorting: false,
      })
    bug_line: 10
    explanation: Ohne manualSorting sortiert die Tabelle selbst – aber sie kennt nur die geladene Seite. Bei serverseitigem Blättern muss auch der Server sortieren, also manualSorting true und die Sortierung in den Query Key.
  - type: cloze
    text: "Damit die Tabelle weiß, wie viele Seiten es gibt, übergibst du die Gesamtzahl mit `___`. Damit beim Blättern nicht kurz eine leere Tabelle erscheint, nutzt die Query `placeholderData: ___`."
    blanks:
      - [rowCount]
      - [keepPreviousData]
    explanation: Aus rowCount und pageSize berechnet die Tabelle getPageCount und getCanNextPage. keepPreviousData zeigt die alte Seite, bis die neue da ist.
tasks:
  - id: client-oder-server
    type: dragdrop
    title: Clientseitig oder serverseitig?
    description: Entscheide für jede Tabelle, wer sortieren, filtern und blättern sollte.
    targets:
      - { id: client, label: "Clientseitig (alle Daten laden, Table rechnet)" }
      - { id: server, label: "Serverseitig (manual…, Query lädt Seiten)" }
    items:
      - { label: "Die 12 Mitglieder deines Teams", target: client }
      - { label: "Die 40 Länder in einem Auswahl-Dialog", target: client }
      - { label: "Deine 150 eigenen Projekte", target: client }
      - { label: "2 Millionen Bestellungen im Admin-Bereich", target: server }
      - { label: "Alle Log-Einträge der letzten 30 Tage", target: server }
      - { label: "Kundenliste mit 80 000 Einträgen und Volltextsuche", target: server }
    hints:
      - Frage dich, ob du alle Zeilen ohne Bauchschmerzen auf einmal übers Netz schicken würdest.
  - id: server-tabelle-ablauf
    type: steps
    title: Was passiert als Nächstes?
    description: "Eine serverseitige Tabelle nutzt `useQuery({ queryKey: ['bestellungen', { pagination, sorting, columnFilters }], …, placeholderData: keepPreviousData })` und `manualPagination`, `manualSorting`, `manualFiltering`."
    steps:
      - situation: Der Nutzer klickt auf den Spaltenkopf „Betrag“.
        question: Was passiert?
        options: [Die Tabelle sortiert die 20 geladenen Zeilen im Browser, onSortingChange setzt den State – der Query Key ändert sich und TanStack Query lädt die sortierte Seite vom Server, Nichts – manualSorting verbietet das Sortieren]
        answer: 1
        explanation: Der neue Sortier-Zustand landet im Key. Ein neuer Key ist ein neuer Cache-Eintrag, also startet automatisch ein Request.
      - situation: Der Nutzer steht auf Seite 7 und tippt „Müller“ ins Namensfilter-Feld.
        question: Worauf musst du bei manueller Paginierung selbst achten?
        options: [Auf nichts, Die Seite auf 0 zurückzusetzen – bei manualPagination macht die Tabelle das nicht automatisch, Den Filter in localStorage zu speichern]
        answer: 1
        explanation: Bei manueller Paginierung gibt es keinen automatischen Rücksprung. Sonst fragst du Seite 7 der gefilterten Ergebnisse ab – die es vielleicht gar nicht gibt.
      - situation: Der Nutzer tippt sehr schnell „M“, „Mü“, „Mül“, „Müll“, „Mülle“, „Müller“.
        question: Wie vermeidest du sechs Requests?
        options: [Den Filterwert entprellen (Debounce) und erst nach einer kurzen Tipp-Pause in den State übernehmen, staleTime auf Infinity setzen, Gar nicht – das ist unvermeidbar]
        answer: 0
        explanation: Ein Debounce von etwa 300 ms übernimmt den Wert erst, wenn der Nutzer kurz aufhört zu tippen. Dazwischen erzeugt keine Eingabe einen neuen Query Key.
---
Der Admin-Bereich soll 2 Millionen Bestellungen zeigen. Alle auf einmal laden? Dann wartet der Browser minutenlang,
und der Arbeitsspeicher läuft voll. Ab einer gewissen Menge muss der **Server** sortieren, filtern und blättern.
Die Tabelle zeigt dann nur noch an – und TanStack Query holt die passenden Seiten.

## Wer rechnet: Browser oder Server?

![Vergleich: Clientseitig rechnet TanStack Table im Browser, serverseitig liefert die API fertige Seiten](/assets/server-state-tanstack/client-oder-server.svg)

| | Clientseitig | Serverseitig |
|---|---|---|
| Datenmenge | bis einige tausend Zeilen | beliebig groß |
| Laden | einmal alles | jede Seite einzeln |
| Sortieren, Filtern | Zeilenmodelle im Browser | Datenbank (`ORDER BY`, `WHERE`) |
| Reaktion | sofort | nach Server-Antwort (oder aus dem Cache) |
| API muss können | nur „alles liefern“ | Seite, Sortierung, Filter als Parameter |

Die Regel: Sobald du **blätterst**, weil die Daten zu groß sind, muss der Server auch **sortieren und
filtern**. Sonst würdest du nur die geladene Seite sortieren – und „die 20 kleinsten Beträge“ wären in
Wirklichkeit die 20 Beträge von Seite 1 in neuer Reihenfolge.

## manual-Optionen und rowCount

Für die serverseitige Variante meldest du die Features ohne Zeilenmodelle an und schaltest die Rechnung mit den
[[manueller-modus|manual-Optionen]] ab:

```ts
const features = tableFeatures({ rowSortingFeature, columnFilteringFeature, rowPaginationFeature })

const table = useTable({
  features,
  columns,
  data: ergebnis.data?.zeilen ?? leer,
  rowCount: ergebnis.data?.gesamt,
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
  // ... kontrollierter Zustand, siehe unten
})
```

| Option | Bedeutung |
|---|---|
| `manualPagination` | `data` ist bereits die fertige Seite |
| `manualSorting` | `data` ist bereits sortiert |
| `manualFiltering` | `data` ist bereits gefiltert |
| `rowCount` | Gesamtzahl aller Zeilen auf dem Server – daraus folgen `getPageCount()` und `getCanNextPage()` |

> [!FEHLER]
> **Erwarten, dass manual… etwas lädt.** `manualPagination` schaltet nur das Zuschneiden im Browser ab. Es
> schickt keinen Request. Das Laden ist Aufgabe von TanStack Query – die Tabelle liefert nur den Zustand.

## Der Tabellen-Zustand wandert in den Query Key

Jetzt kommen beide Bibliotheken zusammen. Den Zustand der Tabelle hältst du selbst (kontrolliert) und steckst ihn
in den Query Key:

```tsx title="BestellTabelle.tsx"
const leer: Bestellung[] = []

export function BestellTabelle() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  const ergebnis = useQuery({
    queryKey: ['bestellungen', { pagination, sorting, columnFilters }],
    queryFn: () => ladeBestellungen({ pagination, sorting, columnFilters }),
    placeholderData: keepPreviousData,
  })

  const table = useTable({
    features, columns,
    data: ergebnis.data?.zeilen ?? leer,
    rowCount: ergebnis.data?.gesamt,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    manualPagination: true, manualSorting: true, manualFiltering: true,
  })
  // ... Markup wie gehabt, plus ein Hinweis bei ergebnis.isFetching
}
```

Klickt jemand auf einen Spaltenkopf, ruft die Tabelle `onSortingChange` auf. Der State ändert sich, damit der
Query Key – und TanStack Query lädt die neue Seite. Kehrt der Nutzer zu einer schon besuchten Kombination zurück,
kommt sie sofort aus dem Cache. `ladeBestellungen` übersetzt den Zustand in
[[query-string|Query-Parameter]] wie `?seite=3&sort=betrag&richtung=desc`.

> [!MERKSATZ]
> Die **Tabelle** verwaltet, *was* der Nutzer sehen will (Seite, Sortierung, Filter). **TanStack Query** holt
> es. Die Brücke ist der Query Key.

## Feinschliff für echte Nutzer

| Problem | Lösung |
|---|---|
| Beim Blättern flackert die Tabelle leer | `placeholderData: keepPreviousData`, Weiter-Button bei `isPlaceholderData` sperren |
| Nach dem Filtern steht man auf einer nicht existierenden Seite | Bei Filteränderung `pageIndex` selbst auf 0 setzen – bei `manualPagination` passiert das nicht automatisch |
| Jeder Tastendruck im Filter startet einen Request | Eingabe entprellen ([[debounce|Debounce]], z. B. 300 ms) |
| Nach dem Neuladen der Seite ist alles zurückgesetzt | Zustand in die URL schreiben (Suchparameter) statt nur in `useState` |

> [!PRAXIS]
> In großen Admin-Oberflächen steht der komplette Tabellen-Zustand in der URL. So kann man einen Link wie
> „alle offenen Bestellungen über 500 €, nach Datum sortiert, Seite 3“ an Kollegen schicken – und der Router-Loader
> lädt genau diese Seite schon beim Öffnen vor.

## Zusammenfassung

- Kleine Datenmengen rechnet die Tabelle im Browser, große der Server.
- Wer auf dem Server blättert, muss dort auch sortieren und filtern.
- `manualPagination`, `manualSorting` und `manualFiltering` schalten die Browser-Rechnung ab – sie laden nichts.
- `rowCount` verrät der Tabelle die Gesamtzahl der Zeilen.
- Der kontrollierte Tabellen-Zustand gehört in den Query Key; `keepPreviousData` verhindert Flackern.
- Bei manueller Paginierung setzt du die Seite nach Filteränderungen selbst zurück und entprellst Eingaben.
