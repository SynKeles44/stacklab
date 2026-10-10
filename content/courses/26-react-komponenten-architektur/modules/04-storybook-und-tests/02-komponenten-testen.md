---
title: Komponenten testen wie ein Mensch
summary: Wie du Komponenten mit Vitest und Testing Library aus Sicht der Nutzer testest, die richtigen Abfragen wählst und Stories mit play-Funktionen zu Interaktionstests machst.
duration: 25
sources:
  - title: Testing Library – Guiding Principles
    url: https://testing-library.com/docs/guiding-principles
  - title: Testing Library – Which query should I use?
    url: https://testing-library.com/docs/queries/about#priority
  - title: Vitest – Getting Started
    url: https://vitest.dev/guide/
  - title: Storybook – Interaction tests
    url: https://storybook.js.org/docs/writing-tests/interaction-testing
quiz:
  - type: single
    question: Welche Abfrage empfiehlt Testing Library **zuerst**, um einen Button zu finden?
    options:
      - "`container.querySelector('.btn-primary')`"
      - "`screen.getByTestId('save-button')`"
      - "`screen.getByRole('button', { name: 'Speichern' })`"
    answer: 2
    explanation: >
      Rollen und zugängliche Namen sind das, was auch Nutzer und Screenreader wahrnehmen. Klassen ändern sich beim
      nächsten Design-Umbau, Test-IDs sieht kein Mensch. Ein Test mit `getByRole` prüft nebenbei die Barrierefreiheit.
  - type: multiple
    question: Was sollte ein Test für eine Tabs-Komponente prüfen?
    options:
      - Nach einem Klick auf „Passwort“ ist das Passwort-Panel sichtbar.
      - Der aktive Tab hat `aria-selected="true"`.
      - Der interne State heißt `value` und hat den Wert `'passwort'`.
      - Die Komponente ruft `useState` genau einmal auf.
    answers: [0, 1]
    explanation: >
      Getestet wird sichtbares Verhalten, nicht die Umsetzung. Benennst du den State um, darf kein Test brechen –
      solange die Tabs für Nutzer gleich funktionieren.
  - type: cloze
    text: "Klicks simulierst du realistisch mit `await ___.click(element)`. Eine Spion-Funktion legst du in Vitest mit `vi.___()` an."
    blanks:
      - [userEvent]
      - [fn]
    explanation: userEvent löst die ganze Ereigniskette aus, die ein echter Klick auch auslöst (Zeiger, Fokus, Klick). `vi.fn()` zeichnet Aufrufe auf.
  - type: find-bug
    question: Der Test schlägt fehl, obwohl der Button nach dem Klick korrekt „Gespeichert“ anzeigt. Welche Zeile ist schuld?
    language: jsx
    code: |
      test('zeigt nach dem Klick Gespeichert', async () => {
        render(<SaveButton />)
        const user = userEvent.setup()
        user.click(screen.getByRole('button', { name: 'Speichern' }))
        expect(screen.getByRole('button', { name: 'Gespeichert' })).toBeTruthy()
      })
    bug_line: 4
    explanation: >
      `user.click` gibt ein Promise zurück. Ohne `await` läuft die Prüfung, bevor der Klick verarbeitet ist.
      Richtig ist `await user.click(…)`.
