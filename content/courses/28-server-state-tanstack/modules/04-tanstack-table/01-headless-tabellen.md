---
title: Headless-Tabellen mit TanStack Table
summary: Was „headless“ bedeutet und wie du mit Features, Spaltendefinitionen und useTable eine erste Tabelle renderst.
duration: 25
sources:
  - title: TanStack Table – Introduction
    url: https://tanstack.com/table/latest/docs/introduction
  - title: TanStack Table – React Table (Adapter)
    url: https://tanstack.com/table/latest/docs/framework/react/react-table
  - title: TanStack Table – Column Definitions Guide
    url: https://tanstack.com/table/latest/docs/guide/column-defs
  - title: TanStack Table – Migrating to V9
    url: https://tanstack.com/table/latest/docs/framework/react/guide/migrating
quiz:
  - type: single
    question: Was bedeutet es, dass TanStack Table „headless“ ist?
    options:
      - Die Tabelle hat keine Kopfzeile.
      - Die Bibliothek liefert Logik und Zustand, aber kein Markup und kein Styling – das renderst du selbst.
      - Die Tabelle läuft nur auf dem Server.
      - Die Bibliothek hat keine Dokumentation.
    answer: 1
    explanation: Sortieren, Filtern und Blättern rechnet die Bibliothek. Welche HTML-Elemente, Klassen und Komponenten daraus werden, entscheidest du – deshalb passt sie zu jedem Design-System.
  - type: match
    question: Ordne jedem Baustein seine Aufgabe zu.
    pairs:
      - { left: "tableFeatures({...})", right: "Legt fest, welche Fähigkeiten die Tabelle hat" }
      - { left: "createColumnHelper", right: "Baut typsichere Spaltendefinitionen" }
      - { left: "useTable", right: "Erzeugt die Tabellen-Instanz in einer React-Komponente" }
      - { left: "table.FlexRender", right: "Rendert Kopf- oder Zellinhalt einer Spalte" }
    explanation: Features und Spalten beschreiben die Tabelle, useTable rechnet daraus Kopfzeilen und Zeilen, FlexRender bringt den Inhalt ins Markup.
  - type: multiple
    question: Warum sollen `features`, `columns` und die leere Ersatzliste außerhalb der Komponente (oder stabil per useMemo/useState) liegen?
    options:
      - Bei jedem neuen Array berechnet die Tabelle ihre Zeilenmodelle neu.
      - Neue Referenzen bei jedem Rendern können Endlosschleifen auslösen.
      - TypeScript erlaubt sonst keine Generics.
      - "`data ?? []` erzeugt bei jedem Rendern ein neues leeres Array."
    answers: [0, 1, 3]
    explanation: TanStack Table vergleicht Referenzen. Ein bei jedem Rendern neu erzeugtes Array sieht für sie wie neue Daten aus.
  - type: find-bug
    question: Die Tabelle rendert endlos neu, sobald die Query noch keine Daten hat. Welche Zeile ist schuld?
    language: tsx
    code: |
      const features = tableFeatures({})
      const columns = helper.columns([helper.accessor('name', { header: 'Name' })])

      function Kunden() {
        const { data } = useQuery(kundenQuery())
        const table = useTable({ features, columns, data: data ?? [] })
        return <Tabelle table={table} />
      }
    bug_line: 6
    explanation: "`data ?? []` erzeugt bei jedem Rendern ein neues leeres Array. Lege eine Konstante `const leer: Kunde[] = []` außerhalb der Komponente an und schreibe `data ?? leer`."
