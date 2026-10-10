---
title: Tests und Refactoring mit KI
summary: KI-Tests, die wirklich etwas prüfen, und Refactorings, die das Verhalten nicht heimlich ändern.
duration: 25
sources:
  - title: Node.js – Test runner
    url: https://nodejs.org/api/test.html
  - title: Martin Fowler – Refactoring
    url: https://refactoring.com/
  - title: Stryker Mutator – What is mutation testing?
    url: https://stryker-mutator.io/docs/
quiz:
  - type: find-bug
    question: Ein Assistent hat diese Tests für `parseDuration()` geschrieben. Welche Zeile prüft in Wahrheit nichts?
    language: js
    code: |
      test('parses hours and minutes', () => {
        const result = parseDuration('1h30m');
        assert.equal(result, parseDuration('1h30m'));
      });
      test('throws on garbage', () => {
        assert.throws(() => parseDuration('5x'));
      });
    bug_line: 3
    explanation: >
      Der erwartete Wert wird mit der Funktion selbst berechnet – der Test ist immer grün, egal was sie
      zurückgibt. Erwartungen schreibst du als feste, unabhängig ermittelte Werte: `5400`.
  - type: multiple
    question: Woran erkennst du schwache KI-generierte Tests?
    options:
      - Die Erwartung wird mit dem getesteten Code selbst berechnet.
      - Es wird nur geprüft, ob überhaupt etwas zurückkommt (`assert.ok(result)`).
      - Es gibt Tests für leere Eingaben, Grenzen und Fehlerfälle.
      - Der Test bildet die Implementierung Zeile für Zeile nach und mockt alles weg.
    answers: [0, 1, 3]
    explanation: >
      Gute Tests prüfen beobachtbares Verhalten mit konkreten Werten, auch an den Rändern. Tests, die die
      Implementierung spiegeln oder nur „irgendwas“ prüfen, werden nie rot.
  - type: single
    question: Du lässt einen Assistenten eine verschachtelte Legacy-Funktion umbauen. Was tust du **vorher**?
    options:
      - Nichts, ein Refactoring ändert per Definition kein Verhalten.
      - Charakterisierungstests schreiben, die das heutige Verhalten inklusive Grenzen festhalten.
      - Die alte Funktion löschen, damit der Assistent frei arbeiten kann.
      - Den Assistenten bitten, besonders sorgfältig zu sein.
    answer: 1
    explanation: >
      Erst wenn das heutige Verhalten in Tests festgehalten ist, kannst du beweisen, dass der Umbau es nicht
      verändert. Ohne Tests ist „Refactoring“ nur eine Behauptung.
  - type: cloze
    text: Ein Test, der das aktuelle Verhalten von Bestandscode festhält, heißt ___. Ob deine Tests Fehler wirklich finden, misst ein ___, der den Code absichtlich verändert.
    blanks:
      - [Charakterisierungstest]
      - [Mutationstest, Mutation-Test, Mutationstests]
    explanation: Ein überlebender Mutant zeigt eine Lücke in den Tests – auch in KI-generierten.
