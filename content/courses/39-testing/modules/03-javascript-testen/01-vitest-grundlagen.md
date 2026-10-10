---
title: Vitest – Unit-Tests für JavaScript und TypeScript
summary: Du installierst Vitest, schreibst Tests mit describe, it und expect, testest viele Fälle mit it.each und prüfst asynchronen Code.
duration: 25
sources:
  - title: Vitest – Getting Started
    url: https://vitest.dev/guide/
  - title: Vitest – expect API
    url: https://vitest.dev/api/expect
  - title: Vitest – Test API (test.each)
    url: https://vitest.dev/api/
  - title: Vitest – CLI
    url: https://vitest.dev/guide/cli
quiz:
  - type: single
    question: Was ist der Unterschied zwischen `vitest` und `vitest run`?
    options:
      - "`vitest` startet im Terminal den Watch-Modus und testet bei jeder Änderung neu, `vitest run` läuft genau einmal."
      - "`vitest run` ist schneller, weil es TypeScript ignoriert."
      - "Es gibt keinen Unterschied."
    answer: 0
    explanation: Im Watch-Modus bleibt Vitest offen und startet betroffene Tests neu, sobald du speicherst. In der CI-Pipeline (oder ohne interaktives Terminal) läuft Vitest automatisch nur einmal – `vitest run` erzwingt das.
  - type: match
    question: Welcher Matcher passt?
    pairs:
      - { left: "Zwei Objekte mit gleichem Inhalt", right: "toEqual" }
      - { left: "Exakt derselbe primitive Wert", right: "toBe" }
      - { left: "Ein Array hat drei Elemente", right: "toHaveLength(3)" }
      - { left: "0.1 + 0.2 ist ungefähr 0.3", right: "toBeCloseTo(0.3)" }
    explanation: "`toBe` vergleicht mit `Object.is` – zwei verschiedene Objekte sind nie `toBe`-gleich. Bei Kommazahlen hilft `toBeCloseTo`, weil 0.1 + 0.2 nicht exakt 0.3 ist."
  - type: find-bug
    question: Der Test ist immer grün – sogar wenn `loadUser` einen Fehler wirft. In welcher Zeile liegt das Problem?
    language: ts
    code: |
      import { it, expect } from 'vitest'
      import { loadUser } from './users'

      it('lädt den Namen', () => {
        expect(loadUser(1)).resolves.toEqual({ name: 'Ada' })
      })
    bug_line: 5
    explanation: "Ohne `await` (oder `return`) wartet Vitest nicht auf das Promise. Der Test endet, bevor geprüft wird. Richtig: `it('…', async () => { await expect(loadUser(1)).resolves.toEqual(...) })`."
  - type: cloze
    text: Vitest findet Testdateien, deren Name auf `.test.ts` oder `.___.ts` endet. Viele Fälle mit einem Test prüfst du mit `it.___`.
    blanks:
      - [spec]
      - [each]
    explanation: Standardmäßig sucht Vitest nach `*.test.*` und `*.spec.*`. `it.each` (oder `test.each`) ist das Gegenstück zu Datasets in Pest.