tasks:
  - id: wer-macht-was
    type: dragdrop
    title: Wer ist wofür zuständig?
    description: Ordne jede Aufgabe zu – erledigt sie TanStack Table oder deine React-Komponente?
    targets:
      - { id: table, label: TanStack Table (Logik und Zustand) }
      - { id: app, label: Deine Komponente (Markup und Aussehen) }
    items:
      - { label: "Zeilen nach dem Alter sortieren", target: table }
      - { label: "Merken, welche Spalte gerade sortiert ist", target: table }
      - { label: "Berechnen, wie viele Seiten es gibt", target: table }
      - { label: "Ein <table> mit <thead> und <tbody> rendern", target: app }
      - { label: "Tailwind-Klassen für gestreifte Zeilen setzen", target: app }
      - { label: "Einen Pfeil ▲ im sortierten Spaltenkopf anzeigen", target: app }
    hints:
      - Alles, was man sehen kann, ist Sache deiner Komponente. Alles, was man ausrechnen kann, übernimmt die Bibliothek.
  - id: erste-spalten
    type: terminal
    title: Die ersten Spaltendefinitionen
    description: |
      Im Ordner `erste-tabelle` liegt ein Node-Projekt (`"type": "module"`) mit React. In `src/daten.ts` gibt es den
      Typ `Mitarbeiter` (`id`, `name`, `team`, `alter`) und eine Beispielliste.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Projekt angelegt wird.

      1. Installiere `@tanstack/react-table`.
      2. Lege `src/spalten.ts` an. Exportiere daraus `features` (ein `tableFeatures({})` ohne Zusatzfunktionen) und
         `columns`: drei Accessor-Spalten für `name`, `team` und `alter` mit den Überschriften `Name`, `Team` und
         `Alter` – gebaut mit `createColumnHelper<typeof features, Mitarbeiter>()` und `helper.columns([...])`.
      3. Importiere den Typ mit `import type { Mitarbeiter } from './daten.ts'`.

      Die Prüfung baut mit deinen Spalten eine echte Tabelle und liest die erste Zeile aus.
    workdir: erste-tabelle
    setup: |
      npm init -y >/dev/null
      npm pkg set type=module
      npm install --no-audit --no-fund react >/dev/null 2>&1
      mkdir -p src
      cat > src/daten.ts <<'EOF'
      export type Mitarbeiter = { id: number; name: string; team: string; alter: number }

      export const mitarbeiter: Mitarbeiter[] = [
        { id: 1, name: 'Mira', team: 'Web', alter: 31 },
        { id: 2, name: 'Ada', team: 'API', alter: 36 },
        { id: 3, name: 'Linus', team: 'Web', alter: 28 },
      ]
      EOF
    checks:
      - type: dir_exists
        path: node_modules/@tanstack/react-table
        message: "@tanstack/react-table ist noch nicht installiert. Führe npm install @tanstack/react-table aus."
      - type: file_contains
        path: src/spalten.ts
        pattern: "createColumnHelper<\\s*typeof\\s+features\\s*,\\s*Mitarbeiter\\s*>"
        message: Baue den Helfer mit createColumnHelper<typeof features, Mitarbeiter>().
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cat > "$d/p.mjs" <<'EOF'
          import { constructTable } from '@tanstack/table-core'
          import { storeReactivityBindings } from '@tanstack/table-core/store-reactivity-bindings'
          import { features, columns } from '../src/spalten.ts'
          import { mitarbeiter } from '../src/daten.ts'
          const table = constructTable({ features: { ...features, coreReactivityFeature: storeReactivityBindings() }, columns, data: mitarbeiter })
          const kopf = table.getHeaderGroups()[0].headers.map((h) => h.column.columnDef.header).join(',')
          const zeile = table.getRowModel().rows[0].getAllCells().map((c) => c.getValue()).join(',')
          console.log(kopf + '|' + zeile)
          EOF
          node "$d/p.mjs" 2>/dev/null; r=$?
          rm -rf "$d"
          exit $r
        stdout_equals: "Name,Team,Alter|Mira,Web,31"
        message: "Die Tabelle aus deinen Spalten stimmt noch nicht. Erwartet werden die Überschriften Name, Team, Alter (in dieser Reihenfolge) und die Werte der Felder name, team und alter."
    hints:
      - "Imports: `import { createColumnHelper, tableFeatures } from '@tanstack/react-table'`."
      - "`export const features = tableFeatures({})` und `const helper = createColumnHelper<typeof features, Mitarbeiter>()`."
      - "`export const columns = helper.columns([helper.accessor('name', { header: 'Name' }), …])`"
    solution: |
      ```bash
      cd erste-tabelle
      npm install @tanstack/react-table
      cat > src/spalten.ts <<'EOF'
      import { createColumnHelper, tableFeatures } from '@tanstack/react-table'
      import type { Mitarbeiter } from './daten.ts'

      export const features = tableFeatures({})

      const helper = createColumnHelper<typeof features, Mitarbeiter>()

      export const columns = helper.columns([
        helper.accessor('name', { header: 'Name' }),
        helper.accessor('team', { header: 'Team' }),
        helper.accessor('alter', { header: 'Alter' }),
      ])
      EOF
      ```
---
Jede zweite Business-App hat eine Tabelle: Kunden, Rechnungen, Tickets. Und jede soll sortieren, filtern und
blättern können – aber in **eurem** Design, mit **euren** Komponenten. Fertige Tabellen-Widgets passen nie ganz.
TanStack Table geht deshalb einen anderen Weg: Es liefert nur das Gehirn, das Gesicht baust du.

## Was „headless“ bedeutet

Eine [[headless-komponente|headless]] Bibliothek enthält Logik und Zustand, aber **kein** Markup und kein CSS.
[[tanstack-table|TanStack Table]] rechnet aus deinen Daten und Spalten aus, welche Kopfzeilen und welche Zeilen
in welcher Reihenfolge erscheinen. Ob daraus ein `<table>`, ein CSS-Grid oder eine Liste von Karten wird,
entscheidest du.

| TanStack Table erledigt | Deine Komponente erledigt |
|---|---|
| Sortieren, Filtern, Blättern berechnen | HTML-Struktur (`<table>`, `<tr>`, `<td>`) |
| Zustand (welche Spalte sortiert, welche Seite) | Styling, z. B. mit Tailwind oder shadcn/ui |
| Kopfzeilen und Zellen bereitstellen | Buttons, Pfeile, Eingabefelder |

Ein Bild: TanStack Table ist der Statiker, der ausrechnet, was wo steht. Die Fassade gestaltest du.