tasks:
  - id: tests-mit-biss
    type: terminal
    title: Tests, die einen Fehler wirklich finden
    description: |
      Im Ordner `dauer` liegt `src/duration.js` mit `parseDuration(text)`: `'1h30m'` ergibt `5400` Sekunden,
      `'45s'` ergibt `45`, `'2h'` ergibt `7200`, `'1h1m1s'` ergibt `3661`. Leere oder ungültige Eingaben wie
      `''` oder `'5x'` werfen einen Fehler.

      Ein Assistent hat dazu `test/duration.test.js` geschrieben. Die Tests sind grün – aber sie würden
      fast keinen Fehler finden.

      1. Lies die Tests und finde heraus, warum sie wertlos sind.
      2. Schreibe sie neu: konkrete erwartete Werte, Minuten, Sekunden, eine Kombination aus allen dreien und
         mindestens zwei Fehlerfälle mit `assert.throws`.
      3. `npm test` muss grün sein. Ändere `src/duration.js` nicht.

      Stacklab prüft danach, ob deine Tests drei absichtlich eingebaute Fehler (Mutanten) erkennen.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: dauer
    setup: |
      mkdir -p src test
      printf '{\n  "name": "dauer",\n  "type": "module",\n  "scripts": { "test": "node --test" }\n}\n' > package.json
      cat > src/duration.js <<'JS'
      export function parseDuration(text) {
        const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(text);
        if (!text || !match) {
          throw new Error(`Invalid duration: ${text}`);
        }
        const [, hours = 0, minutes = 0, seconds = 0] = match;
        return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
      }
      JS
      cat > test/duration.test.js <<'JS'
      import { test } from 'node:test';
      import assert from 'node:assert/strict';
      import { parseDuration } from '../src/duration.js';

      test('parses hours and minutes', () => {
        const result = parseDuration('1h30m');
        assert.equal(result, parseDuration('1h30m'));
      });

      test('returns a number', () => {
        assert.ok(typeof parseDuration('2h') === 'number');
      });
      JS
    checks:
      - type: command
        run: node --test
        message: "`npm test` ist nicht grün. Prüfe deine erwarteten Werte."
      - type: command
        run: "grep -q 'Number(minutes) \\* 60 + Number(seconds)' src/duration.js && grep -q 'throw new Error' src/duration.js"
        message: src/duration.js wurde verändert. Ändere nur die Tests.
      - type: command
        run: "! grep -Eq 'parseDuration\\(([^)]*)\\)[^;]*parseDuration\\(\\1\\)' test/duration.test.js"
        message: Ein Test berechnet die Erwartung noch mit parseDuration() selbst. Schreibe feste Werte wie 5400.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          survivors=0
          for mutant in 's/\* 60/* 100/' 's/+ Number(seconds)//' 's/throw new Error(`Invalid duration: ${text}`);/return 0;/'; do
            rm -rf "$d/m" && mkdir -p "$d/m/src" "$d/m/test"
            cp package.json "$d/m/" && cp test/*.js "$d/m/test/"
            sed "$mutant" src/duration.js > "$d/m/src/duration.js"
            if (cd "$d/m" && node --test >/dev/null 2>&1); then survivors=$((survivors + 1)); fi
          done
          rm -rf "$d"
          echo "$survivors"
        stdout_equals: "0"
        message: "Mindestens ein Mutant überlebt: Deine Tests erkennen nicht, wenn Minuten falsch umgerechnet, Sekunden ignoriert oder Fehler verschluckt werden. Teste z. B. `'1h1m1s'` → 3661 und `assert.throws(() => parseDuration('5x'))`."
    hints:
      - "`assert.equal(result, parseDuration('1h30m'))` vergleicht die Funktion mit sich selbst – das ist immer grün."
      - "Rechne die erwarteten Werte von Hand: 1 h = 3600 s, 1 min = 60 s."
      - "Fehlerfälle: `assert.throws(() => parseDuration(''))` und `assert.throws(() => parseDuration('5x'))`."
    solution: |
      ```bash
      cd dauer
      cat > test/duration.test.js <<'EOF'
      import { test } from 'node:test';
      import assert from 'node:assert/strict';
      import { parseDuration } from '../src/duration.js';

      test('parses hours and minutes', () => {
        assert.equal(parseDuration('1h30m'), 5400);
      });

      test('parses seconds only', () => {
        assert.equal(parseDuration('45s'), 45);
      });

      test('parses all units combined', () => {
        assert.equal(parseDuration('1h1m1s'), 3661);
      });

      test('rejects empty input', () => {
        assert.throws(() => parseDuration(''));
      });

      test('rejects unknown units', () => {
        assert.throws(() => parseDuration('5x'));
      });
      EOF
      npm test
      ```
  - id: refactoring-ablauf
    type: order
    title: Ein sicheres Refactoring mit Assistent
    description: Bringe die Schritte für ein Refactoring mit KI-Unterstützung in die richtige Reihenfolge.
    items:
      - Den Assistenten den bestehenden Code und seine Aufrufer erklären lassen
      - Charakterisierungstests für das heutige Verhalten schreiben, inklusive Grenzen
      - Prüfen, dass alle Tests auf dem alten Code grün sind, und committen
      - Den Assistenten den Umbau in einem kleinen Schritt durchführen lassen
      - Tests ausführen, ohne sie zu ändern
      - Diff lesen und den Schritt committen
    hints:
      - Die Tests entstehen auf dem alten Code – sonst halten sie den neuen, womöglich falschen Stand fest.
---
„Schreib mir Tests für diese Funktion.“ Zwanzig Sekunden später: zehn Testfälle, alle grün, Coverage
hundert Prozent. Ein großartiges Gefühl – bis ein Fehler in Produktion auftaucht, den keiner der zehn
Tests bemerkt hat. KI kann Tests in Sekunden schreiben. Ob sie etwas taugen, entscheidest du.

## Tests mit KI schreiben lassen

Tests sind eine der besten Aufgaben für Assistenten: Das Muster ist klar, der Code steht im Kontext, und
das Ergebnis lässt sich sofort ausführen. Damit die Tests etwas taugen, gibst du die Richtung vor:

```text title="Ein guter Auftrag für Tests"
Schreibe Tests für parseDuration() in src/duration.js mit dem Node-Testrunner.
- Erwartete Werte als feste Zahlen, nicht mit der Funktion berechnet.
- Abdecken: nur Stunden, nur Sekunden, alle Einheiten kombiniert,
  leere Eingabe, unbekannte Einheit (muss werfen).
- Ändere src/duration.js nicht.
```

Am wertvollsten ist der Assistent beim **Ideensammeln**: „Welche [[randfall|Randfälle]] fallen dir für
diese Funktion ein?“ liefert oft Fälle, an die du nicht gedacht hast. Die Erwartungen prüfst du selbst.

## Woran du schwache Tests erkennst

| Muster | Warum es nichts prüft |
|---|---|
| `assert.equal(f(x), f(x))` | vergleicht die Funktion mit sich selbst |
| `assert.ok(result)` | prüft nur, dass irgendetwas zurückkommt |
| Erwartung aus der Implementierung abgeschrieben | übernimmt den Fehler gleich mit |
| alles gemockt | testet nur die Mocks |
| nur der Normalfall | Grenzen und Fehler bleiben ungeprüft |

> [!MERKSATZ]
> Ein Test ist nur dann etwas wert, wenn er **rot werden kann**. Frag dich bei jedem Test: Welcher Fehler
> im Code würde ihn scheitern lassen?

Genau das automatisiert ein [[mutationstest|Mutationstest]]: Er baut kleine Fehler in den Code ein und
schaut, ob die Tests es merken. Überlebt ein Mutant, fehlt ein Test. Mehr dazu im Kurs
[Testing](/kurse/testing).

> [!FEHLER]
> **Den Agenten Tests „reparieren“ lassen.** Schlägt ein Test fehl, passt ein Agent gern die Erwartung an,
> statt den Code zu korrigieren. Schreibe in die Aufgabe und in die Projekt-Anweisungsdatei: „Tests nicht
> ändern, löschen oder überspringen, um sie grün zu bekommen.“

## Refactoring mit KI

Beim [[refactoring|Refactoring]] änderst du die Struktur, nicht das Verhalten. Assistenten sind darin
schnell: verschachtelte `if`s auflösen, Funktionen extrahieren, Namen verbessern. Die Gefahr: Sie ändern
nebenbei **Verhalten**, etwa an einer Grenze.

```js title="Vorher"
if (weightKg <= 5) { cost = 490; } else if (weightKg <= 20) { cost = 990; }
```

```js title="Nachher – elegant, aber falsch"
const tier = TIERS.find((t) => weightKg < t.maxKg);   // < statt <=
```

Bei genau 5 kg kostet der Versand jetzt 9,90 € statt 4,90 €. Kein Linter und kein Typsystem bemerkt das.

## Erst festhalten, dann umbauen

Der sichere Ablauf ist immer gleich:

1. **Verstehen** – Lass dir den Code erklären und prüfe die Erklärung (nächste Lektion).
2. **Festhalten** – Schreibe [[charakterisierungstest|Charakterisierungstests]] für das heutige
   Verhalten, besonders an Grenzen. Sie laufen grün auf dem **alten** Code.
3. **Umbauen** – in kleinen Schritten, gern mit dem Assistenten.
4. **Beweisen** – dieselben Tests, unverändert, müssen grün bleiben.

> [!PRAXIS]
> Gib dem Assistenten beim Refactoring ausdrücklich mit: „Ändere kein Verhalten. Die Tests in
> `test/shipping.test.js` dürfen nicht verändert werden.“ Und prüfe im Diff, ob er sich daran gehalten hat.

## Zusammenfassung

- Tests sind eine starke KI-Aufgabe – wenn du Werte, Randfälle und Grenzen vorgibst.
- Schwache Tests vergleichen die Funktion mit sich selbst, prüfen nur „irgendwas“ oder mocken alles.
- Ein Test zählt nur, wenn er bei einem Fehler rot wird; Mutationstests messen das.
- Agenten dürfen Tests nicht anpassen, um grün zu werden.
- Vor einem KI-Refactoring hältst du das Verhalten mit Charakterisierungstests fest.
