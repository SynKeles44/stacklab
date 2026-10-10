---
title: Mocks, Fake-Timer, Coverage und Komponententests
summary: Mit vi.fn, vi.spyOn und vi.mock ersetzt du Abhängigkeiten, mit Fake-Timern kontrollierst du die Zeit, und du misst die Abdeckung – plus ein kurzer Blick auf Komponententests.
duration: 25
sources:
  - title: Vitest – Mocking
    url: https://vitest.dev/guide/mocking
  - title: Vitest – vi API
    url: https://vitest.dev/api/vi
  - title: Vitest – Coverage
    url: https://vitest.dev/guide/coverage
  - title: Vitest – Browser Mode
    url: https://vitest.dev/guide/browser/
  - title: Testing Library – Einführung
    url: https://testing-library.com/docs/
quiz:
  - type: single
    question: "Was liefert `const send = vi.fn().mockResolvedValue('ok')` beim Aufruf `send('a')`?"
    options:
      - "Den String 'ok'"
      - "Ein Promise, das zu 'ok' aufgelöst wird"
      - "undefined"
    answer: 1
    explanation: "`mockResolvedValue` ist eine Abkürzung für eine Funktion, die `Promise.resolve('ok')` zurückgibt – ideal für asynchrone Abhängigkeiten wie API-Clients."
  - type: match
    question: Welches Werkzeug passt zu welcher Aufgabe?
    pairs:
      - { left: "vi.fn()", right: "Eine neue Fake-Funktion, die Aufrufe aufzeichnet" }
      - { left: "vi.spyOn(console, 'error')", right: "Eine bestehende Methode beobachten oder ersetzen" }
      - { left: "vi.mock('./api')", right: "Ein ganzes Modul beim Import ersetzen" }
      - { left: "vi.useFakeTimers()", right: "setTimeout und Datum kontrollieren" }
    explanation: Alle vier sind Test-Doubles für unterschiedliche Situationen. Wo es geht, ist eine hereingereichte `vi.fn()` am einfachsten.
  - type: find-bug
    question: Der Test wartet nicht 500 ms, sondern bleibt rot – `save` wurde nie aufgerufen. In welcher Zeile fehlt etwas?
    language: ts
    code: |
      it('speichert verzögert', () => {
        vi.useFakeTimers()
        const save = vi.fn()
        const autosave = debounce(save, 500)
        autosave()
        expect(save).toHaveBeenCalledTimes(1)
      })
    bug_line: 6
    explanation: "Mit Fake-Timern läuft die Zeit nur, wenn du sie vorspulst. Vor der Prüfung fehlt `vi.advanceTimersByTime(500)`."
  - type: multiple
    question: Welche Aussagen über Code Coverage stimmen?
    options:
      - Sie zeigt, welche Zeilen und Verzweigungen beim Testlauf ausgeführt wurden.
      - 100 Prozent Coverage bedeutet, dass der Code fehlerfrei ist.
      - Vitest braucht dafür ein Zusatzpaket wie @vitest/coverage-v8.
      - Ungetestete Zeilen sind ein guter Hinweis auf fehlende Tests.
    answers: [0, 2, 3]
    explanation: Coverage misst Ausführung, nicht Prüfung. Eine Zeile kann ausgeführt werden, ohne dass ein Test ihr Ergebnis prüft – dazu mehr beim Mutation Testing.