Aktuell ist **Version 9**. Wenn du ältere Beispiele mit `useReactTable` und `getCoreRowModel()` findest: Das ist
Version 8. Die Ideen sind gleich, die Namen haben sich geändert.

## Schritt 1: Features und Spalten

In Version 9 meldest du ausdrücklich an, welche Fähigkeiten eine Tabelle hat. Für eine einfache Anzeige reicht
ein leeres Feature-Objekt – Sortieren und Co. kommen in der nächsten Lektion dazu:

```tsx title="src/spalten.tsx"
import { createColumnHelper, tableFeatures } from '@tanstack/react-table'
import type { Mitarbeiter } from './daten.ts'

export const features = tableFeatures({})

const helper = createColumnHelper<typeof features, Mitarbeiter>()

export const columns = helper.columns([
  helper.accessor('name', { header: 'Name' }),
  helper.accessor('team', { header: 'Team' }),
  helper.accessor('alter', {
    header: 'Alter',
    cell: (info) => `${info.getValue()} Jahre`,
  }),
  helper.display({
    id: 'aktionen',
    header: '',
    cell: ({ row }) => <button onClick={() => bearbeiten(row.original.id)}>Bearbeiten</button>,
  }),
])
```

Eine [[spaltendefinition|Spaltendefinition]] beschreibt eine Spalte. Es gibt drei Arten:

| Art | Wofür |
|---|---|
| `helper.accessor('feld', …)` | Liest einen Wert aus jeder Zeile – sortier- und filterbar |
| `helper.accessor((zeile) => …, { id })` | Berechneter Wert, z. B. Vor- und Nachname zusammen |
| `helper.display({ id, … })` | Reine Anzeige ohne Wert, z. B. Aktions-Buttons |

`header` und `cell` dürfen Text oder Funktionen sein, die JSX liefern. Der Helfer kennt den Zeilentyp – vertippst
du dich bei `'alter'`, meldet TypeScript sofort einen Fehler.

## Schritt 2: useTable und rendern

Jetzt erzeugt `useTable` die Tabellen-Instanz. Du renderst Kopfzeilen und Zeilen selbst:

```tsx title="src/MitarbeiterTabelle.tsx"
import { useTable } from '@tanstack/react-table'
import { columns, features } from './spalten.tsx'
import type { Mitarbeiter } from './daten.ts'

export function MitarbeiterTabelle({ daten }: { daten: Mitarbeiter[] }) {
  const table = useTable({ features, columns, data: daten, getRowId: (m) => String(m.id) })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((gruppe) => (
          <tr key={gruppe.id}>
            {gruppe.headers.map((kopf) => (
              <th key={kopf.id}>{kopf.isPlaceholder ? null : <table.FlexRender header={kopf} />}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((zeile) => (
          <tr key={zeile.id}>
            {zeile.getAllCells().map((zelle) => (
              <td key={zelle.id}><table.FlexRender cell={zelle} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

`table.FlexRender` rendert, was in `header` oder `cell` steht – egal ob Text oder JSX. Mit `getRowId` gibst du
jeder Zeile eine stabile ID aus den Daten statt des Array-Index. Und weil die Spalten JSX enthalten, heißt die
Datei hier `spalten.tsx`.

> [!MERKSATZ]
> **Features** sagen, was die Tabelle kann. **Spalten** sagen, was in den Zellen steht. **useTable** rechnet
> daraus Kopfzeilen (`getHeaderGroups`) und Zeilen (`getRowModel`). Das Markup schreibst du.

## Stabile Eingaben

TanStack Table erkennt Änderungen an der **Referenz** von `data`, `columns` und `features`. Ein bei jedem Rendern
neu erzeugtes Array sieht wie neue Daten aus – die Tabelle rechnet alles neu, im schlimmsten Fall endlos.

> [!FEHLER]
> **`data: daten ?? []` oder Spalten in der Komponente anlegen.** Beides erzeugt bei jedem Rendern ein neues
> Array. Lege `features`, `columns` und eine Konstante `const leer: Mitarbeiter[] = []` auf Modulebene an.
> Spalten, die von Props abhängen, packst du in `useMemo`.

> [!PRAXIS]
> In Projekten mit shadcn/ui setzt man TanStack Table genau so ein: Die Bibliothek rechnet, und gerendert wird mit
> den `Table`-, `TableRow`- und `TableCell`-Komponenten des Design-Systems.

## Zusammenfassung

- **Headless** heißt: TanStack Table liefert Logik und Zustand, Markup und Styling kommen von dir.
- In Version 9 meldest du Fähigkeiten mit `tableFeatures({...})` an.
- Spalten baust du mit `createColumnHelper<typeof features, Typ>()`: `accessor` für Werte, `display` für Aktionen.
- `useTable({ features, columns, data })` liefert `getHeaderGroups()` und `getRowModel()`; `table.FlexRender` rendert Inhalte.
- `getRowId` gibt Zeilen stabile IDs aus deinen Daten.
- Halte `features`, `columns` und Ersatz-Arrays stabil – sonst rechnet die Tabelle ständig neu.
