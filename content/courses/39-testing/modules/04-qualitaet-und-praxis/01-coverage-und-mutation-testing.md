---
title: Code Coverage und Mutation Testing
summary: Wie du misst, welcher Code getestet wird – und warum erst Mutation Testing zeigt, ob deine Tests Fehler wirklich bemerken.
duration: 25
sources:
  - title: Pest – Test Coverage
    url: https://pestphp.com/docs/test-coverage
  - title: Pest – Mutation Testing
    url: https://pestphp.com/docs/mutation-testing
  - title: Xdebug – Code Coverage
    url: https://xdebug.org/docs/code_coverage
  - title: Infection – Mutation Testing Framework for PHP
    url: https://infection.github.io/guide/
quiz:
  - type: single
    question: "Eine Klasse hat 100 Prozent Code Coverage, aber nur 58 Prozent Mutation Score. Was bedeutet das?"
    options:
      - Die Tests führen jede Zeile aus, bemerken aber viele absichtlich eingebaute Fehler nicht.
      - Die Coverage-Messung ist kaputt.
      - 42 Prozent der Tests sind rot.
    answer: 0
    explanation: Coverage misst, ob Code lief. Mutation Testing misst, ob ein Test rot wird, wenn der Code falsch ist. Fehlende Grenzwerte und ungenaue Assertions zeigen sich erst hier.
  - type: cloze
    text: "Damit Pest mit Xdebug Coverage messen kann, startest du `XDEBUG_MODE=___ ./vendor/bin/pest --coverage`. Mutation Testing startest du mit dem Schalter `--___`."
    blanks:
      - [coverage]
      - [mutate]
    explanation: Xdebug sammelt Coverage nur im Modus coverage. Mutation Testing braucht ebenfalls einen Coverage-Treiber (Xdebug oder PCOV), weil Pest wissen muss, welche Tests welche Zeilen ausführen.
  - type: match
    question: "Original: `$base = $total >= 5000 ? 0 : 490;` und `$base + 990` für Express – welcher Test tötet welchen Mutanten?"
    pairs:
      - { left: "Mutant: $total > 5000", right: "cost(5000) muss 0 ergeben" }
      - { left: "Mutant: $total >= 4999", right: "cost(4999) muss 490 ergeben" }
      - { left: "Mutant: $base + 991 (Express)", right: "cost(1000, true) muss genau 1480 ergeben" }
      - { left: "Mutant: $total < 5000", right: "jeder Test mit klarer Erwartung, z. B. cost(1000) = 490" }
    explanation: Grenzmutanten überleben, solange niemand genau an der Grenze testet. Ein umgedrehter Vergleich fällt dagegen schon beim ersten Normalfall auf.
  - type: multiple
    question: Welche Aussagen über Mutation Testing stimmen?
    options:
      - Ein „untested“ (überlebender) Mutant zeigt eine Lücke in den Tests.
      - Mutation Testing ändert deinen Quellcode dauerhaft.
      - Es ist langsamer als ein normaler Testlauf, weil die Tests pro Mutant laufen.
      - Mit `--min` kannst du einen Mindest-Score als Qualitätsschranke setzen.
    answers: [0, 2, 3]
    explanation: Pest erzeugt die Mutanten nur vorübergehend. Weil für jeden Mutanten Tests laufen, beschränkst du die Läufe mit `mutates()`/`covers()` oder nutzt `--parallel`.
