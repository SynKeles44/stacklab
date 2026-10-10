---
title: TDD in der Praxis
summary: Testgetriebene Entwicklung im Red-Green-Refactor-Zyklus – mit kleinen Schritten, Triangulation und einem Bugfix-Rezept für den Alltag.
duration: 25
sources:
  - title: Martin Fowler – Test Driven Development
    url: https://martinfowler.com/bliki/TestDrivenDevelopment.html
  - title: Kent Beck – Canon TDD
    url: https://tidyfirst.substack.com/p/canon-tdd
  - title: Vitest – Getting Started
    url: https://vitest.dev/guide/
quiz:
  - type: single
    question: Was ist im TDD-Zyklus der erste Schritt?
    options:
      - Den kompletten Code schreiben, dann testen.
      - Einen kleinen Test schreiben, der fehlschlägt (Red).
      - Erst den Code aufräumen.
    answer: 1
    explanation: TDD beginnt mit einem roten Test. Er beweist, dass der Test überhaupt etwas prüft – und beschreibt den nächsten kleinen Schritt.
  - type: match
    question: Ordne jeder Phase zu, was du darin tust.
    pairs:
      - { left: Red, right: "Einen Test schreiben, der aus dem richtigen Grund fehlschlägt" }
      - { left: Green, right: "Den einfachsten Code schreiben, der den Test grün macht" }
      - { left: Refactor, right: "Struktur verbessern, während alle Tests grün bleiben" }
    explanation: Die drei Phasen wiederholst du in Minuten-Abständen. Neues Verhalten entsteht nur in Green, Aufräumen nur in Refactor.
  - type: multiple
    question: Wann passt TDD besonders gut?
    options:
      - Bei klar beschreibbarer Logik wie Preisregeln oder Validierungen.
      - Beim Beheben eines gemeldeten Fehlers.
      - Beim Ausprobieren, wie eine fremde API überhaupt antwortet.
      - Bei Code mit vielen Sonderfällen.
    answers: [0, 1, 3]
    explanation: TDD glänzt, wenn du das gewünschte Verhalten beschreiben kannst. Beim reinen Erkunden (Spike) testest du hinterher – oder wirfst den Code danach weg.
  - type: find-bug
    question: "Ein Team arbeitet „testgetrieben“. Welcher Schritt widerspricht TDD?"
    language: text
    code: |
      1. Test für 0,00 EUR schreiben und laufen lassen: rot
      2. Minimalen Code schreiben: grün
      3. Test für 12,34 EUR schreiben: rot
      4. Code verallgemeinern: grün
      5. Gleichzeitig Rundung, Währungen und Formatierung ergänzen
      6. Alle Tests laufen lassen
    bug_line: 5
    explanation: In Green schreibst du nur so viel Code, wie der aktuelle rote Test verlangt. Neues Verhalten ohne Test ist ungetesteter Code – genau das will TDD verhindern.
