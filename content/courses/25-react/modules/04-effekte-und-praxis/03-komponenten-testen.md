---
title: Komponenten testen mit Vitest und Testing Library
summary: Wie du Reducer und Komponenten mit Vitest prüfst, Komponenten mit der Testing Library renderst und bedienst – und warum gute Tests Verhalten statt Implementierung prüfen.
duration: 25
sources:
  - title: Vitest – Getting Started
    url: https://vitest.dev/guide/
  - title: Vitest – Test Environment
    url: https://vitest.dev/guide/environment
  - title: Testing Library – React Testing Library
    url: https://testing-library.com/docs/react-testing-library/intro/
  - title: Testing Library – About Queries
    url: https://testing-library.com/docs/queries/about/
  - title: Testing Library – Guiding Principles
    url: https://testing-library.com/docs/guiding-principles
quiz:
  - type: single
    question: Welche Abfrage bevorzugt die Testing Library, um einen Button zu finden?
    options:
      - "container.querySelector('.btn-primary')"
      - "screen.getByRole('button', { name: 'Speichern' })"
      - "document.getElementsByTagName('button')[0]"
      - "screen.getByTestId('speichern-button')"
    answer: 1
    explanation: >
      `getByRole` sucht so, wie Menschen und Screenreader die Seite wahrnehmen: nach Rolle und sichtbarem Namen.
      CSS-Klassen und Positionen sind Implementierungsdetails, `getByTestId` ist nur die letzte Notlösung.
  - type: match
    question: Ordne jeder Abfrage-Variante ihr Verhalten zu, wenn kein Element gefunden wird.
    pairs:
      - { left: "getBy…", right: "Wirft sofort einen Fehler" }
      - { left: "queryBy…", right: "Gibt null zurück – gut, um Abwesenheit zu prüfen" }
      - { left: "findBy…", right: "Gibt ein Promise zurück und wartet eine Weile auf das Element" }
    explanation: Für „ist da“ nimmst du getBy, für „ist nicht da“ queryBy und für Elemente, die erst später erscheinen, await findBy.
  - type: cloze
    text: "Damit Vitest einen simulierten DOM bereitstellt, schreibst du oben in die Testdatei `// @vitest-environment ___`. Einmal alle Tests ausführen, ohne auf Änderungen zu warten, startet `npx vitest ___`."
    blanks:
      - [jsdom]
      - [run]
    explanation: Ohne jsdom gibt es in Node.js kein document. `vitest run` läuft einmal durch, `vitest` allein bleibt im Beobachtungsmodus.
  - type: find-bug
    question: Der zweite Test schlägt fehl, weil er zwei Buttons findet. Welche Zeile fehlt sinngemäß bzw. ist falsch?
    language: tsx
    code: |
      import { test, expect } from 'vitest'
      import { render, screen, fireEvent } from '@testing-library/react'
      import { Like } from './Like'

      test('startet bei 0', () => {
        render(<Like />)
        expect(screen.getByRole('button').textContent).toBe('Gefällt mir: 0')
      })

      test('zählt hoch', () => {
        render(<Like />)
        fireEvent.click(screen.getByRole('button'))
      })
    bug_line: 1
    explanation: >
      Ohne globale Test-Funktionen räumt die Testing Library nicht automatisch auf – die Komponente aus dem ersten
      Test bleibt im DOM. Importiere `afterEach` und `cleanup` und rufe `afterEach(cleanup)` auf. Außerdem fehlt dem
      zweiten Test ein `expect`.
  - type: multiple
    question: Welche Aussagen über gute Komponententests stimmen?
    options:
      - Sie prüfen, was Nutzer sehen und tun können.
      - Sie prüfen den internen State-Namen der Komponente.
      - Ein Refactoring ohne Verhaltensänderung lässt sie grün.
      - Jeder Test enthält mindestens eine Erwartung mit expect.
    answers: [0, 2, 3]
    explanation: >
      Tests sollen Verhalten absichern. Wer interne Namen oder Strukturen prüft, muss Tests bei jedem Umbau
      anpassen, obwohl sich für Nutzer nichts geändert hat.