tasks:
  - id: mutanten-toeten
    type: steps
    title: Welcher Test fehlt?
    description: Pest meldet dir überlebende Mutanten. Entscheide jeweils, welcher zusätzliche Test den Mutanten tötet.
    steps:
      - situation: "Code: `if ($percent > 100) { throw … }`. Mutant: `if ($percent > 101)`. Deine Tests prüfen 10 und 150 Prozent."
        question: Welcher Test tötet den Mutanten?
        options: ["Ein Test mit 50 Prozent", "Ein Test mit 101 Prozent, der eine Exception erwartet", "Ein Test mit 200 Prozent"]
        answer: 1
        explanation: Nur bei genau 101 Prozent verhalten sich Original (Exception) und Mutant (keine Exception) verschieden.
      - situation: "Code: `return $express ? $base + 990 : $base;`. Mutant: `$base + 991`. Dein Test prüft `expect($cost)->toBeGreaterThan(490)`."
        question: Wie tötest du den Mutanten?
        options: ["Mit toBe(1480) statt toBeGreaterThan", "Mit einem zweiten toBeGreaterThan-Test", "Gar nicht, 1 Cent ist egal"]
        answer: 0
        explanation: Unscharfe Assertions lassen Mutanten überleben. Eine exakte Erwartung bemerkt jede Abweichung.
      - situation: "Code: `if ($total < 0) { throw … }`. Mutant: `if ($total <= 0)`. Deine Tests nutzen 1000, 9000 und -500."
        question: Welcher Test fehlt?
        options: ["cost(0) ohne Exception", "cost(-1000) mit Exception", "cost(1) ohne Exception"]
        answer: 0
        explanation: Der Mutant wirft schon bei 0. Ein Test mit 0 Cent, der einen normalen Preis erwartet, macht ihn rot.
      - situation: "Ein Mutant ersetzt `$name = trim($name);` durch eine leere Anweisung. Alle Tests übergeben Namen ohne Leerzeichen."
        question: Was ist die beste Reaktion?
        options: ["Einen Test mit '  Ada  ' ergänzen", "Die trim-Zeile löschen, weil sie nichts bringt", "Den Mutanten ignorieren"]
        answer: 0
        explanation: Entweder ist das Verhalten gewollt – dann fehlt ein Test – oder die Zeile ist überflüssig. Meist fehlt der Test.
  - id: mutation-score-100
    type: terminal
    title: Von 100 Prozent Coverage zu 100 Prozent Mutation Score
    description: |
      Im Ordner `mutation` liegt ein Pest-Projekt mit der Klasse `App\Shipping`:
      `cost(int $totalCents, bool $express = false)` liefert 0 Cent ab 5000 Cent, sonst 490 Cent. Express
      kostet 990 Cent Aufschlag. Negative Beträge lösen eine `InvalidArgumentException` aus.

      Die vorhandenen Tests in `tests/Unit/ShippingTest.php` sind grün und haben 100 Prozent Coverage – und
      trotzdem überleben Mutanten.

      1. Miss die Coverage: `XDEBUG_MODE=coverage ./vendor/bin/pest --coverage`
      2. Starte Mutation Testing: `XDEBUG_MODE=coverage ./vendor/bin/pest --mutate` und lies die
         `UNTESTED`-Meldungen samt Diff.
      3. Ergänze Tests in `tests/Unit/ShippingTest.php` (nicht `src/Shipping.php` ändern!), bis
         `XDEBUG_MODE=coverage ./vendor/bin/pest --mutate --min=100` grün ist.

      Klicke zuerst auf **Aufgabe vorbereiten** (Composer installiert dabei Pest).
    workdir: mutation
    setup: |
      cat > composer.json <<'EOF'
      {
          "name": "stacklab/mutation",
          "type": "project",
          "require": {
              "php": "^8.4"
          },
          "require-dev": {
              "pestphp/pest": "^5.3"
          },
          "autoload": {
              "psr-4": { "App\\": "src/" }
          },
          "config": {
              "allow-plugins": { "pestphp/pest-plugin": true }
          }
      }
      EOF
      cat > phpunit.xml <<'EOF'
      <?xml version="1.0" encoding="UTF-8"?>
      <phpunit bootstrap="vendor/autoload.php" colors="true">
          <testsuites>
              <testsuite name="Test Suite">
                  <directory suffix="Test.php">./tests</directory>
              </testsuite>
          </testsuites>
          <source>
              <include>
                  <directory>src</directory>
              </include>
          </source>
      </phpunit>
      EOF
      mkdir -p src tests/Unit
      printf '<?php\n' > tests/Pest.php
      cat > src/Shipping.php <<'EOF'
      <?php
      
      declare(strict_types=1);
      
      namespace App;
      
      final class Shipping
      {
          public function cost(int $totalCents, bool $express = false): int
          {
              if ($totalCents < 0) {
                  throw new \InvalidArgumentException('Total must not be negative.');
              }
      
              $base = $totalCents >= 5000 ? 0 : 490;
      
              return $express ? $base + 990 : $base;
          }
      }
      EOF
      cat > tests/Unit/ShippingTest.php <<'EOF'
      <?php
      
      use App\Shipping;
      
      mutates(Shipping::class);
      
      it('berechnet Versand für kleine Bestellungen', function () {
          expect((new Shipping())->cost(1000))->toBe(490);
      });
      
      it('ist ab 50 Euro kostenlos', function () {
          expect((new Shipping())->cost(9000))->toBe(0);
      });
      
      it('verlangt für Express mehr', function () {
          expect((new Shipping())->cost(1000, true))->toBeGreaterThan(490);
      });
      
      it('lehnt negative Beträge ab', function () {
          (new Shipping())->cost(-500);
      })->throws(InvalidArgumentException::class);
      EOF
      timeout 150 composer install -n -q </dev/null

    checks:
      - type: file_contains
        path: src/Shipping.php
        pattern: "\\$totalCents >= 5000 \\? 0 : 490"
        message: src/Shipping.php wurde verändert. Setze die Aufgabe zurück – du sollst nur Tests ergänzen.
      - type: file_contains
        path: src/Shipping.php
        pattern: "\\$base \\+ 990"
        message: src/Shipping.php wurde verändert. Setze die Aufgabe zurück – du sollst nur Tests ergänzen.
      - type: command
        run: ./vendor/bin/pest
        message: Deine Tests sind nicht mehr alle grün. Starte ./vendor/bin/pest.
      - type: command
        run: XDEBUG_MODE=coverage ./vendor/bin/pest --mutate --min=100
        message: Es überleben noch Mutanten. Führe XDEBUG_MODE=coverage ./vendor/bin/pest --mutate aus und ergänze Tests für jede UNTESTED-Meldung.
    hints:
      - Die überlebenden Mutanten sitzen an den Grenzen. Teste 0, 4999 und 5000 Cent und -1 Cent.
      - "`toBeGreaterThan(490)` ist zu ungenau. Express auf 1000 Cent kostet genau 1480 Cent."
      - "Ein Dataset spart Schreibarbeit: `->with(['0 Cent' => [0, 490], '4999 Cent' => [4999, 490], '5000 Cent' => [5000, 0]])`."
    solution: |
      ```bash
      cd mutation
      cat >> tests/Unit/ShippingTest.php <<'EOF'

      it('kennt die Grenze bei 50 Euro', function (int $total, int $expected) {
          expect((new Shipping())->cost($total))->toBe($expected);
      })->with([
          '0 Cent' => [0, 490],
          '4999 Cent' => [4999, 490],
          '5000 Cent' => [5000, 0],
      ]);

      it('berechnet Express exakt', function () {
          expect((new Shipping())->cost(1000, true))->toBe(1480);
      });

      it('lehnt schon -1 Cent ab', function () {
          (new Shipping())->cost(-1);
      })->throws(InvalidArgumentException::class);
      EOF
      XDEBUG_MODE=coverage ./vendor/bin/pest --mutate --min=100
      ```