tasks:
  - id: mini-vi-fn
    type: code
    language: js
    title: Baue dein eigenes vi.fn()
    description: |
      Was macht `vi.fn()` eigentlich? Baue eine Mini-Version:

      1. `createMockFn()` gibt eine Funktion `mock` zurück.
      2. Jeder Aufruf von `mock(...args)` speichert das Argument-Array in `mock.calls`
         (ein Array von Arrays, am Anfang leer).
      3. `mock.mockReturnValue(value)` legt fest, was künftige Aufrufe zurückgeben. Ohne Festlegung
         geben sie `undefined` zurück.
      4. `mock.mockReturnValue` gibt `mock` selbst zurück, damit man verketten kann.
    starter: |
      function createMockFn() {
        let returnValue = undefined

        function mock(...args) {
          // Aufruf speichern, Rückgabewert liefern
        }

        mock.calls = []
        mock.mockReturnValue = function (value) {
          // Rückgabewert merken
        }

        return mock
      }
    tests:
      - name: zeichnet Aufrufe auf
        code: |
          const fn = createMockFn()
          fn('a', 1)
          fn()
          assertDeepEqual(fn.calls, [['a', 1], []])
      - name: gibt ohne Festlegung undefined zurück
        code: |
          const fn = createMockFn()
          assertEqual(fn(5), undefined)
      - name: liefert den festgelegten Wert
        code: |
          const fn = createMockFn().mockReturnValue(42)
          assertEqual(fn(), 42)
          assertEqual(fn('x'), 42)
          assertEqual(fn.calls.length, 2)
      - name: jede Mock-Funktion hat eigene Aufrufe
        code: |
          const a = createMockFn()
          const b = createMockFn()
          a(1)
          assertEqual(a.calls.length, 1)
          assertEqual(b.calls.length, 0)
    hints:
      - "Im Aufruf: `mock.calls.push(args)` und dann `return returnValue`."
      - "In `mockReturnValue`: `returnValue = value` und `return mock`."
    solution: |
      function createMockFn() {
        let returnValue = undefined

        function mock(...args) {
          mock.calls.push(args)
          return returnValue
        }

        mock.calls = []
        mock.mockReturnValue = function (value) {
          returnValue = value
          return mock
        }

        return mock
      }
  - id: vitest-mocks
    type: terminal
    title: Newsletter und Autosave mit Mocks testen
    description: |
      Im Ordner `vitest-mocks` liegt ein TypeScript-Projekt mit Vitest und `@vitest/coverage-v8`.
      `src/newsletter.ts` enthält:

      - `sendNewsletter(mailer, recipients)` – ruft für jede Adresse mit `@` einmal
        `await mailer.send(adresse, 'Neues aus dem Shop')` auf, überspringt ungültige Adressen und gibt
        die Anzahl der gesendeten Mails zurück.
      - `debounce(fn, ms)` – ruft `fn` erst auf, wenn `ms` Millisekunden lang kein weiterer Aufruf kam.

      1. Lege `src/newsletter.test.ts` an.
      2. Teste `sendNewsletter` mit einem Mailer, dessen `send` eine `vi.fn().mockResolvedValue(undefined)`
         ist: Bei `['ada@example.com', 'kaputt', 'grace@example.com']` kommt `2` zurück,
         `send` wurde zweimal aufgerufen, darunter mit `('ada@example.com', 'Neues aus dem Shop')`.
      3. Teste `debounce` mit `vi.useFakeTimers()`: Drei schnelle Aufrufe, dann
         `vi.advanceTimersByTime(300)` – die Funktion lief genau **einmal**.
      4. Prüfe mit `npx vitest run --coverage`, dass `newsletter.ts` vollständig abgedeckt ist.

      Klicke zuerst auf **Aufgabe vorbereiten** – npm installiert dabei Vitest.
    workdir: vitest-mocks
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "vitest-mocks",
        "private": true,
        "type": "module",
        "scripts": {
          "test": "vitest run",
          "coverage": "vitest run --coverage"
        }
      }
      EOF
      mkdir -p src
      cat > src/newsletter.ts <<'EOF'
      export interface Mailer {
        send(to: string, text: string): Promise<void>
      }

      export async function sendNewsletter(mailer: Mailer, recipients: string[]): Promise<number> {
        let sent = 0
        for (const to of recipients) {
          if (!to.includes('@')) {
            continue
          }
          await mailer.send(to, 'Neues aus dem Shop')
          sent++
        }
        return sent
      }

      export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
        let timer: ReturnType<typeof setTimeout> | undefined
        return (...args: A): void => {
          clearTimeout(timer)
          timer = setTimeout(() => fn(...args), ms)
        }
      }
      EOF
      timeout 170 npm install -D vitest @vitest/coverage-v8 --no-audit --no-fund --loglevel=error </dev/null
    checks:
      - type: file_exists
        path: src/newsletter.test.ts
        message: Lege die Datei src/newsletter.test.ts an.
      - type: file_contains
        path: src/newsletter.test.ts
        pattern: "vi\\.fn\\("
        message: Ersetze mailer.send durch eine Mock-Funktion mit vi.fn().
      - type: file_contains
        path: src/newsletter.test.ts
        pattern: "toHaveBeenCalledWith\\("
        message: Prüfe mit toHaveBeenCalledWith, mit welchen Argumenten send aufgerufen wurde.
      - type: file_contains
        path: src/newsletter.test.ts
        pattern: "useFakeTimers\\("
        message: Teste debounce mit vi.useFakeTimers() und vi.advanceTimersByTime().
      - type: command
        run: npx vitest run src/newsletter.test.ts
        message: Die Tests sind noch nicht grün. Starte npm test und lies die Meldung.
      - type: command
        run: npx vitest run --coverage --coverage.include=src/newsletter.ts --coverage.thresholds.lines=100 --coverage.thresholds.branches=100
        message: newsletter.ts ist noch nicht vollständig abgedeckt. Führe npx vitest run --coverage aus und schau, welche Zeilen fehlen – denk an die ungültige Adresse.
    hints:
      - "Imports: `import { describe, it, expect, vi } from 'vitest'` und `import { sendNewsletter, debounce } from './newsletter'`."
      - "Mailer-Mock: `const mailer = { send: vi.fn().mockResolvedValue(undefined) }`, danach `expect(mailer.send).toHaveBeenCalledTimes(2)`."
      - "Debounce: `vi.useFakeTimers(); const fn = vi.fn(); const d = debounce(fn, 300); d(); d(); d(); vi.advanceTimersByTime(300); expect(fn).toHaveBeenCalledTimes(1)` – am Ende `vi.useRealTimers()`."
    solution: |
      ```bash
      cd vitest-mocks
      cat > src/newsletter.test.ts <<'EOF'
      import { afterEach, describe, it, expect, vi } from 'vitest'
      import { sendNewsletter, debounce } from './newsletter'

      afterEach(() => {
        vi.useRealTimers()
      })

      describe('sendNewsletter', () => {
        it('verschickt nur an gültige Adressen', async () => {
          const mailer = { send: vi.fn().mockResolvedValue(undefined) }

          const sent = await sendNewsletter(mailer, ['ada@example.com', 'kaputt', 'grace@example.com'])

          expect(sent).toBe(2)
          expect(mailer.send).toHaveBeenCalledTimes(2)
          expect(mailer.send).toHaveBeenCalledWith('ada@example.com', 'Neues aus dem Shop')
        })
      })

      describe('debounce', () => {
        it('ruft die Funktion nach der Pause nur einmal auf', () => {
          vi.useFakeTimers()
          const fn = vi.fn()
          const debounced = debounce(fn, 300)

          debounced()
          debounced()
          debounced()
          expect(fn).not.toHaveBeenCalled()

          vi.advanceTimersByTime(300)
          expect(fn).toHaveBeenCalledTimes(1)
        })
      })
      EOF
      npx vitest run --coverage
      ```