tasks:
  - id: bugfix-reihenfolge
    type: order
    title: Ein Bug, das TDD-Rezept
    description: Eine Kundin meldet, dass bei genau 50 Euro noch Versandkosten berechnet werden. Bringe die Schritte in die Reihenfolge, die zu einem sauberen Fix führt.
    items:
      - Den Fehler mit einem Test nachstellen (cost(5000) soll 0 ergeben)
      - Test laufen lassen und sehen, dass er rot ist
      - Die Bedingung im Code korrigieren
      - Alle Tests laufen lassen – alles grün
      - Aufräumen, falls nötig, und erneut testen
      - Fix samt Regressionstest committen
    hints:
      - Erst wenn ein Test den Fehler zeigt, weißt du sicher, dass dein Fix ihn behebt.
  - id: tdd-roemische-zahlen
    type: terminal
    title: Römische Zahlen testgetrieben entwickeln
    description: |
      Im Ordner `tdd` liegt ein TypeScript-Projekt mit Vitest. `src/roman.ts` enthält nur eine leere
      Funktion `toRoman(n: number): string`, und `src/roman.test.ts` einen ersten Test – er ist rot.

      Entwickle die Funktion im Red-Green-Refactor-Zyklus. Starte dafür `npx vitest` im Watch-Modus
      (oder `npm test` nach jeder Änderung):

      1. Mache den ersten Test (1 → `I`) mit dem einfachsten Code grün.
      2. Ergänze **einen** Test nach dem anderen und mache ihn jeweils grün, z. B. 3 → `III`, 4 → `IV`,
         9 → `IX`, 14 → `XIV`, 40 → `XL`, 1994 → `MCMXCIV`.
      3. Ergänze einen Test, dass Zahlen außerhalb von 1 bis 3999 (und Kommazahlen) einen Fehler werfen.
      4. Räume den Code auf, sobald Muster sichtbar werden – die Tests bleiben grün.

      Am Ende prüft Stacklab deine Funktion zusätzlich mit eigenen Zahlen. Klicke zuerst auf
      **Aufgabe vorbereiten** – npm installiert dabei Vitest.
    workdir: tdd
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "tdd-roman",
        "private": true,
        "type": "module",
        "scripts": {
          "test": "vitest run"
        }
      }
      EOF
      mkdir -p src
      cat > src/roman.ts <<'EOF'
      export function toRoman(n: number): string {
        throw new Error('not implemented')
      }
      EOF
      cat > src/roman.test.ts <<'EOF'
      import { describe, it, expect } from 'vitest'
      import { toRoman } from './roman'

      describe('toRoman', () => {
        it('wandelt 1 in I um', () => {
          expect(toRoman(1)).toBe('I')
        })
      })
      EOF
      timeout 150 npm install -D vitest --no-audit --no-fund --loglevel=error </dev/null
    checks:
      - type: command
        run: npx vitest run src/roman.test.ts
        message: Deine Tests sind noch nicht grün. Starte npm test und mach den roten Test mit möglichst wenig Code grün.
      - type: command
        run: "d=$(mktemp -d \"$PWD/.pruefung-XXXXXX\"); npx vitest run src/roman.test.ts --reporter=json --outputFile=\"$d/r.json\" >/dev/null 2>&1; jq -r '.numPassedTests' \"$d/r.json\"; rm -rf \"$d\""
        stdout_matches: "^\\s*([7-9]|[1-9][0-9]+)\\s*$"
        message: In src/roman.test.ts sollten mindestens sieben grüne Tests stehen – ergänze Fall für Fall.
      - type: file_contains
        path: src/roman.test.ts
        pattern: "toThrow"
        message: Es fehlt ein Test, dass ungültige Zahlen einen Fehler werfen (toThrow).
      - type: command
        run: |
          node --input-type=module -e "
          import { toRoman } from './src/roman.ts'
          const cases = [[1, 'I'], [3, 'III'], [4, 'IV'], [9, 'IX'], [14, 'XIV'], [40, 'XL'], [90, 'XC'], [400, 'CD'], [1994, 'MCMXCIV'], [2026, 'MMXXVI'], [3999, 'MMMCMXCIX']]
          for (const [n, r] of cases) { if (toRoman(n) !== r) { console.log('falsch: ' + n); process.exit(1) } }
          for (const n of [0, -5, 4000, 2.5]) { let threw = false; try { toRoman(n) } catch { threw = true } if (!threw) { console.log('kein Fehler: ' + n); process.exit(1) } }
          console.log('ok')"
        stdout_matches: "ok"
        message: Stacklab hat toRoman mit weiteren Zahlen geprüft (z. B. 90, 400, 2026, 3999 sowie 0, 4000 und 2.5) – noch stimmt nicht alles. Schreib für diese Fälle eigene Tests.
    hints:
      - "Der einfachste Code für den ersten Test ist wirklich `return 'I'`. Erst der nächste Test zwingt dich zu verallgemeinern."
      - "Ein bewährtes Muster: eine Tabelle von groß nach klein – `[[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], …, [4, 'IV'], [1, 'I']]` – und so lange abziehen, wie es passt."
      - "Für den Fehlerfall: `if (!Number.isInteger(n) || n < 1 || n > 3999) throw new Error('Out of range')` und im Test `expect(() => toRoman(0)).toThrow()`."
    solution: |
      ```bash
      cd tdd
      cat > src/roman.test.ts <<'EOF'
      import { describe, it, expect } from 'vitest'
      import { toRoman } from './roman'

      describe('toRoman', () => {
        it('wandelt 1 in I um', () => {
          expect(toRoman(1)).toBe('I')
        })

        it.each([
          [3, 'III'],
          [4, 'IV'],
          [9, 'IX'],
          [14, 'XIV'],
          [40, 'XL'],
          [1994, 'MCMXCIV'],
          [3999, 'MMMCMXCIX'],
        ])('wandelt %i in %s um', (n, expected) => {
          expect(toRoman(n)).toBe(expected)
        })

        it.each([0, 4000, 2.5])('lehnt %s ab', (n) => {
          expect(() => toRoman(n)).toThrow('Out of range')
        })
      })
      EOF
      cat > src/roman.ts <<'EOF'
      const NUMERALS: Array<[number, string]> = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
      ]

      export function toRoman(n: number): string {
        if (!Number.isInteger(n) || n < 1 || n > 3999) {
          throw new Error('Out of range')
        }
        let rest = n
        let result = ''
        for (const [value, symbol] of NUMERALS) {
          while (rest >= value) {
            result += symbol
            rest -= value
          }
        }
        return result
      }
      EOF
      npm test
      ```