tasks:
  - id: tabs-testen
    type: terminal
    title: Tests für die Tabs schreiben
    description: |
      Im Ordner `tests` liegt ein kleines Projekt mit Vitest, React Testing Library und `user-event`. Die
      Compound Component `src/components/molecules/tabs.jsx` ist fertig und exportiert `Tabs`, `TabsList`,
      `TabsTrigger` und `TabsContent`. Die Pakete werden beim Vorbereiten installiert.

      Schreibe `src/components/molecules/tabs.test.jsx` mit **mindestens drei** Tests:

      1. Am Anfang ist nur das Panel des `defaultValue` zu sehen.
      2. Ein Klick auf einen anderen Tab zeigt dessen Panel und versteckt das alte.
      3. Der aktive Tab hat `aria-selected="true"`.

      Nutze `render` und `screen` aus `@testing-library/react`, `userEvent` aus `@testing-library/user-event`
      und finde Elemente mit `getByRole` bzw. `queryByRole`. Starte die Tests mit `npm test`.

      Klicke zuerst auf **Aufgabe vorbereiten** (die Installation dauert ein paar Sekunden).
    workdir: tests
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "tests",
        "private": true,
        "type": "module",
        "scripts": { "test": "vitest run" },
        "devDependencies": {
          "@testing-library/dom": "^10.4.2",
          "@testing-library/react": "^16.3.3",
          "@testing-library/user-event": "^14.6.7",
          "happy-dom": "^20.14.6",
          "react": "^19.3.0",
          "react-dom": "^19.3.0",
          "vitest": "^5.0.3"
        }
      }
      EOF
      cat > vitest.config.js <<'EOF'
      import { defineConfig } from 'vitest/config'

      export default defineConfig({
        test: { environment: 'happy-dom', globals: true },
      })
      EOF
      mkdir -p src/components/molecules
      cat > src/components/molecules/tabs.jsx <<'EOF'
      import { createContext, useContext, useState } from 'react'

      const TabsContext = createContext(null)

      function useTabs() {
        const ctx = useContext(TabsContext)
        if (!ctx) throw new Error('Tabs-Teile müssen innerhalb von <Tabs> stehen.')
        return ctx
      }

      export function Tabs({ defaultValue, children }) {
        const [value, setValue] = useState(defaultValue)
        return (
          <TabsContext value={{ value, setValue }}>
            <div data-slot="tabs">{children}</div>
          </TabsContext>
        )
      }

      export function TabsList({ children }) {
        return <div role="tablist">{children}</div>
      }

      export function TabsTrigger({ value, children }) {
        const { value: aktiv, setValue } = useTabs()
        return (
          <button role="tab" aria-selected={aktiv === value} onClick={() => setValue(value)}>
            {children}
          </button>
        )
      }

      export function TabsContent({ value, children }) {
        const { value: aktiv } = useTabs()
        if (aktiv !== value) return null
        return <div role="tabpanel">{children}</div>
      }
      EOF
      npm install --no-audit --no-fund --silent
    checks:
      - type: file_exists
        path: src/components/molecules/tabs.test.jsx
        message: Die Datei src/components/molecules/tabs.test.jsx fehlt noch.
      - type: file_contains
        path: src/components/molecules/tabs.test.jsx
        pattern: "getByRole|queryByRole|findByRole"
        message: Finde Elemente über ihre Rolle, z. B. screen.getByRole('tab', { name 'Passwort' }).
      - type: file_contains
        path: src/components/molecules/tabs.test.jsx
        pattern: "userEvent"
        message: Simuliere den Klick mit userEvent aus @testing-library/user-event.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          npx vitest run --reporter=json --outputFile="$d/ergebnis.json" >/dev/null 2>&1 || true
          jq -r '"\(.numPassedTests) \(.numFailedTests + .numFailedTestSuites)"' "$d/ergebnis.json"
          rm -rf "$d"
        stdout_matches: "^([3-9]|[1-9][0-9]+) 0\\s*$"
        message: Es sollen mindestens drei Tests existieren und alle grün sein. Starte npm test und lies die Fehlermeldung.
    hints:
      - "Ein Test beginnt mit `render(<Tabs defaultValue=\"konto\">…</Tabs>)` – schreibe das JSX mit zwei Triggern und zwei Panels direkt in den Test."
      - "Sichtbar oder nicht: `expect(screen.getByRole('tabpanel').textContent).toBe('Kontodaten')` bzw. `expect(screen.queryByText('Kontodaten')).toBeNull()`."
      - "Klicken: `await userEvent.click(screen.getByRole('tab', { name: 'Passwort' }))` – das `await` nicht vergessen."
    solution: |
      ```jsx
      // src/components/molecules/tabs.test.jsx
      import { render, screen } from '@testing-library/react'
      import userEvent from '@testing-library/user-event'
      import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

      function Beispiel() {
        return (
          <Tabs defaultValue="konto">
            <TabsList>
              <TabsTrigger value="konto">Konto</TabsTrigger>
              <TabsTrigger value="passwort">Passwort</TabsTrigger>
            </TabsList>
            <TabsContent value="konto">Kontodaten</TabsContent>
            <TabsContent value="passwort">Passwort ändern</TabsContent>
          </Tabs>
        )
      }

      test('zeigt am Anfang nur das Standard-Panel', () => {
        render(<Beispiel />)
        expect(screen.getByRole('tabpanel').textContent).toBe('Kontodaten')
        expect(screen.queryByText('Passwort ändern')).toBeNull()
      })

      test('wechselt das Panel per Klick', async () => {
        render(<Beispiel />)
        await userEvent.click(screen.getByRole('tab', { name: 'Passwort' }))
        expect(screen.getByRole('tabpanel').textContent).toBe('Passwort ändern')
        expect(screen.queryByText('Kontodaten')).toBeNull()
      })

      test('markiert den aktiven Tab', async () => {
        render(<Beispiel />)
        await userEvent.click(screen.getByRole('tab', { name: 'Passwort' }))
        expect(screen.getByRole('tab', { name: 'Passwort' }).getAttribute('aria-selected')).toBe('true')
        expect(screen.getByRole('tab', { name: 'Konto' }).getAttribute('aria-selected')).toBe('false')
      })
      ```

      Danach `npm test` ausführen.
  - id: gute-tests
    type: dragdrop
    title: Guter oder brüchiger Test?
    description: Ordne jede Prüfung zu. Ein brüchiger Test schlägt fehl, obwohl sich für Nutzer nichts geändert hat.
    targets:
      - { id: gut, label: "Testet Verhalten (gut)" }
      - { id: bruechig, label: "Testet Umsetzung (brüchig)" }
    items:
      - { label: "getByRole('tab', { name: 'Passwort' }) anklicken", target: gut }
      - { label: "Prüfen, dass das Panel „Passwort ändern“ sichtbar ist", target: gut }
      - { label: "Prüfen, dass onValueChange mit 'passwort' aufgerufen wurde", target: gut }
      - { label: "querySelector('.tabs__trigger--active') suchen", target: bruechig }
      - { label: "Prüfen, dass der interne State 'passwort' heißt", target: bruechig }
      - { label: "Snapshot des kompletten HTML vergleichen", target: bruechig }
    hints:
      - Stell dir vor, jemand benennt Klassen und Variablen um, ohne das Verhalten zu ändern. Welche Prüfungen würden dann fehlschlagen?
