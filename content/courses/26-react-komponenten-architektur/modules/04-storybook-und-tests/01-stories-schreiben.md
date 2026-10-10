---
title: Stories schreiben mit Storybook
summary: Wie du Komponenten in Storybook isoliert entwickelst und dokumentierst – mit Stories im CSF-Format, args, Controls und automatischer Dokumentation.
duration: 25
sources:
  - title: Storybook – Why Storybook?
    url: https://storybook.js.org/docs/get-started/why-storybook
  - title: Storybook – How to write stories
    url: https://storybook.js.org/docs/writing-stories
  - title: Storybook – Args
    url: https://storybook.js.org/docs/writing-stories/args
  - title: Storybook – Autodocs
    url: https://storybook.js.org/docs/writing-docs/autodocs
quiz:
  - type: single
    question: Was ist eine **Story**?
    options:
      - Ein Ticket im Projektmanagement-Tool
      - Ein benannter Zustand einer Komponente, z. B. „Button, Variante ghost, deaktiviert“
      - Eine komplette Seite der App
    answer: 1
    explanation: >
      Jede Story zeigt die Komponente mit bestimmten Props. Zusammen bilden die Stories einen Katalog aller
      Zustände, die eine Komponente annehmen kann.
  - type: match
    question: Ordne jedem Teil einer Story-Datei seine Aufgabe zu.
    pairs:
      - { left: "export default meta", right: "Beschreibt die Komponente und gemeinsame Einstellungen aller Stories" }
      - { left: "export const Ghost = { args: { … } }", right: "Eine einzelne Story mit eigenen Props" }
      - { left: "tags: ['autodocs']", right: "Erzeugt automatisch eine Dokumentationsseite" }
      - { left: "args: { onClick: fn() }", right: "Protokolliert Klicks im Actions-Panel" }
    explanation: Die Struktur heißt Component Story Format (CSF). Der Default-Export ist die Meta, jeder benannte Export eine Story.
  - type: multiple
    question: Für welche Zustände eines Buttons lohnt sich je eine eigene Story?
    options:
      - Jede Variante (primary, ghost, destructive)
      - Deaktiviert
      - Mit sehr langem Text
      - Mit jeder denkbaren Kombination aus Text und Farbe
    answers: [0, 1, 2]
    explanation: >
      Stories zeigen die wichtigen und die schwierigen Zustände – Varianten, Sonderzustände und Randfälle wie
      langer Text. Alle Kombinationen lassen sich bei Bedarf über die Controls einstellen.
  - type: cloze
    text: "Eine Story-Datei für `button.tsx` heißt `button.___.tsx`. Die Props einer Story stehen im Feld `___`."
    blanks:
      - [stories]
      - [args]
    explanation: Storybook findet Dateien nach dem Muster `*.stories.*`. Die `args` sind die Props, die Storybook an die Komponente übergibt.