---
Stell dir vor, du schreibst erst den Test und dann den Code – nicht, um mehr Tests zu haben, sondern um
beim Programmieren klarer zu denken. Das ist [[tdd|testgetriebene Entwicklung]] (TDD, *Test-Driven
Development*). Klingt verkehrt herum, fühlt sich nach ein paar Runden aber an wie Programmieren mit
Geländer.

## Der Zyklus: Red, Green, Refactor

TDD besteht aus einem kurzen Kreislauf, dem [[red-green-refactor|Red-Green-Refactor-Zyklus]]:

![Der TDD-Zyklus: Red – Green – Refactor](/assets/testing/red-green-refactor.svg)

| Phase | Du tust … | Du tust nicht … |
|---|---|---|
| **Red** | einen kleinen Test schreiben, der fehlschlägt | Produktivcode schreiben |
| **Green** | den einfachsten Code schreiben, der ihn grün macht | aufräumen, Extras einbauen |
| **Refactor** | Namen, Struktur, Duplikate verbessern | neues Verhalten ergänzen |

Ein Durchlauf dauert Sekunden bis wenige Minuten. Deshalb ist ein schneller Test-Runner im Watch-Modus
(etwa `npx vitest`) so wertvoll.

> [!MERKSATZ]
> Ein Test, den du nie rot gesehen hast, könnte auch gar nichts prüfen. Der rote Schritt beweist, dass dein
> Test funktioniert.

## Kleine Schritte und Triangulation

Am Beispiel römischer Zahlen. Erster Test:

```ts
it('wandelt 1 in I um', () => {
  expect(toRoman(1)).toBe('I')
})
```

Der einfachste Code, der ihn grün macht:

```ts
export function toRoman(n: number): string {
  return 'I'
}
```

Das wirkt albern – ist aber Absicht. Der Code ist genau so allgemein, wie die Tests es verlangen. Erst der
nächste Test (`3 → III`) zwingt dich zu einer Schleife, `4 → IV` zu einer Sonderregel, `9 → IX` zur
Erkenntnis, dass hier ein Muster steckt.

Dieses schrittweise Verallgemeinern durch neue Beispiele heißt **Triangulation**. Du lässt dich von
Beispielen zur allgemeinen Lösung führen, statt sie dir vorab im Kopf auszudenken.

> [!FEHLER]
> **Zu große Schritte.** Wer im ersten Test gleich `1994 → MCMXCIV` prüft, sitzt lange vor einem roten
> Test, ohne zu wissen, welcher Teil falsch ist. Wähle den nächsten Test so, dass er dich nur einen
> kleinen Schritt weiterbringt.

## Refactoring mit Sicherheitsnetz

Nach einigen grünen Tests sieht dein Code vielleicht so aus: viele `if`-Abfragen für 4, 9, 40, 90. Jetzt
ist Zeit zum Aufräumen – zum Beispiel mit einer Tabelle, die du von groß nach klein abarbeitest:

```ts
const NUMERALS: Array<[number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]
```

Weil alle Tests grün bleiben müssen, traust du dich an diesen Umbau. Genau das ist der eigentliche
Gewinn von TDD: [[refactoring|Refactoring]] ohne Angst.

## TDD beim Bugfix

Auch wer nicht jede Zeile testgetrieben schreibt, sollte dieses Rezept für Fehler nutzen:

1. Schreibe einen Test, der den gemeldeten Fehler nachstellt.
2. Sieh ihn **rot** werden – jetzt hast du den Fehler reproduziert.
3. Behebe den Fehler, bis der Test grün ist.
4. Lass alle Tests laufen und committe Fix und Test zusammen.

Der neue Test ist ab sofort ein [[regressionstest|Regressionstest]]: Kommt der Fehler je zurück, fällt er
sofort auf.

## Wann TDD passt – und wann nicht

| Gut geeignet | Weniger geeignet |
|---|---|
| Regeln, Berechnungen, Validierungen | Erkunden einer unbekannten API (Spike) |
| Bugfixes | reine Layout- und Designarbeit |
| Code mit vielen Sonderfällen | Wegwerf-Prototypen |

> [!PRAXIS]
> Im Team-Alltag wird selten jede Zeile streng testgetrieben geschrieben. Für Geschäftsregeln und Bugfixes
> ist „Test zuerst“ aber in vielen Teams Standard – und in Code-Reviews ist ein Regressionstest zu jedem
> Bugfix eine übliche Forderung.

## Zusammenfassung

- TDD heißt: erst ein roter Test, dann der einfachste grüne Code, dann aufräumen.
- Kleine Schritte und Triangulation führen über Beispiele zur allgemeinen Lösung.
- Den roten Test zu sehen beweist, dass der Test wirklich etwas prüft.
- Refactoring geschieht nur bei grünen Tests – sie sind dein Sicherheitsnetz.
- Für Bugfixes gilt immer: Fehler erst mit einem Test nachstellen, dann beheben.
- TDD passt zu klar beschreibbarem Verhalten, weniger zum Erkunden und Gestalten.