---
Deine Tests sind grün, und das Coverage-Werkzeug meldet stolze 100 Prozent. Heißt das, deine Tests finden
jeden Fehler? Leider nein. Coverage zählt, welche Zeilen **ausgeführt** wurden – nicht, ob ein Test es
merken würde, wenn diese Zeilen etwas Falsches tun. Genau diese Lücke schließt Mutation Testing.

## Code Coverage messen

Die [[testabdeckung|Testabdeckung]] (Code Coverage) zeigt, welcher Anteil deines Codes beim Testlauf lief.
PHP braucht dafür einen Coverage-Treiber: [[xdebug|Xdebug]] oder das schlankere [[pcov|PCOV]].

```bash title="Terminal"
XDEBUG_MODE=coverage ./vendor/bin/pest --coverage
XDEBUG_MODE=coverage ./vendor/bin/pest --coverage --min=90
XDEBUG_MODE=coverage ./vendor/bin/pest --coverage-html=coverage-report
```

```text
Shipping ................................................ 100.0%
Total: 100.0 %
```

Welche Dateien zählen, legt `<source>` in der `phpunit.xml` fest. Mit `--min=90` schlägt der Lauf fehl,
wenn die Abdeckung unter 90 Prozent fällt – praktisch als Schranke in der [[ci-pipeline|CI-Pipeline]].
Der HTML-Bericht färbt jede Zeile grün oder rot.

> [!FEHLER]
> **„Unable to get coverage using Xdebug“.** Xdebug ist installiert, aber nicht im Coverage-Modus. Setze
> die Umgebungsvariable `XDEBUG_MODE=coverage` vor den Befehl.

## Die Grenze von Coverage

Dieser Test bringt eine Methode auf 100 Prozent Coverage:

```php
it('verlangt für Express mehr', function () {
    expect((new Shipping())->cost(1000, true))->toBeGreaterThan(490);
});
```

