---
title: Warum und was testen?
summary: Was ein automatisierter Test ist, wie er aufgebaut ist und welche Fälle du wirklich prüfen solltest.
duration: 20
sources:
  - title: Pest – Writing Tests
    url: https://pestphp.com/docs/writing-tests
  - title: Vitest – Getting Started
    url: https://vitest.dev/guide/
  - title: Martin Fowler – Self Testing Code
    url: https://martinfowler.com/bliki/SelfTestingCode.html
quiz:
  - type: single
    question: Was ist der größte Nutzen einer automatisierten Testsuite im Alltag?
    options:
      - Sie beweist, dass der Code fehlerfrei ist.
      - Sie meldet in Sekunden, wenn eine Änderung bestehendes Verhalten kaputt macht.
      - Sie ersetzt das Code-Review.
      - Sie macht den Code schneller.
    answer: 1
    explanation: Tests sind ein Sicherheitsnetz. Sie können nicht beweisen, dass es keine Fehler gibt – aber sie zeigen sofort, wenn etwas, das vorher funktioniert hat, nicht mehr funktioniert.
  - type: match
    question: Ordne jedem Teil des Arrange-Act-Assert-Musters seine Aufgabe zu.
    pairs:
      - { left: Arrange, right: Ausgangslage herstellen }
      - { left: Act, right: Die zu testende Aktion ausführen }
      - { left: Assert, right: Das Ergebnis mit der Erwartung vergleichen }
    explanation: Fast jeder gute Test hat diese drei Teile. Wenn ein Test mehrere Acts enthält, prüft er meist zu viel auf einmal.
  - type: multiple
    question: "Eine Funktion gibt ab 5000 Cent Bestellwert kostenlosen Versand. Welche Eingaben sind besonders wertvolle Grenzwerte?"
    options: ["4999", "5000", "1234", "0"]
    answers: [0, 1, 3]
    explanation: Fehler stecken oft an Grenzen (`>` statt `>=`). 4999 und 5000 liegen direkt an der Schwelle, 0 ist der kleinste gültige Wert. 1234 ist ein normaler Wert aus derselben Äquivalenzklasse wie 2000.
  - type: single
    question: Welcher Test ist am wenigsten wert?
    options:
      - Ein Test, der prüft, dass eine private Hilfsmethode genau dreimal aufgerufen wird.
      - Ein Test, der prüft, dass bei 120 Prozent Rabatt eine Exception fliegt.
      - Ein Test, der prüft, dass 10 Prozent Rabatt auf 1000 Cent 900 Cent ergeben.
    answer: 0
    explanation: Der erste Test prüft die Implementierung statt des Verhaltens. Er bricht bei jedem Umbau, obwohl sich für Nutzer nichts geändert hat.
  - type: cloze
    text: Ein Test, der mal grün und mal rot ist, obwohl sich nichts geändert hat, ist nicht ___. Gute Tests liefern bei gleichem Code immer dasselbe Ergebnis.
    blanks:
      - [deterministisch]
    explanation: Deterministische Tests hängen nicht von Uhrzeit, Zufall, Netzwerk oder Reihenfolge ab. Mehr dazu in der Lektion über wackelige Tests.