tasks:
  - id: erster-komponententest
    type: terminal
    title: Schreibe deinen ersten Komponententest
    description: |
      Im Ordner `komponententest` liegt ein Vite-React-Projekt mit TypeScript. In `src/Like.tsx` steckt eine
      Komponente `Like`: ein Button mit dem Text `Gefällt mir: 0`, der bei jedem Klick hochzählt.

      Klicke zuerst auf **Aufgabe vorbereiten** – das legt das Projekt an und installiert die Abhängigkeiten
      (dauert einige Sekunden).

      1. Installiere die Test-Werkzeuge als Entwicklungsabhängigkeiten:
         `npm install -D vitest @testing-library/react @testing-library/dom jsdom`
      2. Lege in `package.json` das Skript `test` mit dem Inhalt `vitest run` an, z. B. mit
         `npm pkg set scripts.test="vitest run"`.
      3. Schreibe `src/Like.test.tsx`: Schalte jsdom ein, rendere `<Like />`, klicke **zweimal** auf den Button
         und erwarte den Text `Gefällt mir: 2`. Räume mit `afterEach(cleanup)` auf.
      4. Führe `npm test` aus – der Test muss grün sein.

      Die Prüfung baut die Komponente zusätzlich kurz kaputt: Dein Test muss dann **rot** werden.
    workdir: komponententest
    setup: |
      npm create vite@latest . -- --template react-ts --no-interactive >/dev/null 2>&1
      npm install --no-audit --no-fund >/dev/null 2>&1
      cat > src/Like.tsx <<'EOF'
      import { useState } from 'react'

      export function Like() {
        const [anzahl, setAnzahl] = useState(0)
        return (
          <button onClick={() => setAnzahl(anzahl + 1)}>Gefällt mir: {anzahl}</button>
        )
      }
      EOF
    checks:
      - type: dir_exists
        path: node_modules/vitest
        message: Vitest ist noch nicht installiert. Führe npm install -D vitest @testing-library/react @testing-library/dom jsdom aus.
      - type: dir_exists
        path: node_modules/@testing-library/react
        message: Die Testing Library fehlt noch. Installiere @testing-library/react und @testing-library/dom.
      - type: dir_exists
        path: node_modules/jsdom
        message: jsdom fehlt noch – ohne jsdom gibt es im Test kein document.
      - type: file_contains
        path: package.json
        pattern: "\"test\":\\s*\"vitest"
        message: In package.json fehlt das Skript test mit vitest run. Nutze npm pkg set scripts.test="vitest run".
      - type: file_exists
        path: src/Like.test.tsx
        message: Die Testdatei src/Like.test.tsx gibt es noch nicht.
      - type: file_contains
        path: src/Like.test.tsx
        pattern: "render\\(\\s*<Like"
        message: Dein Test soll die Komponente mit render(<Like />) rendern.
      - type: command
        run: npm test >/dev/null 2>&1
        message: npm test schlägt noch fehl. Führe npm test aus und lies die Fehlermeldung – fehlt die jsdom-Zeile oder ein Import?
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cp src/Like.tsx "$d/Like.tsx"
          sed -i 's/anzahl + 1/anzahl/' src/Like.tsx
          if npx vitest run >/dev/null 2>&1; then r=1; else r=0; fi
          cp "$d/Like.tsx" src/Like.tsx
          rm -rf "$d"
          exit $r
        message: Dein Test bleibt grün, obwohl der Button nicht mehr zählt. Klicke zweimal und prüfe mit expect, dass danach Gefällt mir 2 dasteht.
    hints:
      - "Die erste Zeile der Testdatei ist `// @vitest-environment jsdom`. Danach importierst du `test`, `expect`, `afterEach` aus `vitest` und `render`, `screen`, `fireEvent`, `cleanup` aus `@testing-library/react`."
      - "Den Button findest du mit `const knopf = screen.getByRole('button', { name: 'Gefällt mir: 0' })`, klicken mit `fireEvent.click(knopf)`."
      - "Am Ende: `expect(knopf.textContent).toBe('Gefällt mir: 2')`. Schreibe die Datei z. B. mit `nano src/Like.test.tsx`."
    solution: |
      ```bash
      npm install -D vitest @testing-library/react @testing-library/dom jsdom
      npm pkg set scripts.test="vitest run"
      cat > src/Like.test.tsx <<'EOF'
      // @vitest-environment jsdom
      import { afterEach, expect, test } from 'vitest'
      import { cleanup, fireEvent, render, screen } from '@testing-library/react'
      import { Like } from './Like'

      afterEach(cleanup)

      test('zählt bei jedem Klick hoch', () => {
        render(<Like />)
        const knopf = screen.getByRole('button', { name: 'Gefällt mir: 0' })
        fireEvent.click(knopf)
        fireEvent.click(knopf)
        expect(knopf.textContent).toBe('Gefällt mir: 2')
      })
      EOF
      npm test
      ```
  - id: test-ablauf
    type: order
    title: So läuft ein Komponententest ab
    description: Bring die Schritte eines typischen Komponententests in die richtige Reihenfolge (Arrange – Act – Assert).
    items:
      - Vitest findet die Datei Like.test.tsx und stellt per jsdom ein document bereit.
      - render(<Like />) hängt die Komponente in den simulierten DOM.
      - screen.getByRole sucht den Button über Rolle und Beschriftung.
      - fireEvent.click löst einen Klick aus, React rendert neu.
      - expect(…).toBe(…) vergleicht den angezeigten Text mit dem erwarteten.
      - afterEach(cleanup) entfernt die Komponente wieder aus dem DOM.
    hints:
      - Erst vorbereiten (Arrange), dann handeln (Act), dann prüfen (Assert) – aufgeräumt wird zum Schluss.