tasks:
  - id: button-stories
    type: terminal
    title: Stories für den Button
    description: |
      Im Ordner `stories` liegt die Komponente `src/components/atoms/button.jsx` mit den Props `variant`
      (`primary`, `ghost`, `destructive`), `size` (`sm`, `md`) und allen Button-Attributen.

      Schreibe direkt daneben die Datei `src/components/atoms/button.stories.jsx` im CSF-Format:

      1. Importiere `fn` aus `'storybook/test'` und `Button` aus `'./button'`.
      2. Lege `const meta` an mit `title: 'Atoms/Button'`, `component: Button`, `tags: ['autodocs']` und
         den gemeinsamen `args` `children: 'Speichern'` und `onClick: fn()`. Exportiere sie mit `export default meta`.
      3. Exportiere mindestens diese Stories: `Primary` (ohne eigene args), `Ghost` (`variant: 'ghost'`),
         `Disabled` (`disabled: true`) und `LongText` mit einem sehr langen `children`-Text.

      Storybook selbst musst du hier nicht starten. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: stories
    setup: |
      mkdir -p src/components/atoms
      cat > src/components/atoms/button.jsx <<'EOF'
      const variants = {
        primary: 'bg-blue-600 text-white',
        ghost: 'bg-transparent hover:bg-gray-100',
        destructive: 'bg-red-600 text-white',
      }
      const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4' }

      export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
        return (
          <button
            data-slot="button"
            className={`inline-flex rounded-md ${variants[variant]} ${sizes[size]} ${className}`.trim()}
            {...props}
          />
        )
      }
      EOF
    checks:
      - type: file_exists
        path: src/components/atoms/button.stories.jsx
        message: Die Datei src/components/atoms/button.stories.jsx fehlt noch – sie liegt direkt neben button.jsx.
      - type: file_contains
        path: src/components/atoms/button.stories.jsx
        pattern: "import \\{\\s*fn\\s*\\} from ['\"]storybook/test['\"]"
        message: "Importiere fn aus 'storybook/test': import { fn } from 'storybook/test'."
      - type: file_contains
        path: src/components/atoms/button.stories.jsx
        pattern: "from ['\"]\\./button(\\.jsx)?['\"]"
        message: Importiere Button direkt aus './button'.
      - type: file_contains
        path: src/components/atoms/button.stories.jsx
        pattern: "component:\\s*Button"
        message: In der Meta fehlt component Button.
      - type: file_contains
        path: src/components/atoms/button.stories.jsx
        pattern: "tags:\\s*\\[\\s*['\"]autodocs['\"]\\s*\\]"
        message: Ergänze tags mit 'autodocs' in der Meta, damit Storybook eine Doku-Seite erzeugt.
      - type: file_contains
        path: src/components/atoms/button.stories.jsx
        pattern: "onClick:\\s*fn\\(\\)"
        message: In den gemeinsamen args fehlt onClick mit fn().
      - type: file_contains
        path: src/components/atoms/button.stories.jsx
        pattern: "export default meta"
        message: Exportiere die Meta mit export default meta.
      - type: command
        run: grep -cE "^export const (Primary|Ghost|Disabled|LongText)\b" src/components/atoms/button.stories.jsx
        stdout_matches: "^\\s*4\\s*$"
        message: Es fehlen Stories. Exportiere Primary, Ghost, Disabled und LongText jeweils mit export const.
      - type: file_contains
        path: src/components/atoms/button.stories.jsx
        pattern: "variant:\\s*['\"]ghost['\"]"
        message: Die Story Ghost braucht args mit variant 'ghost'.
      - type: file_contains
        path: src/components/atoms/button.stories.jsx
        pattern: "disabled:\\s*true"
        message: Die Story Disabled braucht args mit disabled true.
    hints:
      - "Gerüst: `const meta = { title: 'Atoms/Button', component: Button, tags: ['autodocs'], args: { … } }` und darunter `export default meta`."
      - "Eine Story ist ein Objekt: `export const Ghost = { args: { variant: 'ghost' } }`. `Primary` darf einfach `{}` sein."
      - Schreib die Datei mit `nano src/components/atoms/button.stories.jsx` oder mit `cat > … <<'EOF'`.
    solution: |
      ```jsx
      // src/components/atoms/button.stories.jsx
      import { fn } from 'storybook/test'
      import { Button } from './button'

      const meta = {
        title: 'Atoms/Button',
        component: Button,
        tags: ['autodocs'],
        args: { children: 'Speichern', onClick: fn() },
      }
      export default meta

      export const Primary = {}

      export const Ghost = {
        args: { variant: 'ghost' },
      }

      export const Disabled = {
        args: { disabled: true },
      }

      export const LongText = {
        args: { children: 'Bestellung jetzt verbindlich und kostenpflichtig abschicken' },
      }
      ```
  - id: story-datei-aufbauen
    type: order
    title: Eine Story-Datei aufbauen
    description: Bringe die Teile einer typischen TypeScript-Story-Datei in die Reihenfolge, in der sie in der Datei stehen.
    items:
      - "import type { Meta, StoryObj } from '@storybook/react-vite'"
      - "import { Button } from './button'"
      - "const meta = { component: Button, args: { children: 'Speichern' } } satisfies Meta<typeof Button>"
      - export default meta
      - "type Story = StoryObj<typeof meta>"
      - "export const Primary: Story = {}"
---
Eine neue Kollegin fragt: „Welche Button-Varianten gibt es eigentlich? Und wie sieht der deaktivierte
Zustand aus?“ Du könntest den Code öffnen und die `cva`-Tabelle vorlesen. Oder du schickst ihr einen
Link, unter dem sie jede Variante live anklicken kann. Genau das ist Storybook.

## Was Storybook ist

[[storybook|Storybook]] ist eine Werkstatt für Komponenten. Es läuft als eigene kleine Web-App neben
deinem Projekt und zeigt jede Komponente **isoliert** – ohne Login, ohne Datenbank, ohne die Seite, in
der sie später steckt.

