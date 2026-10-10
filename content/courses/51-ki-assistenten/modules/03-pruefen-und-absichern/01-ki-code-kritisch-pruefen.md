---
title: KI-Code kritisch prüfen
summary: Jede Zeile lesen, Tests ausführen, gegen die Doku prüfen – und die typischen Fehlermuster von KI-Code kennen.
duration: 25
sources:
  - title: git-apply – Patches prüfen und anwenden
    url: https://git-scm.com/docs/git-apply
  - title: MDN – Array.prototype.sort()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
  - title: Node.js – Test runner
    url: https://nodejs.org/api/test.html
quiz:
  - type: find-bug
    question: Ein Assistent hat diese Funktion für den Median geschrieben. Die mitgelieferten Tests mit `[3, 1, 2]` sind grün. In welcher Zeile steckt der Fehler?
    language: js
    code: |
      export function median(values) {
        const sorted = values.sort();
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2;
      }
    bug_line: 2
    explanation: >
      `sort()` ohne Vergleichsfunktion sortiert als Text: `[10, 9, 2]` wird zu `[10, 2, 9]`. Außerdem verändert
      `sort()` das übergebene Array. Richtig: `[...values].sort((a, b) => a - b)`.
  - type: find-bug
    question: Diese PHP-Methode soll prüfen, ob ein Gutschein noch gültig ist. Gültig ist er bis einschließlich zum Ablaufdatum. Wo ist der Fehler?
    language: php
    code: |
      public function isValid(DateTimeImmutable $today): bool
      {
          if ($this->usedAt !== null) {
              return false;
          }
          return $today < $this->expiresOn;
      }
    bug_line: 6
    explanation: >
      „Bis einschließlich“ heißt `<=`. Solche Grenzfehler sehen im schnellen Lesen korrekt aus – deshalb
      gehören Grenzwerte in die Tests.
  - type: multiple
    question: Welche Prüfungen gehören zu jedem KI-Vorschlag, bevor du ihn übernimmst?
    options:
      - Jede Zeile des Diffs lesen und erklären können
      - Tests, Linter und Typprüfung ausführen
      - Unbekannte Funktionen, Optionen und Pakete in der offiziellen Doku nachschlagen
      - Den Assistenten fragen, ob sein Code korrekt ist, und der Antwort vertrauen
    answers: [0, 1, 2]
    explanation: >
      Ein Modell, das sich selbst bewertet, prüft mit denselben blinden Flecken. Fragen ist erlaubt – die
      Antwort ersetzt aber weder Tests noch Doku.
  - type: single
    question: Ein Agent meldet „Alle Tests grün“. Im Diff siehst du, dass er in einem Test `assert.equal(total, 1190)` zu `assert.equal(total, 190)` geändert hat. Was bedeutet das?
    options:
      - Alles in Ordnung, die Tests sind ja grün.
      - Der Agent hat die Erwartung an den falschen Code angepasst – der Fehler ist versteckt statt behoben.
      - Der Test war vorher sicher falsch.
      - Die Testsuite ist kaputt.
    answer: 1
    explanation: >
      Tests an das Ergebnis anzupassen ist ein typisches Muster, um „grün“ zu erreichen. Geänderte Erwartungen
      in Tests verdienen im Review besondere Aufmerksamkeit.