---
Du änderst die `cva`-Tabelle deines Buttons, und eine Woche später meldet jemand: „Die Tabs im
Admin-Portal reagieren nicht mehr.“ Eine Bibliothek, die viele Teams nutzen, braucht **automatische
Tests** – sonst traut sich niemand mehr, etwas zu ändern. Die Frage ist nur: Was genau testest du?

## Was testen? Verhalten, nicht Umsetzung

Der Leitsatz von [[testing-library|Testing Library]] lautet sinngemäß: Je mehr deine Tests der Art
ähneln, wie die Software benutzt wird, desto mehr Vertrauen geben sie dir.

| Testet Verhalten | Testet Umsetzung |
|---|---|
| „Nach Klick auf ‚Passwort‘ ist das Passwort-Panel sichtbar“ | „Der State `value` ist `'passwort'`“ |
| „Der aktive Tab hat `aria-selected=true`“ | „Die Klasse `tab--active` ist gesetzt“ |
| „`onValueChange` wurde aufgerufen“ | „`setValue` wurde genau einmal aufgerufen“ |

Tests der rechten Spalte brechen bei jedem Umbau, obwohl für Nutzer alles gleich bleibt. Solche
[[bruechiger-test|brüchigen Tests]] kosten mehr, als sie nützen.

> [!MERKSATZ]
> Teste, was ein Mensch sieht und tut: Rollen, Texte, Klicks, Tastatur. Nie die Namen von State,
> Klassen oder Hooks.

