---
title: Formatieren, Linten, Analysieren
summary: Was Formatter, Linter und statische Analyse genau unterscheidet, was Prüf- und Reparaturmodus sind und warum der Exit-Code alles entscheidet.
duration: 25
sources:
  - title: PHP-Handbuch – Kommandozeilenoptionen (php -l)
    url: https://www.php.net/manual/de/features.commandline.options.php
  - title: Laravel Pint – Running Pint
    url: https://laravel.com/docs/13.x/pint#running-pint
  - title: PHPStan – Rule Levels
    url: https://phpstan.org/user-guide/rule-levels
  - title: Biome – Linter
    url: https://biomejs.dev/linter/
quiz:
  - type: single
    question: Ein Werkzeug ändert `function f( $a ){` zu `function f($a)` mit der Klammer in einer neuen Zeile. Was für ein Werkzeug ist das?
    options: [Ein Formatter, Ein Linter, Statische Analyse, Ein Test]
    answer: 0
    explanation: Ein Formatter ändert nur das Aussehen – Leerzeichen, Zeilenumbrüche, Klammerposition. Die Bedeutung des Codes bleibt gleich.
  - type: multiple
    question: Welche Aussagen über den Prüfmodus (zum Beispiel `pint --test`) stimmen?
    options:
      - Er verändert keine Dateien.
      - Er endet mit einem Exit-Code ungleich 0, wenn er etwas findet.
      - Er ist für die CI-Pipeline gedacht.
      - Er repariert die Dateien und meldet trotzdem einen Fehler.
    answers: [0, 1, 2]
    explanation: >
      Der Prüfmodus liest nur und meldet über den Exit-Code. Das Reparieren und gleichzeitige Melden ist eine
      eigene Option (`pint --repair`).
  - type: find-bug
    question: PHPStan meldet einen Fehler in dieser Funktion, obwohl sie fehlerfrei ausgeführt werden kann – solange der Name existiert. In welcher Zeile?
    language: php
    code: |
      <?php
      function greeting(array $users, string $id): string
      {
          $name = $users[$id] ?? null;
          return 'Hallo ' . strtoupper($name);
      }
    bug_line: 5
    explanation: >
      `$name` kann `null` sein, `strtoupper()` erwartet aber einen String. Ein Test mit einer existierenden ID
      würde das nie zeigen – die statische Analyse sieht alle möglichen Wege durch den Code.
  - type: match
    question: Ordne jedem Ergebnis den passenden Exit-Code zu.
    pairs:
      - { left: "pint --test findet nichts", right: "0 – die CI bleibt grün" }
      - { left: "pint --test findet ein Stilproblem", right: "1 – die CI wird rot" }
      - { left: "rector process --dry-run würde Dateien ändern", right: "2 – auch das ist ein Fehlercode" }
    explanation: Jedes Programm endet mit einem Exit-Code. Die CI-Pipeline schaut nur, ob er 0 ist – welche Zahl ungleich 0 es genau ist, legt jedes Werkzeug selbst fest.