---
Dein Gewohnheits-Tracker funktioniert. Dann baust du den Reducer um – und merkst erst drei Tage später, dass
das Löschen nicht mehr geht. Manuelles Durchklicken nach jeder Änderung kostet Zeit und wird irgendwann
vergessen. Automatische Tests klicken für dich, in Sekunden und bei jeder Änderung. In React-Projekten mit
Vite ist dafür [[vitest|Vitest]] zusammen mit der [[testing-library|Testing Library]] üblich.

## Was du testen kannst

Ein [[unit-test|Unit-Test]] prüft ein kleines Stück Code isoliert. In React gibt es zwei typische Ziele:

| Ziel | Beispiel | Werkzeug |
|---|---|---|
| Reine Logik | Reducer, Hilfsfunktionen | nur Vitest |
| Komponenten | Button zählt hoch, Formular zeigt Fehler | Vitest + Testing Library + jsdom |

Reducer sind am einfachsten zu testen: Sie sind [[reine-funktion|reine Funktionen]]. Du gibst einen State und
eine Action hinein und vergleichst das Ergebnis – ganz ohne React.

```ts title="src/aufgabenReducer.test.ts"
import { expect, test } from 'vitest'
import { aufgabenReducer } from './aufgabenReducer'

test('fügt eine Aufgabe hinzu', () => {
  const neu = aufgabenReducer([], { type: 'hinzugefuegt', id: 1, titel: 'Lesen' })
  expect(neu).toEqual([{ id: 1, titel: 'Lesen', erledigt: false }])
})
```

`test` legt einen Testfall an, `expect(wert)` startet eine [[assertion|Erwartung]]. `toBe` vergleicht mit
`Object.is`, `toEqual` vergleicht den Inhalt von Objekten und Arrays.

## Vitest einrichten

Vitest ist ein [[test-runner|Test-Runner]], der die Vite-Konfiguration mitnutzt. JSX und TypeScript versteht es
deshalb ohne Extra-Setup.

```bash title="Terminal"
npm install -D vitest @testing-library/react @testing-library/dom jsdom
npm pkg set scripts.test="vitest run"
npm test
```

| Befehl | Wirkung |
|---|---|
| `npx vitest` | Beobachtungsmodus: testet bei jeder Dateiänderung neu |
| `npx vitest run` | Einmal alle Tests ausführen, dann beenden (für CI) |
| `npx vitest run Like` | Nur Dateien, deren Pfad „Like“ enthält |

Vitest findet automatisch Dateien mit `.test.` oder `.spec.` im Namen. Üblich ist, die Testdatei direkt
neben die Komponente zu legen: `Like.tsx` und `Like.test.tsx`.

> [!MERKSATZ]
> Ein Test ohne `expect` prüft nichts. Er ist nur grün, weil nichts schiefgehen *konnte*.

## Komponenten rendern