Die Zeile `return $express ? $base + 990 : $base;` läuft – aber ob der Aufschlag 990 oder 9 Cent beträgt,
ist dem Test egal. Ein Test ganz ohne `expect` würde sogar genauso viel Coverage erzeugen.

> [!MERKSATZ]
> Coverage sagt, was **nicht** getestet ist (die roten Zeilen). Sie sagt nicht, ob das Grüne gut getestet ist.

## Mutation Testing: Fehler mit Absicht

Beim [[mutationstest|Mutation Testing]] baut das Werkzeug absichtlich kleine Fehler in deinen Code ein –
jede Variante heißt [[mutant|Mutant]] – und lässt deine Tests laufen:

![Ablauf beim Mutation Testing: Mutanten entstehen aus dem Originalcode, Tests bemerken sie oder nicht](/assets/testing/mutation-testing.svg)

| Ergebnis | Bedeutung |
|---|---|
| Ein Test wird rot („tested“) | Gut – deine Tests bemerken den Fehler, der Mutant ist „getötet“ |
| Alle Tests bleiben grün („untested“) | Lücke – dieser Fehler würde unbemerkt in Produktion gehen |

Typische Mutationen: `>=` wird zu `>`, `+` zu `-`, `true` zu `false`, `5000` zu `5001`, ein `return` liefert
einen anderen Wert. Der [[mutation-score|Mutation Score]] ist der Anteil getöteter Mutanten.

## Mutation Testing mit Pest

Pest 5 bringt Mutation Testing mit. Am Anfang einer Testdatei sagst du, welche Klasse sie prüft:

```php title="tests/Unit/ShippingTest.php"
use App\Shipping;

mutates(Shipping::class);   // oder covers(Shipping::class)
```

Ohne `mutates()` oder `covers()` bricht `--mutate` mit einem Hinweis ab – außer mit `--everything`, das alle Klassen mutiert (langsam).

```bash
XDEBUG_MODE=coverage ./vendor/bin/pest --mutate
XDEBUG_MODE=coverage ./vendor/bin/pest --mutate --parallel --min=80
```

```text
UNTESTED  src/Shipping.php  > Line 15: GreaterOrEqualToGreater
-        $base = $totalCents >= 5000 ? 0 : 490;
+        $base = $totalCents > 5000 ? 0 : 490;

Mutations: 8 untested, 11 tested
Score:     57.89%
```

Die Meldung zeigt Zeile, Art und Diff des Mutanten. Hier fehlt offensichtlich ein Test für genau 5000 Cent.
Mit `--min` setzt du einen Mindest-Score, `--covered-only` beschränkt sich auf abgedeckte Zeilen.

> [!TIPP]
> Außerhalb von Pest ist [Infection](https://infection.github.io/guide/) das bekannte Mutation-Testing-Werkzeug
> für PHP; für JavaScript gibt es [Stryker](https://stryker-mutator.io/).

## Überlebende Mutanten töten

Jeder `UNTESTED`-Mutant ist eine konkrete Frage: „Wäre dir dieser Fehler aufgefallen?“ Die Antworten
sind fast immer dieselben:

| Mutant überlebt, weil … | Lösung |
|---|---|
| niemand genau an der Grenze testet | Grenzwerte testen (4999, 5000, 0, -1) |
| die Assertion unscharf ist | exakte Werte: `toBe(1480)` statt `toBeGreaterThan(490)` |
| ein Verhalten gar nicht geprüft wird | Test ergänzen – oder überflüssigen Code löschen |

> [!PRAXIS]
> In Teams läuft Mutation Testing meist nicht bei jedem Speichern, sondern für geänderte Klassen in der
> CI-Pipeline – mit `--parallel` und einem Mindest-Score für besonders kritischen Code wie Preise,
> Rechte oder Gutscheine.

## Zusammenfassung

- Code Coverage misst ausgeführte Zeilen; Pest braucht dafür Xdebug (`XDEBUG_MODE=coverage`) oder PCOV.
- `--coverage --min=…` macht Coverage zur Schranke, rote Zeilen zeigen ungetesteten Code.
- 100 Prozent Coverage heißen nicht, dass die Tests Fehler bemerken.
- Mutation Testing baut Mutanten ein; „untested“ bedeutet eine Lücke in den Tests.
- Pest: `mutates()` in der Testdatei, `--mutate`, `--min`, `--parallel`.
- Überlebende Mutanten tötest du mit Grenzwerten und exakten Assertions.