## Das Werkzeug: Vitest und Testing Library

Für React-Projekte mit Vite ist [[vitest|Vitest]] der übliche [[test-runner|Test-Runner]]. Er nutzt
dieselbe Konfiguration wie Vite und versteht JSX ohne Zusatzaufwand. Dazu kommen:

| Paket | Aufgabe |
|---|---|
| `vitest` | findet und startet Tests (`*.test.jsx`), bringt `expect` und `vi` mit |
| `happy-dom` oder `jsdom` | simuliert den Browser (DOM) in Node.js |
| `@testing-library/react` | `render` und `screen` zum Rendern und Abfragen |
| `@testing-library/user-event` | realistische Klicks und Tastatureingaben |

```js title="vitest.config.js"
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'happy-dom', globals: true },
})
```

`globals: true` stellt `test`, `expect` und `afterEach` global bereit. Testing Library räumt dann nach
jedem Test automatisch auf.

## Ein erster Test

```jsx title="button.test.jsx"
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

test('ruft onClick beim Klick auf', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Speichern</Button>)

  await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))

  expect(onClick).toHaveBeenCalledTimes(1)
})
```

Der Aufbau folgt dem Muster [[arrange-act-assert|Arrange – Act – Assert]]: rendern, handeln, prüfen.
Bei der Suche nach Elementen gilt eine klare Reihenfolge:

| Priorität | Abfrage | Wann |
|---|---|---|
| 1 | `getByRole` | fast immer – Rolle plus zugänglicher Name |
| 2 | `getByLabelText` | Formularfelder |
| 3 | `getByText` | Text ohne Rolle |
| 4 | `getByTestId` | nur als Notlösung |

`getBy…` wirft einen Fehler, wenn nichts gefunden wird. Willst du prüfen, dass etwas **nicht** da ist,
nimm `queryBy…` – es liefert dann `null`.

> [!FEHLER]
> **`await` vor `userEvent` vergessen.** Alle Methoden von user-event sind asynchron. Ohne `await` prüfst du,
> bevor der Klick verarbeitet wurde, und der Test schlägt scheinbar grundlos fehl.

## Stories als Interaktionstests

Du hast für jede Komponente schon Stories. Storybook kann sie mit einer `play`-Funktion zu
[[interaktionstest|Interaktionstests]] machen. Die Funktion läuft, nachdem die Story gerendert wurde:

```tsx title="tabs.stories.tsx"
import { expect } from 'storybook/test'

export const Wechsel: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Passwort' }))
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Passwort ändern')
  },
}
```

`canvas` bietet dieselben Abfragen wie `screen`. Im Panel **Interactions** siehst du jeden Schritt. Mit
dem Vitest-Addon von Storybook laufen alle Stories zusätzlich als Tests in der
[[ci-pipeline|CI-Pipeline]] – jede Story ist dann automatisch ein Rauchtest.

> [!PRAXIS]
> Eine bewährte Aufteilung: Jede Bibliothekskomponente hat Stories für alle Zustände, die wichtigsten
> Abläufe bekommen eine `play`-Funktion, und knifflige Logik wie `useControllableState` bekommt
> zusätzlich gezielte Vitest-Tests.

## Zusammenfassung

- Teste **Verhalten** aus Sicht der Nutzer, nie die Umsetzung – sonst werden Tests brüchig.
- **Vitest** startet die Tests, **happy-dom** simuliert den Browser, **Testing Library** rendert und fragt ab.
- `getByRole` ist die erste Wahl; `queryBy…` prüft, dass etwas fehlt.
- **user-event** simuliert echte Klicks und Tasten – immer mit `await`.
- Tests folgen dem Muster **Arrange – Act – Assert**.
- `play`-Funktionen machen Stories zu **Interaktionstests**, die auch in der CI laufen.