---
Deine Funktion verschickt einen Newsletter über einen Mail-Dienst und speichert Eingaben erst nach einer
kurzen Pause. Im Test willst du weder echte Mails versenden noch 300 Millisekunden pro Fall warten. Vitest
bringt dafür alles mit: Mock-Funktionen, Spione, Modul-Mocks und eine Uhr, die du selbst vorspulst.

## Mock-Funktionen mit vi.fn()

`vi.fn()` erzeugt eine [[mock-funktion|Mock-Funktion]]: Sie tut nichts, merkt sich aber jeden Aufruf.

```ts
import { it, expect, vi } from 'vitest'
import { sendNewsletter } from './newsletter'

it('verschickt nur an gültige Adressen', async () => {
  const mailer = { send: vi.fn().mockResolvedValue(undefined) }

  const sent = await sendNewsletter(mailer, ['ada@example.com', 'kaputt'])

  expect(sent).toBe(1)
  expect(mailer.send).toHaveBeenCalledTimes(1)
  expect(mailer.send).toHaveBeenCalledWith('ada@example.com', 'Neues aus dem Shop')
})
```

| Steuern | Prüfen |
|---|---|
| `mockReturnValue(5)` | `toHaveBeenCalled()` |
| `mockResolvedValue(data)` | `toHaveBeenCalledTimes(2)` |
| `mockRejectedValue(new Error())` | `toHaveBeenCalledWith('a', 1)` |
| `mockImplementation((x) => x * 2)` | `fn.mock.calls` (alle Argumente) |

> [!MERKSATZ]
> Am einfachsten testbar ist Code, dem du die Abhängigkeit als Parameter übergibst. Dann reicht eine
> `vi.fn()` – ganz ohne Modul-Tricks.

## Spione und Modul-Mocks

`vi.spyOn` beobachtet eine **bestehende** Methode und kann sie ersetzen:

```ts
const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
expect(rollDice()).toBe(4)
spy.mockRestore()   // Original zurück
```

Holt sich dein Code die Abhängigkeit per `import`, ersetzt `vi.mock` das ganze Modul:

```ts
import { vi, it, expect } from 'vitest'
import { fetchUser } from './api'
import { greeting } from './greeting'

vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ name: 'Ada' }),
}))

it('begrüßt mit Namen', async () => {
  expect(await greeting(1)).toBe('Hallo Ada')
})
```

`vi.mock` wird automatisch an den Anfang der Datei verschoben („hoisting“), damit es vor den Imports
wirkt. Seit Vitest 5 muss es deshalb auf oberster Ebene stehen – nicht in einem `it` oder `describe`.

> [!HINWEIS]
> Vitest 5 setzt die aufgezeichneten Aufrufe aller Mocks vor jedem Test automatisch zurück
> (`clearMocks` ist standardmäßig an). Ersetzte Originale stellst du mit `mockRestore()` oder
> `vi.restoreAllMocks()` wieder her.

## Die Zeit kontrollieren: Fake-Timer

Code mit `setTimeout`, `setInterval` oder `new Date()` ist schwer zu testen – echte Zeit macht Tests
langsam und nicht [[deterministisch|deterministisch]]. Mit [[fake-timer|Fake-Timern]] spulst du die Zeit
selbst vor:

```ts
it('speichert erst nach der Pause', () => {
  vi.useFakeTimers()
  const save = vi.fn()
  const autosave = debounce(save, 300)

  autosave(); autosave(); autosave()
  expect(save).not.toHaveBeenCalled()

  vi.advanceTimersByTime(300)
  expect(save).toHaveBeenCalledTimes(1)
  vi.useRealTimers()
})
```

Auch das Datum lässt sich festsetzen: `vi.setSystemTime(new Date('2026-12-24T10:00:00Z'))`.

## Coverage messen

Welche Zeilen hat dein Testlauf überhaupt ausgeführt? Das zeigt die [[testabdeckung|Testabdeckung]]
(Coverage). Vitest braucht dafür ein Zusatzpaket:

```bash
npm install -D @vitest/coverage-v8
npx vitest run --coverage
```

```text
File          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
newsletter.ts |   90.9  |   50     |   100   |   90    | 9
```

Die letzte Spalte nennt Zeilen, die nie liefen – hier die ungültige Adresse. Mindestwerte legst du in
`vitest.config.ts` unter `test.coverage.thresholds` fest; wird einer unterschritten, schlägt der Lauf fehl.

> [!FEHLER]
> **Coverage als Ziel.** Eine Zeile gilt als „abgedeckt“, sobald sie lief – auch wenn kein `expect` ihr
> Ergebnis prüft. 100 Prozent sind ein Hinweis, kein Beweis. Mehr dazu im Modul über Testqualität.

## Komponententests – kurz erklärt

Ein [[komponententest|Komponententest]] rendert eine UI-Komponente (z. B. React) und bedient sie wie ein
Mensch: Text suchen, klicken, tippen. Das ist ein [[interaktionstest|Interaktionstest]] auf
Integrationsebene.

| Weg | Wie |
|---|---|
| [[jsdom\|jsdom]] + [[testing-library\|Testing Library]] | schnelle DOM-Nachbildung in Node, `render()` und `screen.getByRole()` |
| Vitest Browser Mode | echter Browser über Playwright, gleiche Test-API |

Die Einrichtung zeigen die Dokumentationen von [Testing Library](https://testing-library.com/docs/) und
[Vitest Browser Mode](https://vitest.dev/guide/browser/). Das Prinzip kennst du schon: Arrange (rendern),
Act (klicken), Assert (sichtbares Ergebnis prüfen).

> [!PRAXIS]
> Viele Teams testen Hooks und Hilfsfunktionen mit reinen Vitest-Unit-Tests, wichtige Formulare und
> Dialoge mit Komponententests – und nur die kritischen Wege durch die ganze App mit Playwright.

## Zusammenfassung

- `vi.fn()` erzeugt Mock-Funktionen; `mockReturnValue`/`mockResolvedValue` steuern, `toHaveBeenCalledWith` prüft.
- `vi.spyOn` beobachtet bestehende Methoden, `vi.mock` ersetzt ganze Module (oberste Ebene der Datei).
- Fake-Timer (`vi.useFakeTimers`, `vi.advanceTimersByTime`, `vi.setSystemTime`) machen Zeit testbar.
- `@vitest/coverage-v8` und `vitest run --coverage` zeigen ausgeführte und fehlende Zeilen.
- Coverage misst Ausführung, nicht Prüfung – sie ist ein Hinweis, kein Qualitätsbeweis.
- Komponententests rendern UI und bedienen sie wie ein Mensch (jsdom oder Browser Mode).