tasks:
  - id: mini-testrunner
    type: code
    language: js
    title: Baue deinen eigenen Mini-Test-Runner
    description: |
      Testframeworks wie Pest oder Vitest wirken wie Magie – im Kern machen sie aber etwas Einfaches.
      Baue das selbst nach:

      1. `expectEqual(actual, expected)` wirft einen `Error` mit der Meldung
         `Erwartet <expected>, erhalten <actual>`, wenn die Werte nicht strikt gleich (`===`) sind.
         Sonst passiert nichts.
      2. `runTests(tests)` bekommt ein Array aus Objekten `{ name, fn }`. Führe jede Funktion aus.
         Wirft sie nichts, kommt der Name in `passed`. Wirft sie einen Fehler, kommt
         `{ name, message }` in `failed`. Ein Fehler darf die übrigen Tests **nicht** stoppen.
      3. `runTests` gibt `{ passed, failed }` zurück.
    starter: |
      function expectEqual(actual, expected) {
        // wirf einen Error, wenn actual !== expected
      }

      function runTests(tests) {
        const passed = []
        const failed = []
        // führe jeden Test aus und sortiere ihn ein
        return { passed, failed }
      }
    tests:
      - name: expectEqual akzeptiert gleiche Werte
        code: |
          expectEqual(4, 4)
          expectEqual('a', 'a')
          assertTrue(true)
      - name: expectEqual wirft mit Meldung
        code: |
          let message = ''
          try { expectEqual(1, 2) } catch (e) { message = e.message }
          assertEqual(message, 'Erwartet 2, erhalten 1')
      - name: expectEqual vergleicht strikt
        code: assertThrows(() => expectEqual('1', 1))
      - name: runTests sortiert grüne und rote Tests
        code: |
          const result = runTests([
            { name: 'addiert', fn: () => expectEqual(1 + 1, 2) },
            { name: 'kaputt', fn: () => expectEqual(2 * 2, 5) },
            { name: 'auch grün', fn: () => {} },
          ])
          assertDeepEqual(result.passed, ['addiert', 'auch grün'])
          assertDeepEqual(result.failed, [{ name: 'kaputt', message: 'Erwartet 5, erhalten 4' }])
      - name: leere Liste ergibt leere Ergebnisse
        code: |
          assertDeepEqual(runTests([]), { passed: [], failed: [] })
    hints:
      - "Für `runTests` brauchst du eine Schleife mit `try { test.fn() } catch (error) { … }`."
      - "Die Meldung baust du mit einem Template-String: `` `Erwartet ${expected}, erhalten ${actual}` ``."
    solution: |
      function expectEqual(actual, expected) {
        if (actual !== expected) {
          throw new Error(`Erwartet ${expected}, erhalten ${actual}`)
        }
      }

      function runTests(tests) {
        const passed = []
        const failed = []
        for (const test of tests) {
          try {
            test.fn()
            passed.push(test.name)
          } catch (error) {
            failed.push({ name: test.name, message: error.message })
          }
        }
        return { passed, failed }
      }
  - id: testfaelle-sortieren
    type: dragdrop
    title: Normalfall, Grenzwert oder Fehlerfall?
    description: |
      Die Funktion `versandkosten(int $cent): int` liefert 0 ab einem Bestellwert von 5000 Cent,
      darunter 490 Cent. Negative Beträge lösen eine `InvalidArgumentException` aus.
      Ordne jeden geplanten Testfall der passenden Kategorie zu.
    targets:
      - { id: normal, label: Normalfall }
      - { id: grenze, label: Grenzwert }
      - { id: fehler, label: Fehlerfall }
    items:
      - { label: "2000 Cent → 490", target: normal }
      - { label: "9000 Cent → 0", target: normal }
      - { label: "4999 Cent → 490", target: grenze }
      - { label: "5000 Cent → 0", target: grenze }
      - { label: "0 Cent → 490", target: grenze }
      - { label: "-1 Cent → Exception", target: fehler }
    hints:
      - Grenzwerte liegen direkt an einer Schwelle oder am Rand des erlaubten Bereichs.
---
Du änderst eine Zeile in der Preisberechnung eines Online-Shops. Woher weißt du, dass danach Warenkorb,
Gutscheine und Versandkosten noch stimmen? Ohne Tests klickst du dich jedes Mal durch die ganze Anwendung –
oder du hoffst einfach. Automatisierte Tests nehmen dir genau diese Angst.

## Das Problem: Änderungen ohne Sicherheitsnetz

Software ändert sich ständig: neue Features, Fehlerbehebungen, Updates von Paketen. Jede Änderung kann
etwas kaputt machen, das vorher funktioniert hat. So ein Rückschritt heißt [[regression|Regression]].

Manuell testen klappt bei drei Funktionen. Bei dreihundert nicht mehr – niemand prüft vor jedem Release
jede Kombination von Hand.

Ein [[automatisierter-test|automatisierter Test]] ist Code, der deinen Code aufruft und das Ergebnis prüft.
Alle Tests zusammen bilden eine [[test-suite|Testsuite]]. Ein Befehl startet sie, und nach Sekunden weißt du:
alles grün – oder hier ist etwas rot.

| Ohne Tests | Mit Tests |
|---|---|
| Angst vor Änderungen | Mutiges [[refactoring\|Refactoring]] |
| Fehler fallen Kund:innen auf | Fehler fallen dir sofort auf |
| Wissen steckt in Köpfen | Tests dokumentieren das erwartete Verhalten |

> [!MERKSATZ]
> Tests beweisen nicht, dass dein Code fehlerfrei ist. Sie zeigen dir aber sofort, wenn sich bekanntes
> Verhalten ändert.