tasks:
  - id: matcher-zuordnen
    type: dragdrop
    title: Den richtigen Matcher finden
    description: Ordne jede Prüfung dem Matcher zu, mit dem du sie in Vitest schreiben würdest.
    targets:
      - { id: tobe, label: toBe }
      - { id: toequal, label: toEqual }
      - { id: tothrow, label: toThrow }
      - { id: tocontain, label: toContain }
    items:
      - { label: "sum(2, 3) ergibt 5", target: tobe }
      - { label: "isAdmin(user) ist true", target: tobe }
      - { label: "parseUser(json) ergibt { id: 1, name: 'Ada' }", target: toequal }
      - { label: "sortiert ergibt [1, 2, 3]", target: toequal }
      - { label: "divide(1, 0) wirft einen Fehler", target: tothrow }
      - { label: "die Tag-Liste enthält 'testing'", target: tocontain }
    hints:
      - Objekte und Arrays vergleichst du über ihren Inhalt, nicht über die Identität.
  - id: vitest-preise
    type: terminal
    title: Teste die Preisfunktionen mit Vitest
    description: |
      Im Ordner `vitest-start` liegt ein TypeScript-Projekt, in dem Vitest schon installiert ist.
      `src/price.ts` enthält zwei Funktionen:

      - `formatCents(cents: number): string` – `1234` wird zu `"12,34 EUR"`, `5` zu `"0,05 EUR"`.
      - `parseQuantity(input: string): number` – macht aus `" 3 "` die Zahl `3` und wirft einen `Error`,
        wenn die Eingabe keine ganze Zahl zwischen 1 und 99 ist.

      1. Lege `src/price.test.ts` an.
      2. Teste `formatCents` mit `it.each` und mindestens **drei** Fällen (denk an kleine Beträge!).
      3. Teste, dass `parseQuantity` Leerzeichen entfernt, und dass `parseQuantity('0')` einen Fehler wirft
         (`toThrow`).
      4. Starte die Tests mit `npm test` (das führt einmalig `vitest run` aus).

      Klicke zuerst auf **Aufgabe vorbereiten** – npm installiert dabei Vitest.
    workdir: vitest-start
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "vitest-start",
        "private": true,
        "type": "module",
        "scripts": {
          "test": "vitest run"
        }
      }
      EOF
      mkdir -p src
      cat > src/price.ts <<'EOF'
      export function formatCents(cents: number): string {
        const euros = Math.floor(cents / 100)
        const rest = String(cents % 100).padStart(2, '0')
        return `${euros},${rest} EUR`
      }

      export function parseQuantity(input: string): number {
        const value = Number(input.trim())
        if (!Number.isInteger(value) || value < 1 || value > 99) {
          throw new Error(`Invalid quantity: ${input}`)
        }
        return value
      }
      EOF
      timeout 150 npm install -D vitest --no-audit --no-fund --loglevel=error </dev/null
    checks:
      - type: file_exists
        path: src/price.test.ts
        message: Lege die Datei src/price.test.ts an.
      - type: file_contains
        path: src/price.test.ts
        pattern: "\\.each\\("
        message: Teste formatCents mit it.each (oder test.each).
      - type: file_contains
        path: src/price.test.ts
        pattern: "toThrow"
        message: Es fehlt der Test, dass parseQuantity bei ungültiger Eingabe einen Fehler wirft.
      - type: command
        run: npx vitest run src/price.test.ts
        message: Die Tests sind noch nicht grün. Starte npm test und lies die Meldung.
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx vitest run src/price.test.ts --reporter=json --outputFile=\"$d/r.json\" >/dev/null 2>&1; jq -r '.numPassedTests' \"$d/r.json\"; rm -rf \"$d\""
        stdout_matches: "^\\s*([5-9]|[1-9][0-9]+)\\s*$"
        message: Es sollten mindestens fünf grüne Tests sein – drei Fälle für formatCents plus zwei für parseQuantity.
    hints:
      - "Die Datei beginnt mit `import { describe, it, expect } from 'vitest'` und `import { formatCents, parseQuantity } from './price'`."
      - "`it.each([[1234, '12,34 EUR'], [5, '0,05 EUR'], [0, '0,00 EUR']])('formatCents(%i) = %s', (cents, expected) => { … })`"
      - "Fehler prüfst du mit einer Funktion: `expect(() => parseQuantity('0')).toThrow()`."
    solution: |
      ```bash
      cd vitest-start
      cat > src/price.test.ts <<'EOF'
      import { describe, it, expect } from 'vitest'
      import { formatCents, parseQuantity } from './price'

      describe('formatCents', () => {
        it.each([
          [1234, '12,34 EUR'],
          [5, '0,05 EUR'],
          [0, '0,00 EUR'],
          [100, '1,00 EUR'],
        ])('formatCents(%i) = %s', (cents, expected) => {
          expect(formatCents(cents)).toBe(expected)
        })
      })

      describe('parseQuantity', () => {
        it('entfernt Leerzeichen', () => {
          expect(parseQuantity(' 3 ')).toBe(3)
        })

        it('lehnt 0 ab', () => {
          expect(() => parseQuantity('0')).toThrow('Invalid quantity')
        })
      })
      EOF
      npm test
      ```
---
Im Frontend und in Node.js-Projekten ist [[vitest|Vitest]] heute der Standard-[[test-runner|Test-Runner]]. Er
nutzt die Konfiguration von [[vite|Vite]], versteht [[typescript|TypeScript]] ohne Extra-Schritt und ist so
schnell, dass du ihn ständig im Hintergrund laufen lassen kannst. Die Schreibweise kennst du schon fast –
sie ähnelt Pest sehr.

## Vitest installieren und starten

Vitest ist eine [[devdependency|Dev-Abhängigkeit]]:

```bash title="Terminal"
npm install -D vitest
```

In der `package.json` legst du Skripte an:

```json title="package.json"
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

| Befehl | Wirkung |
|---|---|
| `npx vitest` | [[watch-modus\|Watch-Modus]]: bleibt offen, testet bei jeder Änderung neu |
| `npx vitest run` | läuft genau einmal (für Skripte und CI) |
| `npx vitest run src/price.test.ts` | nur diese Datei |
| `npx vitest run -t "formatCents"` | nur Tests, deren Name passt |

In der [[ci-pipeline|CI-Pipeline]] erkennt Vitest automatisch, dass niemand zuschaut, und läuft nur einmal.

> [!HINWEIS]
> Aktuell ist **Vitest 5**. Eine eigene Konfigurationsdatei brauchst du für den Anfang nicht. Wenn doch,
> heißt sie `vitest.config.ts` und nutzt `defineConfig` aus `vitest/config`.

## describe, it und expect

Vitest findet Dateien, die auf `.test.ts` oder `.spec.ts` (bzw. `.js`) enden. Üblich ist, sie direkt neben
den getesteten Code zu legen:

```ts title="src/price.test.ts"
import { describe, it, expect } from 'vitest'
import { formatCents } from './price'