tasks:
  - id: pruefen-und-reparieren
    type: terminal
    title: Syntaxfehler finden und Code formatieren
    description: |
      Im Ordner `pruefen-und-reparieren` liegt ein kleines PHP-Projekt mit drei Dateien in `src/`. Eine Datei
      enthält einen Syntaxfehler, eine ist wild formatiert.

      1. Prüfe jede Datei mit `php -l` und finde den Syntaxfehler.
      2. Repariere ihn von Hand (zum Beispiel mit `nano`). Der Formatter kann das nicht für dich tun – er
         versteht kaputten Code nicht.
      3. Prüfe den Stil mit `pint --test` und schau dir den Exit-Code mit `echo $?` an.
      4. Lass `pint` die Dateien reparieren und prüfe danach noch einmal mit `pint --test`.

      Klicke zuerst auf **Aufgabe vorbereiten**. Im Übungs-Terminal ist `pint` global installiert; in einem
      echten Projekt rufst du es als `./vendor/bin/pint` auf.
    workdir: pruefen-und-reparieren
    setup: |
      mkdir -p src
      cat > src/Order.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      final class Order
      {
          /** @param list<int> $prices */
          public function __construct(private array $prices)
          {
          }

          public function total(): int
          {
              return array_sum($this->prices)
          }
      }
      EOF
      cat > src/Customer.php <<'EOF'
      <?php
      declare(strict_types=1);
      namespace App;
      final class Customer {
          public function __construct( private string $name ){}
          public function name() : string {
            return $this->name ;
          }
      }
      EOF
      cat > src/helpers.php <<'EOF'
      <?php

      declare(strict_types=1);

      function euro(int $cents): string
      {
          return number_format($cents / 100, 2, ',', '.').' €';
      }
      EOF
    checks:
      - type: command
        run: "for f in src/*.php; do php -l \"$f\" >/dev/null 2>&1 || { echo \"$f\"; exit 1; }; done"
        message: Mindestens eine Datei hat noch einen Syntaxfehler. Prüfe jede Datei mit php -l – in src/Order.php fehlt etwas.
      - type: file_contains
        path: src/Order.php
        pattern: "function total\\(\\): int"
        message: Die Methode total() in src/Order.php muss erhalten bleiben – repariere den Fehler, statt Code zu löschen.
      - type: file_contains
        path: src/Order.php
        pattern: "array_sum\\(\\$this->prices\\);"
        message: In der Zeile mit array_sum fehlt noch das Semikolon.
      - type: command
        run: pint --test
        message: Der Code-Stil ist noch nicht sauber. Führe pint ohne --test aus, damit es die Dateien repariert.
    hints:
      - "`php -l src/Order.php` zeigt dir die Zeile mit dem Fehler. Achtung: Die Zeilenangabe ist manchmal eine Zeile zu spät."
      - In `src/Order.php` fehlt am Ende der `return`-Zeile ein Semikolon.
      - Nach der Reparatur genügt `pint` – danach meldet `pint --test` Exit-Code 0.
    solution: |
      ```bash
      cd pruefen-und-reparieren
      for f in src/*.php; do php -l "$f"; done
      sed -i 's/return array_sum($this->prices)$/return array_sum($this->prices);/' src/Order.php
      php -l src/Order.php
      pint --test; echo $?
      pint
      pint --test; echo $?
      ```
  - id: exit-codes-ablauf
    type: steps
    title: Was passiert als Nächstes?
    description: Spiel durch, wie eine CI-Pipeline auf die Exit-Codes der Werkzeuge reagiert.
    steps:
      - situation: >
          Die Pipeline führt `./vendor/bin/pint --test` aus. Eine Datei hat ein überflüssiges Leerzeichen.
        question: Was passiert?
        options:
          - Pint repariert die Datei und die Pipeline läuft grün weiter.
          - Pint meldet die Datei und endet mit Exit-Code 1 – der Schritt wird rot.
          - Pint gibt eine Warnung aus, der Exit-Code ist 0.
        answer: 1
        explanation: Mit `--test` verändert Pint nichts. Es meldet und beendet sich mit einem Fehlercode – genau das will die CI.
      - situation: >
          Du lässt lokal `./vendor/bin/pint` (ohne `--test`) laufen. Es formatiert drei Dateien.
        question: Welcher Exit-Code kommt heraus?
        options:
          - 0 – die Dateien sind jetzt sauber, alles in Ordnung.
          - 1 – es wurde ja etwas gefunden.
        answer: 0
        explanation: >
          Im Reparaturmodus ist das Ziel erreicht, sobald die Dateien sauber sind. Wer trotzdem einen Fehlercode
          will (etwa in einem Hook), nutzt `pint --repair`.
      - situation: >
          PHPStan findet in der Pipeline einen möglichen `null`-Zugriff.
        question: Kann PHPStan das automatisch reparieren?
        options:
          - Ja, mit `--fix`.
          - Nein. Statische Analyse meldet nur – die richtige Lösung musst du entscheiden.
        answer: 1
        explanation: Ob `null` ein Fehler ist, eine Standardwert braucht oder eine Exception – das ist eine fachliche Entscheidung. Deshalb repariert PHPStan nichts.
---
In der letzten Lektion hast du die vier Werkzeugarten kennengelernt. Jetzt schauen wir genauer hin: Was
darf ein Formatter, was ein Linter, was die statische Analyse? Und wie reden diese Werkzeuge mit einer
CI-Pipeline, die keinen Text lesen kann? Die Antwort auf die zweite Frage ist eine einzige Zahl.

## Der Formatter: nur das Aussehen

Ein [[formatter|Formatter]] bringt Code in eine einheitliche Form. Er ändert Leerzeichen, Einrückung,
Zeilenumbrüche, Klammerpositionen und Anführungszeichen – aber **nie die Bedeutung**.

```php title="Vorher"
final class Customer {
    public function name() : string {
      return $this->name ;
    }
}
```

```php title="Nachher – derselbe Code, nur formatiert"
final class Customer
{
    public function name(): string
    {
        return $this->name;
    }
}
```

Weil ein Formatter die Bedeutung nicht ändert, darf er Dateien **ohne Rückfrage** umschreiben. Diskussionen
über Stil enden damit: Der Formatter entscheidet, nicht der lauteste Mensch im Team.