| Nutzen | Was das konkret heißt |
|---|---|
| Entwickeln | Du baust eine Komponente, ohne durch die App klicken zu müssen |
| Katalog | Alle sehen, welche Bausteine es schon gibt – kein dritter Button mehr |
| Dokumentation | Props, Varianten und Beispiele auf einer Seite |
| Testen | Jede Story ist ein Testfall (nächste Lektion) |

Eingerichtet wird es mit `npm create storybook@latest`. Der Assistent erkennt React und Vite und legt
den Ordner `.storybook/` sowie die Skripte `storybook` und `build-storybook` an. Gestartet wird mit
`npm run storybook`.

> [!MERKSATZ]
> Storybook ist die **lebende Dokumentation** einer Komponentenbibliothek. Was dort nicht steht,
> existiert für das Team praktisch nicht.

## Eine Story-Datei im CSF-Format

Eine [[story|Story]] ist ein benannter Zustand einer Komponente. Stories stehen in einer Datei direkt
neben der Komponente: `button.stories.tsx`. Das Format heißt [[csf|Component Story Format]] (CSF):

```tsx title="button.stories.tsx"
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Button } from './button'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  args: { children: 'Speichern', onClick: fn() },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Disabled: Story = { args: { disabled: true } }
```

- Der **Default-Export** (`meta`) beschreibt die Komponente. `title` bestimmt den Platz in der Navigation –
  hier passend zum Atomic Design.
- Jeder **benannte Export** ist eine Story.
- `satisfies Meta<typeof Button>` lässt [[typescript|TypeScript]] prüfen, dass die args zur Komponente passen.

## args, Controls und Actions

Die [[story-args|args]] sind die Props, die Storybook an die Komponente übergibt. Args aus der Meta gelten
für alle Stories, die Story ergänzt oder überschreibt sie.

Aus den args baut Storybook automatisch **Controls**: Eingabefelder, mit denen du Props live änderst.
Für eine Prop vom Typ `'primary' | 'ghost'` erscheint ein Auswahlfeld. Willst du es selbst festlegen, nutzt
du `argTypes`:

```tsx
argTypes: {
  variant: { control: 'select', options: ['primary', 'ghost', 'destructive'] },
},
```

`fn()` aus `storybook/test` erzeugt eine Spion-Funktion. Klickst du den Button, erscheint der Aufruf im
Panel **Actions** – und in Tests kannst du prüfen, ob er stattfand.

> [!FEHLER]
> **Stories mit echten Daten oder API-Aufrufen füllen.** Eine Story soll immer gleich aussehen. Übergib
> Beispieldaten als args – fachliche Komponenten, die selbst Daten laden, gehören meist gar nicht in
> die Bibliothek.

## Automatische Dokumentation

Mit `tags: ['autodocs']` in der Meta erzeugt Storybook eine **Docs-Seite**: alle Stories untereinander und
eine Tabelle aller Props mit Typen und Standardwerten. Kommentare über den Props werden übernommen:

```tsx
type ButtonProps = React.ComponentProps<'button'> & {
  /** Visuelle Variante. `destructive` nur für Löschen und Abbrechen. */
  variant?: 'primary' | 'ghost' | 'destructive'
}
```

Für längere Anleitungen gibt es MDX-Seiten, die Text und Stories mischen – Details in der
[Storybook-Dokumentation](https://storybook.js.org/docs/writing-docs/mdx).

Welche Stories gehören dazu? Eine Faustregel:

| Story | Warum |
|---|---|
| eine pro Variante und Größe | zeigt das Spektrum |
| Sonderzustände: `Disabled`, `Loading`, `Error` | werden sonst vergessen |
| Randfälle: langer Text, leerer Inhalt | decken Layout-Fehler auf |

> [!PRAXIS]
> In vielen Teams ist eine Story **Pflicht**, bevor eine Komponente in die Bibliothek darf. Im
> Code-Review schaut man dann nicht nur auf den Code, sondern klickt die Stories durch – oft in einer
> automatisch gebauten Storybook-Vorschau des Pull Requests.

## Zusammenfassung

- **Storybook** zeigt Komponenten isoliert: zum Entwickeln, als Katalog, als Doku und für Tests.
- Eine **Story** ist ein benannter Zustand einer Komponente, gespeichert in `*.stories.tsx` neben ihr.
- Im **CSF-Format** ist der Default-Export die Meta, jeder benannte Export eine Story.
- **args** sind die Props einer Story; daraus entstehen Controls zum Ausprobieren.
- `fn()` aus `storybook/test` protokolliert Aufrufe von Handlern.
- `tags: ['autodocs']` erzeugt eine Docs-Seite mit allen Stories und Props.