tasks:
  - id: paginierung-reparieren
    type: code
    language: js
    title: Die Seitenaufteilung eines Assistenten reparieren
    description: |
      Ein Assistent hat `paginate(items, page, perPage)` geschrieben. Seiten zählen **ab 1**. Die Funktion
      soll die Einträge der gewünschten Seite und die Gesamtzahl der Seiten liefern:

      ```js
      paginate(['a', 'b', 'c', 'd', 'e'], 1, 2) // { items: ['a', 'b'], totalPages: 3 }
      paginate(['a', 'b', 'c', 'd', 'e'], 3, 2) // { items: ['e'], totalPages: 3 }
      ```

      Der Code sieht vernünftig aus, enthält aber zwei typische Grenzfehler. Lies jede Zeile, finde beide und
      behebe sie. Eine leere Liste hat `0` Seiten.
    starter: |
      function paginate(items, page, perPage) {
        const start = page * perPage;
        return {
          items: items.slice(start, start + perPage),
          totalPages: Math.floor(items.length / perPage),
        };
      }
    tests:
      - name: erste Seite
        code: "assertDeepEqual(paginate(['a', 'b', 'c', 'd', 'e'], 1, 2), { items: ['a', 'b'], totalPages: 3 })"
      - name: letzte, unvollständige Seite
        code: "assertDeepEqual(paginate(['a', 'b', 'c', 'd', 'e'], 3, 2), { items: ['e'], totalPages: 3 })"
      - name: Seitenzahl geht genau auf
        code: "assertEqual(paginate([1, 2, 3, 4], 2, 2).totalPages, 2)"
      - name: leere Liste
        code: "assertDeepEqual(paginate([], 1, 10), { items: [], totalPages: 0 })"
    hints:
      - Seite 1 soll bei Index 0 beginnen. Welcher Startindex ergibt sich aus `page * perPage` für Seite 1?
      - Bei 5 Einträgen und 2 pro Seite brauchst du 3 Seiten. `Math.floor` rundet ab – was brauchst du stattdessen?
    solution: |
      function paginate(items, page, perPage) {
        const start = (page - 1) * perPage;
        return {
          items: items.slice(start, start + perPage),
          totalPages: Math.ceil(items.length / perPage),
        };
      }
  - id: patch-pruefen
    type: terminal
    title: Einen KI-Patch prüfen, bevor er bleibt
    description: |
      Im Ordner `statistik` liegt ein Repository und daneben die Datei `ki-patch.diff`. Ein Assistent hat damit
      eine Funktion `median()` samt Tests geliefert. Seine Tests sind grün – trotzdem ist der Code falsch.

      1. Prüfe den Patch mit `git apply --check ki-patch.diff` und wende ihn mit `git apply ki-patch.diff` an.
      2. Lies `src/stats.js` Zeile für Zeile und führe `npm test` aus.
      3. Ergänze in `test/stats.test.js` einen Test, der den Fehler zeigt – z. B. mit **mehrstelligen** Zahlen
         wie `[10, 9, 2]` (Median `9`). Der Test muss mit dem Original-Patch rot werden.
      4. Ergänze einen Test, der prüft, dass `median()` das übergebene Array **nicht verändert**.
      5. Behebe den Fehler in `src/stats.js`, bis `npm test` grün ist.
      6. Committe alles (die Datei `ki-patch.diff` darf gelöscht werden oder bleibt ungetrackt liegen).

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: statistik
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p src test
      printf '{\n  "name": "statistik",\n  "type": "module",\n  "scripts": { "test": "node --test" }\n}\n' > package.json
      cat > src/stats.js <<'JS'
      export function mean(values) {
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      }
      JS
      cat > test/stats.test.js <<'JS'
      import { test } from 'node:test';
      import assert from 'node:assert/strict';
      import { mean } from '../src/stats.js';

      test('mean of three values', () => {
        assert.equal(mean([1, 2, 3]), 2);
      });
      JS
      git add -A
      git commit -q -m "chore: initial commit"
      cat >> src/stats.js <<'JS'

      export function median(values) {
        const sorted = values.sort();
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2;
      }
      JS
      sed -i "s/import { mean } from/import { mean, median } from/" test/stats.test.js
      cat >> test/stats.test.js <<'JS'

      test('median of an odd number of values', () => {
        assert.equal(median([3, 1, 2]), 2);
      });

      test('median of an even number of values', () => {
        assert.equal(median([4, 1, 3, 2]), 2.5);
      });
      JS
      git diff > ki-patch.diff
      git checkout -q -- .
    checks:
      - type: command
        run: "grep -q 'export function median' src/stats.js"
        message: Der Patch ist noch nicht angewendet. Nutze `git apply ki-patch.diff`.
      - type: command
        run: node --test
        message: "`npm test` ist nicht grün. Behebe den Fehler in src/stats.js – nicht in den Tests."
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cat > "$d/check.mjs" <<'JS'
          import { median } from '../src/stats.js';
          const input = [10, 9, 2];
          const ok = median(input) === 9 && median([1, 20, 3, 4]) === 3.5 && median([7]) === 7
            && JSON.stringify(input) === '[10,9,2]';
          process.exit(ok ? 0 : 1);
          JS
          node "$d/check.mjs"; rc=$?; rm -rf "$d"; exit $rc
        message: median() rechnet noch falsch oder verändert das übergebene Array. Sortiere eine Kopie numerisch, z. B. `[...values].sort((a, b) => a - b)`.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          mkdir -p "$d/src" "$d/test"
          cp package.json "$d/"
          cp test/*.js "$d/test/"
          git show "$(git rev-list --max-parents=0 HEAD | head -n 1)":src/stats.js > "$d/src/stats.js"
          cat >> "$d/src/stats.js" <<'JS'

          export function median(values) {
            const sorted = values.sort();
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2
              ? sorted[mid]
              : (sorted[mid - 1] + sorted[mid]) / 2;
          }
          JS
          (cd "$d" && node --test >/dev/null 2>&1); rc=$?; rm -rf "$d"
          test $rc -ne 0
        message: Deine Tests würden den fehlerhaften Original-Patch nicht erkennen. Ergänze einen Test mit mehrstelligen Zahlen, z. B. `assert.equal(median([10, 9, 2]), 9)`.
      - type: command
        run: "grep -Ec 'median\\(' test/stats.test.js"
        stdout_matches: "^([4-9]|[1-9][0-9]+)$"
        message: Ergänze mindestens zwei neue Tests für median() – einen mit mehrstelligen Zahlen und einen, der prüft, dass das Eingabe-Array unverändert bleibt.
      - type: command
        run: git status --porcelain -- src test
        stdout_equals: ""
        message: Deine Änderungen an src/ und test/ sind noch nicht committet.
      - type: command
        run: git log --oneline | wc -l
        stdout_matches: "^\\s*([2-9]|[1-9][0-9]+)\\s*$"
        message: Committe den reparierten Patch mit deinen Tests (mindestens ein neuer Commit).
    hints:
      - "`node -e \"console.log([10, 9, 2].sort())\"` zeigt dir, wie `sort()` ohne Vergleichsfunktion sortiert."
      - "Ein Test für die Unveränderlichkeit: `const input = [3, 1, 2]; median(input); assert.deepEqual(input, [3, 1, 2]);`"
      - "Der Fix: `const sorted = [...values].sort((a, b) => a - b);` – dann `git add src test` und committen."
    solution: |
      ```bash
      cd statistik
      git apply --check ki-patch.diff && git apply ki-patch.diff
      npm test                                   # grün – aber das heißt nichts
      cat >> test/stats.test.js <<'EOF'

      test('median sorts numerically', () => {
        assert.equal(median([10, 9, 2]), 9);
      });

      test('median does not change its input', () => {
        const input = [3, 1, 2];
        median(input);
        assert.deepEqual(input, [3, 1, 2]);
      });
      EOF
      npm test                                   # jetzt rot
      sed -i 's/const sorted = values.sort();/const sorted = [...values].sort((a, b) => a - b);/' src/stats.js
      npm test                                   # grün
      git add src test
      git commit -m "feat: add median with numeric sort"
      ```
---
Ein Assistent liefert dreißig Zeilen, sauber eingerückt, mit Kommentaren und grünen Tests. Alles sieht
professionell aus. Genau das ist die Falle: KI-Code ist **plausibel formatiert**, auch wenn er falsch ist.
Fehler verraten sich nicht durch schlechten Stil.

![Fünf Filter für jeden KI-Vorschlag: lesen, ausführen, nachschlagen, absichern, entscheiden](/assets/ki-assistenten/review-trichter.svg)

## Prüfe wie bei einer fremden Pull Request

Behandle jeden KI-Vorschlag wie Code von jemandem, den du nicht kennst. Du würdest einen fremden
[[pull-request|Pull Request]] auch nicht mergen, nur weil die Beschreibung überzeugend klingt.

Die fünf Filter aus der Grafik:

1. **Lesen** – jede Zeile des [[diff|Diffs]]. Kannst du jede Zeile erklären?
2. **Ausführen** – Tests, [[linter|Linter]], Typprüfung. Nicht „sollte laufen“, sondern laufen lassen.
3. **Nachschlagen** – jede unbekannte Funktion, Option und jedes Paket in der offiziellen Doku.
4. **Absichern** – Eingaben, Rechte, Geheimnisse, Lizenzen (dazu die nächsten beiden Lektionen).
5. **Entscheiden** – übernehmen, ändern oder verwerfen. Du entscheidest, nicht das Werkzeug.

> [!MERKSATZ]
> Gut aussehender Code ist kein Beweis. Beweise sind ausgeführte Tests und nachgeschlagene Doku.

## Typische Fehlermuster in KI-Code

KI-Code scheitert selten an der Syntax, sondern an Details, die im Training uneinheitlich waren:

| Muster | Beispiel |
|---|---|
| Grenzfehler | `<` statt `<=`, Seite 1 beginnt bei Index `perPage` |
| tückische Standardwerte | `sort()` ohne Vergleichsfunktion sortiert Zahlen als Text |
| verdeckte Nebenwirkungen | Funktion verändert das übergebene Array |
| erfundene APIs | `items.sumBy()`, `Object.deepMerge()` |
| veraltete APIs | Muster einer alten Framework-Version |
| fehlende Fehlerbehandlung | leere Liste, `null`, fehlende Datei |
| „grün gemachte“ Tests | Erwartung angepasst, Test übersprungen oder gelöscht |

```js title="Zwei Fehler in einer harmlosen Zeile"
const sorted = values.sort();
// 1. Sortiert als Text: [10, 9, 2] -> [10, 2, 9]
// 2. Verändert das Array des Aufrufers
const fixed = [...values].sort((a, b) => a - b);
```

## Grüne Tests sind nur so gut wie die Tests

Hat der Assistent die Tests gleich mitgeschrieben, prüfen sie oft genau das, was der Code ohnehin tut.
Ein `median([3, 1, 2])` ist mit Text- und Zahlensortierung gleich – der Fehler bleibt unsichtbar.

Frag dich bei jedem Test: **Würde er rot werden, wenn der Code falsch wäre?**

- Teste [[randfall|Randfälle]]: leer, ein Element, mehrstellige Zahlen, negative Werte, Grenzen.
- Achte im Diff auf **geänderte Erwartungen** in bestehenden Tests – das ist ein Alarmsignal.
- Achte auf `skip`, `todo` oder gelöschte Tests.

> [!FEHLER]
> **„Die KI hat Tests geschrieben, also ist es getestet.“** Tests vom selben Modell teilen dieselben
> Annahmen wie der Code. Mindestens einen Test pro Änderung formulierst du selbst – am besten für den Fall,
> den du für am riskantesten hältst.

## Patches prüfen, ohne Risiko

Bekommst du eine Änderung als Patch-Datei, prüfst du sie zuerst trocken:

```bash title="Erst prüfen, dann anwenden"
git status                      # sauberer Stand?
git apply --check ki-patch.diff # passt der Patch?
git apply ki-patch.diff         # anwenden
git diff                        # lesen
npm test                        # ausführen
```

Gefällt dir das Ergebnis nicht, bringt `git restore .` alles zurück – weil du vorher sauber warst.

> [!PRAXIS]
> In vielen Teams gilt für KI-Änderungen dieselbe Review-Pflicht wie für alle anderen: Ein Mensch, der den
> Code nicht selbst erzeugt hat, liest ihn im Pull Request. Werkzeuge, die automatisch Review-Kommentare
> schreiben, ergänzen das [[vier-augen-prinzip|Vier-Augen-Prinzip]] – sie ersetzen es nicht.

## Zusammenfassung

- KI-Code sieht immer professionell aus – Stil ist kein Qualitätsbeweis.
- Lesen, ausführen, nachschlagen, absichern, entscheiden: fünf Filter für jeden Vorschlag.
- Typische Fehler: Grenzen, tückische Standardwerte, Nebenwirkungen, erfundene und veraltete APIs.
- Tests vom selben Modell sind schwach; schreibe mindestens einen riskanten Test selbst.
- Geänderte Erwartungen, übersprungene oder gelöschte Tests sind Alarmsignale.
- Patches prüfst du mit `git apply --check` auf einem sauberen Stand.