> [!MERKSATZ]
> Ein Formatter ändert, **wie** Code aussieht – nie, **was** er tut.

## Der Linter: verdächtige Muster

Ein [[linter|Linter]] sucht nach Code, der zwar läuft, aber wahrscheinlich falsch oder schlecht ist. Jede
Prüfung ist eine [[lint-regel|Lint-Regel]]:

| Regel (Beispiel) | Was sie meldet |
|---|---|
| `noDoubleEquals` | `a == 1` statt `a === 1` in JavaScript |
| `noVar` | `var` statt `let`/`const` |
| `noUnusedVariables` | Variablen, die nie gelesen werden |

Der kleinste Linter ist schon in PHP eingebaut: `php -l` (*lint*) prüft eine Datei auf
[[syntaxfehler|Syntaxfehler]], ohne sie auszuführen.

```bash title="Terminal"
php -l src/Order.php
# PHP Parse error: syntax error, unexpected token "}" in src/Order.php on line 17
```

Manche Lint-Regeln können automatisch korrigiert werden ([[autofix|Autofix]]), andere nur gemeldet.

## Statische Analyse: Typen und Wege durch den Code

Die [[statische-analyse|statische Analyse]] geht am tiefsten. Sie verfolgt, welche [[datentyp|Typen]] an
welcher Stelle möglich sind – über alle Wege durch den Code, nicht nur den einen, den ein Test ausprobiert:

```php
$name = $users[$id] ?? null;      // string|null
return strtoupper($name);         // PHPStan: erwartet string, string|null gegeben
```

Ein Test mit einer gültigen ID wäre grün. [[phpstan|PHPStan]] sieht aber, dass `$name` auch `null` sein
kann. Für TypeScript übernimmt der Compiler `tsc` diese Rolle.

Statische Analyse **repariert nie selbst**: Ob `null` ein Standardwert, eine Exception oder ein Fehler im
Aufrufer ist, musst du fachlich entscheiden.

> [!FEHLER]
> „Die Tests sind grün, also stimmen die Typen.“ – Tests prüfen nur die Fälle, die jemand aufgeschrieben hat.
> Statische Analyse prüft alle möglichen Wege. Beides ergänzt sich, keins ersetzt das andere.

## Prüfmodus und Reparaturmodus

Fast jedes Werkzeug, das reparieren kann, hat zwei Modi:

| Modus | Pint | Biome | Wofür |
|---|---|---|---|
| Reparieren | `pint` | `biome check --write` | lokal, beim Entwickeln |
| Nur prüfen | `pint --test` | `biome ci` | CI-Pipeline, Hooks |
| Reparieren und melden | `pint --repair` | – | Hooks, die korrigieren und trotzdem stoppen |

Im **Prüfmodus** fasst das Werkzeug keine Datei an. Das ist in der CI wichtig: Dort soll nichts still
korrigiert werden, sondern der Fehler sichtbar werden.

## Alles hängt am Exit-Code

Eine CI-Pipeline liest keine bunten Ausgaben. Sie schaut nur auf den [[exit-code|Exit-Code]]:

```bash title="Terminal"
pint --test
echo $?          # 1 → Stilfehler gefunden

pint
echo $?          # 0 → Dateien sind jetzt sauber

phpstan analyse src --level 6
echo $?          # 0 → keine Fehler, 1 → Fehler gefunden
```

`0` heißt „alles in Ordnung“, jede andere Zahl „Problem“. Deshalb kannst du Prüfungen mit `&&` verketten:
Die zweite läuft nur, wenn die erste bestanden hat.

```bash
pint --test && phpstan analyse && echo "Alles grün"
```

> [!PRAXIS]
> Wenn ein Werkzeug in der CI „grün“ ist, obwohl es Fehler ausgibt, liegt das fast immer an einem verschluckten
> Exit-Code – etwa durch `... | tee log.txt` ohne `set -o pipefail`. Prüfe bei neuen Pipelines immer, dass ein
> absichtlich eingebauter Fehler sie wirklich rot macht.

## Zusammenfassung

- Ein **Formatter** ändert nur das Aussehen und darf deshalb ohne Rückfrage reparieren.
- Ein **Linter** meldet verdächtige Muster; `php -l` prüft PHP-Dateien auf Syntaxfehler.
- **Statische Analyse** verfolgt Typen über alle Wege durch den Code und repariert nie selbst.
- Werkzeuge haben einen **Reparaturmodus** (lokal) und einen **Prüfmodus** (CI, Hooks).
- Der **Exit-Code** entscheidet: `0` ist bestanden, alles andere macht die Pipeline rot.