## Anatomie eines Tests: Arrange, Act, Assert

Fast jeder Test besteht aus drei Teilen – dem Muster [[arrange-act-assert|Arrange-Act-Assert]]:

1. **Arrange** – Ausgangslage herstellen (Objekte anlegen, Daten vorbereiten).
2. **Act** – genau die Aktion ausführen, die du prüfen willst.
3. **Assert** – das Ergebnis mit der Erwartung vergleichen.

So sieht das in Pest (PHP) aus:

```php title="tests/Unit/RabattTest.php"
it('zieht zehn Prozent ab', function () {
    $rechner = new PreisRechner();          // Arrange

    $preis = $rechner->rabatt(1000, 10);    // Act

    expect($preis)->toBe(900);              // Assert
});
```

Und so in Vitest (JavaScript):

```js title="src/rabatt.test.js"
import { it, expect } from 'vitest'
import { rabatt } from './rabatt.js'

it('zieht zehn Prozent ab', () => {
  expect(rabatt(1000, 10)).toBe(900)
})
```

Die Prüfung am Ende heißt [[assertion|Assertion]]. Schlägt sie fehl, wird der Test rot und zeigt dir
Erwartung und tatsächlichen Wert. Jeder einzelne Test ist ein [[testfall|Testfall]].

## Was solltest du testen?

Teste **Verhalten**, nicht Implementierung: Was kommt bei welcher Eingabe heraus? Wie die Funktion das
intern löst, ist ihre Privatsache. Dann darfst du den Code umbauen, ohne Tests anzufassen.

Statt wahllos Werte auszuprobieren, gehst du systematisch vor:

- **[[aequivalenzklasse|Äquivalenzklassen]]**: Eingaben, die sich gleich verhalten sollten, bilden eine
  Klasse. Aus jeder Klasse reicht ein Vertreter (z. B. 2000 Cent für „unter 50 Euro“).
- **[[grenzwertanalyse|Grenzwerte]]**: Fehler sitzen an Grenzen – `>` statt `>=` ist ein Klassiker.
  Teste direkt darunter, genau darauf und darüber.
- **Fehlerfälle**: Was passiert bei ungültigen Eingaben? Eine klare Exception ist auch Verhalten.

| Eingabe (Cent) | Klasse | Erwartung |
|---|---|---|
| 2000 | unter 5000 | 490 |
| 4999 / 5000 | Grenze | 490 / 0 |
| 9000 | ab 5000 | 0 |
| -1 | ungültig | Exception |

> [!FEHLER]
> **Nur den Glücksfall testen.** Ein Test mit 1000 Cent und 10 Prozent ist schnell geschrieben. Die
> Fehler stecken aber bei 0, bei 100 Prozent und bei 101 Prozent.

## Was einen guten Test ausmacht

Gute Tests haben ein paar gemeinsame Eigenschaften:

| Eigenschaft | Bedeutung |
|---|---|
| Schnell | Läuft in Millisekunden, damit du ihn ständig startest |
| Unabhängig | Braucht keinen anderen Test und keine bestimmte Reihenfolge |
| [[deterministisch\|Deterministisch]] | Gleicher Code, gleiches Ergebnis – keine Uhrzeit, kein Zufall |
| Eindeutig | Der Name sagt, was schiefgeht, wenn er rot wird |
| Fokussiert | Prüft ein Verhalten, nicht fünf auf einmal |

Ein guter Testname liest sich wie ein Satz: `it('lehnt Rabatte über 100 Prozent ab')`. Wird er rot,
weißt du ohne Debugger, was kaputt ist.

> [!PRAXIS]
> In Teams läuft die Testsuite bei jedem Pull Request automatisch in der [[ci-pipeline|CI-Pipeline]].
> Ein roter Test blockiert den Merge. Wird ein Fehler gemeldet, schreibst du zuerst einen
> [[regressionstest|Regressionstest]], der ihn zeigt – dann behebst du ihn.

## Zusammenfassung

- Automatisierte Tests sind Code, der deinen Code prüft – ein Sicherheitsnetz gegen Regressionen.
- Jeder Test folgt Arrange-Act-Assert und endet mit einer Assertion.
- Teste Verhalten (Ein- und Ausgaben), nicht interne Details.
- Wähle Testfälle systematisch: ein Vertreter je Äquivalenzklasse, alle Grenzwerte, die Fehlerfälle.
- Gute Tests sind schnell, unabhängig, deterministisch und klar benannt.