Node.js kennt kein `document`. [[jsdom]] baut den DOM nach, sodass die Testing Library Komponenten hineinrendern
kann. Du schaltest jsdom per Kommentar für eine Datei ein oder global in `vite.config.ts` mit
`test: { environment: 'jsdom' }`.

```tsx title="src/Like.test.tsx"
// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Like } from './Like'

afterEach(cleanup)                       // nach jedem Test aufräumen

test('zählt bei jedem Klick hoch', () => {
  render(<Like />)                                                     // Arrange
  const knopf = screen.getByRole('button', { name: 'Gefällt mir: 0' })
  fireEvent.click(knopf)                                               // Act
  expect(knopf.textContent).toBe('Gefällt mir: 1')                     // Assert
})
```

Der Aufbau folgt dem Muster [[arrange-act-assert|Arrange – Act – Assert]]: vorbereiten, handeln, prüfen.

> [!FEHLER]
> `afterEach(cleanup)` vergessen. Ohne globale Test-Funktionen räumt die Testing Library nicht selbst auf –
> die Komponente des vorigen Tests bleibt im DOM, und `getByRole('button')` findet plötzlich zwei Buttons.

## Elemente finden wie ein Mensch

Die Testing Library will, dass du Elemente so suchst, wie Nutzer sie wahrnehmen. Die Abfragen haben drei
Varianten:

| Variante | Nichts gefunden | Wofür |
|---|---|---|
| `getBy…` | wirft einen Fehler | Element muss da sein |
| `queryBy…` | `null` | prüfen, dass etwas **nicht** da ist |
| `findBy…` | Promise, wartet | Element erscheint erst später (`await`) |

Kombiniert mit dem Suchkriterium in dieser Reihenfolge: `ByRole` (Rolle + Name), `ByLabelText` (Formularfelder),
`ByText`, und nur als letzter Ausweg `ByTestId`.

```tsx title="Formular testen"
render(<Newsletter />)
fireEvent.change(screen.getByLabelText('E-Mail'), { target: { value: 'ada.example.com' } })
fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }))
expect(await screen.findByText('Ungültige E-Mail')).toBeTruthy()
expect(screen.queryByText('Danke!')).toBeNull()
```

`fireEvent` löst einzelne DOM-Ereignisse aus. Realistischer – mit Fokus, Tastendrücken und Klickfolge – ist
das Zusatzpaket [`@testing-library/user-event`](https://testing-library.com/docs/user-event/intro).

## Verhalten statt Implementierung

Ein guter Test bleibt grün, wenn du die Komponente umbaust, ohne ihr Verhalten zu ändern. Er wird rot, wenn
Nutzer einen Unterschied merken würden.

| Schlecht (Implementierung) | Gut (Verhalten) |
|---|---|
| Sucht `.btn-like` per CSS-Klasse | `getByRole('button', { name: … })` |
| Prüft, dass `useState` aufgerufen wurde | Prüft den angezeigten Text nach dem Klick |
| Testet nur den Startzustand | Testet Normalfall, Randfall (leer) und Fehlerfall |

Ein praktischer Trick: Baue die Komponente absichtlich kaputt und schau, ob der Test rot wird. Bleibt er grün,
prüft er nicht das, was du denkst.

> [!PRAXIS]
> In Teams laufen die Tests mit `vitest run` in der CI-Pipeline bei jedem Pull Request. Ein roter Test blockiert
> den Merge – so landen Fehler wie das kaputte Löschen gar nicht erst im Hauptzweig. Reducer und eigene Hooks
> sind dabei die günstigsten Kandidaten für viele kleine Tests.

## Zusammenfassung

- Reducer und Hilfsfunktionen testest du mit Vitest allein: Eingabe rein, Ergebnis mit `expect` vergleichen.
- Für Komponenten brauchst du jsdom und die Testing Library: `render`, `screen`, `fireEvent`.
- Ohne globale Test-Funktionen räumst du mit `afterEach(cleanup)` auf.
- `getBy` muss finden, `queryBy` prüft Abwesenheit, `findBy` wartet auf spätere Elemente.
- Suche nach Rolle und Beschriftung, nicht nach CSS-Klassen – Tests prüfen Verhalten, nicht Implementierung.
- `npx vitest run` läuft einmal durch und eignet sich für Skripte und CI.