describe('formatCents', () => {
  it('formatiert Euro und Cent', () => {
    expect(formatCents(1234)).toBe('12,34 EUR')
  })

  it('füllt kleine Beträge mit Nullen auf', () => {
    expect(formatCents(5)).toBe('0,05 EUR')
  })
})
```

`describe` gruppiert, `it` (oder gleichbedeutend `test`) ist ein Testfall, `expect` startet die Prüfung.
Die Funktionen importierst du aus `vitest` – so weiß auch TypeScript, welche Typen sie haben.

> [!MERKSATZ]
> Pest und Vitest denken gleich: `it('…', fn)`, `expect(wert)` und ein Matcher. Wer eins kann, kann
> das andere in einer Stunde.

## Die wichtigsten Matcher

| Matcher | Prüft |
|---|---|
| `toBe(5)` | gleicher Wert bzw. dasselbe Objekt (`Object.is`) |
| `toEqual({ id: 1 })` | gleicher Inhalt (rekursiv) |
| `toStrictEqual(...)` | wie `toEqual`, achtet zusätzlich auf `undefined`-Felder und Klassen |
| `toMatchObject({ name: 'Ada' })` | Objekt enthält mindestens diese Felder |
| `toContain('x')` | Array oder String enthält den Wert |
| `toHaveLength(3)` | Länge |
| `toBeCloseTo(0.3)` | Kommazahl ungefähr gleich |
| `toThrow('Invalid')` | Funktion wirft (passende Meldung) |

`.not` dreht jeden Matcher um: `expect(list).not.toContain('admin')`.

> [!FEHLER]
> **`toBe` für Objekte.** `expect({ id: 1 }).toBe({ id: 1 })` ist rot – es sind zwei verschiedene
> Objekte. Für Inhalte nimmst du `toEqual`.

## Viele Fälle mit it.each

Das Gegenstück zu Pest-Datasets heißt `it.each` (oder `test.each`):

```ts
it.each([
  [1234, '12,34 EUR'],
  [5, '0,05 EUR'],
  [0, '0,00 EUR'],
])('formatCents(%i) = %s', (cents, expected) => {
  expect(formatCents(cents)).toBe(expected)
})
```

Die Platzhalter `%i` (Ganzzahl), `%s` (String) oder `%j` (JSON) im Namen werden mit den Werten des
Falls gefüllt. So steht in der Ausgabe `formatCents(5) = 0,05 EUR`.

Mit Objekten kannst du die Felder im Namen per `$feld` ansprechen:

```ts
it.each([
  { input: ' 3 ', expected: 3 },
  { input: '99', expected: 99 },
])('parseQuantity("$input") = $expected', ({ input, expected }) => {
  expect(parseQuantity(input)).toBe(expected)
})
```

## Fehler und asynchronen Code testen

Damit `toThrow` den Fehler fangen kann, übergibst du eine Funktion:

```ts
expect(() => parseQuantity('0')).toThrow('Invalid quantity')
```

Für [[promise|Promises]] machst du den Test `async` und wartest mit `await`:

```ts
it('lädt einen User', async () => {
  const user = await loadUser(1)
  expect(user.name).toBe('Ada')
})

it('meldet unbekannte IDs', async () => {
  await expect(loadUser(999)).rejects.toThrow('not found')
})
```

> [!PRAXIS]
> In Teams läuft `vitest` während der Arbeit im Watch-Modus in einem eigenen Terminal-Tab. Du speicherst,
> und nach einem Wimpernschlag siehst du grün oder rot – ohne die App im Browser zu öffnen.

## Zusammenfassung

- `npm install -D vitest`, dann `vitest` (Watch-Modus) oder `vitest run` (einmalig, für CI).
- Testdateien enden auf `.test.ts` oder `.spec.ts` und liegen meist neben dem Code.
- `describe`, `it` und `expect` importierst du aus `vitest`.
- `toBe` vergleicht Werte, `toEqual` Inhalte, `toThrow` erwartet einen Fehler (in einer Funktion).
- `it.each` prüft viele Fälle; Platzhalter wie `%s` oder `$feld` erzeugen lesbare Namen.
- Asynchrone Tests sind `async` und nutzen `await` bzw. `.resolves` und `.rejects`.
