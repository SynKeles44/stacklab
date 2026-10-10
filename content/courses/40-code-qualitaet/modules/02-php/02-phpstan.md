---
title: Fehler finden mit PHPStan
summary: Wie PHPStan PHP-Code ohne Ausführen auf Typfehler prüft, was die Level 0 bis 10 bedeuten, wie du die phpstan.neon schreibst und Fehlermeldungen liest und behebst.
duration: 25
sources:
  - title: PHPStan – Getting Started
    url: https://phpstan.org/user-guide/getting-started
  - title: PHPStan – Rule Levels
    url: https://phpstan.org/user-guide/rule-levels
  - title: PHPStan – Config Reference
    url: https://phpstan.org/config-reference
  - title: PHPStan – PHPDoc Types
    url: https://phpstan.org/writing-php-code/phpdoc-types
  - title: PHPStan – Ignoring Errors
    url: https://phpstan.org/user-guide/ignoring-errors
quiz:
  - type: single
    question: Was bedeutet ein höheres PHPStan-Level?
    options:
      - Es kommen strengere Prüfungen hinzu – jedes Level enthält alle Prüfungen der niedrigeren.
      - PHPStan läuft schneller.
      - Es werden mehr Dateien analysiert.
      - PHPStan repariert mehr Fehler automatisch.
    answer: 0
    explanation: Die Level bauen aufeinander auf. Level 0 prüft das Nötigste, Level 10 behandelt sogar fehlende Typen wie einen Fehler.
  - type: find-bug
    question: PHPStan meldet auf Level 0 einen Fehler. In welcher Zeile?
    language: php
    code: |
      final class Cart
      {
          /** @var list<int> */
          private array $prices = [];

          public function clear(): void
          {
              $this->price = [];
          }
      }
    bug_line: 8
    explanation: "`$this->price` gibt es nicht – die Eigenschaft heißt `$prices`. PHP würde still eine neue, dynamische Eigenschaft anlegen (mit Deprecation-Hinweis). PHPStan meldet `property.notFound`."
  - type: match
    question: Ordne jede PHPDoc-Angabe ihrer Bedeutung zu.
    pairs:
      - { left: "list<string>", right: "Liste von Strings mit Schlüsseln 0, 1, 2 …" }
      - { left: "array<string, int>", right: "Array mit String-Schlüsseln und Integer-Werten" }
      - { left: "?string", right: "String oder null" }
      - { left: "non-empty-string", right: "String, der nicht leer ist" }
    explanation: PHP selbst kennt nur `array`. Mit PHPDoc-Typen beschreibst du genauer, was darin steckt – PHPStan prüft das.
  - type: multiple
    question: Wann ist `// @phpstan-ignore` in Ordnung?
    options:
      - Wenn PHPStan etwas nachweislich falsch einschätzt und du den Grund dazuschreibst.
      - Wenn du die Fehlermeldung nicht verstehst.
      - Mit dem konkreten Fehler-Identifier, z. B. `@phpstan-ignore argument.type`.
      - Um die Pipeline schnell grün zu bekommen.
    answers: [0, 2]
    explanation: Ein Ignore ist eine bewusste, begründete Ausnahme – mit Identifier, damit es nicht versehentlich andere Fehler verschluckt.
tasks:
  - id: phpstan-level-8
    type: terminal
    title: PHPStan auf Level 8 grün bekommen
    description: |
      Im Ordner `phpstan-level-8` liegt die Klasse `src/UserDirectory.php`. Sie läuft, enthält aber mehrere
      Fehler, die nur die statische Analyse findet.

      1. Lege eine `phpstan.neon` an, die `src` auf **Level 8** analysiert.
      2. Starte `phpstan analyse` und lies die Meldungen. Beginne beim Tippfehler (Level 0).
      3. Behebe alle Fehler **im Code** – ohne `@phpstan-ignore` und ohne `ignoreErrors`:
         - `count()` braucht einen Rückgabetyp.
         - `initials()` braucht PHPDoc-Typen für Parameter und Rückgabe (`@param list<string> $ids`, `@return list<string>`).
         - `greeting()` darf `strtoupper()` kein `null` übergeben. Ist die ID unbekannt, soll es `Hallo Gast` liefern.
      4. Wiederhole `phpstan analyse`, bis `[OK] No errors` erscheint.

      Klicke zuerst auf **Aufgabe vorbereiten**. Im Übungs-Terminal ist `phpstan` global installiert; im Projekt
      rufst du es als `./vendor/bin/phpstan` auf.
    workdir: phpstan-level-8
    setup: |
      mkdir -p src
      cat > src/UserDirectory.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      final class UserDirectory
      {
          /** @var array<string, string> */
          private array $names = [];

          public function add(string $id, string $name): void
          {
              $this->names[$id] = $name;
          }

          public function find(string $id): ?string
          {
              return $this->names[$id] ?? null;
          }

          public function greeting(string $id): string
          {
              return 'Hallo ' . strtoupper($this->find($id));
          }

          public function count()
          {
              return count($this->names);
          }

          public function initials(array $ids): array
          {
              $result = [];
              foreach ($ids as $id) {
                  $result[] = substr($this->names[$id] ?? '?', 0, 1);
              }

              return $result;
          }

          public function remove(string $id): void
          {
              unset($this->name[$id]);
          }
      }
      EOF
    checks:
      - type: file_contains
        path: phpstan.neon
        pattern: "level:\\s*8\\b"
        message: "Die phpstan.neon fehlt oder setzt noch nicht `level: 8` unter `parameters`."
      - type: file_contains
        path: phpstan.neon
        pattern: "-\\s*src"
        message: Trage unter `paths` den Ordner `src` ein.
      - type: command
        run: "! grep -rq 'phpstan-ignore' src && ! grep -q 'ignoreErrors' phpstan.neon"
        message: Behebe die Fehler im Code statt sie mit @phpstan-ignore oder ignoreErrors zu verstecken.
      - type: command
        run: phpstan analyse --no-progress --level 8 -c phpstan.neon
        message: PHPStan meldet auf Level 8 noch Fehler. Lies die Meldungen und behebe sie Zeile für Zeile.
      - type: command
        run: "php -r 'require \"src/UserDirectory.php\"; $d = new App\\UserDirectory(); $d->add(\"a\", \"ada\"); echo $d->greeting(\"a\"), \"|\", $d->greeting(\"x\"), \"|\", $d->count(); $d->remove(\"a\"); echo \"|\", $d->count();'"
        stdout_equals: "Hallo ADA|Hallo Gast|1|0"
        message: "Das Verhalten stimmt noch nicht: greeting() soll für eine unbekannte ID \"Hallo Gast\" liefern, und remove() muss den Eintrag wirklich entfernen."
    hints:
      - "Die phpstan.neon beginnt mit `parameters:`, darunter eingerückt `level: 8` und `paths:` mit `- src`."
      - "Der Tippfehler steckt in `remove()`: Die Eigenschaft heißt `$names`. Für `count()` passt der Rückgabetyp `int`."
      - "In `greeting()` hilft der Null-Coalescing-Operator: `$this->find($id) ?? 'Gast'` – aber nur der Name kommt in `strtoupper()`, `Gast` bleibt so."
    solution: |
      ```bash
      cd phpstan-level-8
      cat > phpstan.neon <<'EOF'
      parameters:
          level: 8
          paths:
              - src
      EOF
      phpstan analyse
      sed -i 's/unset(\$this->name\[\$id\]);/unset($this->names[$id]);/' src/UserDirectory.php
      sed -i 's/public function count()$/public function count(): int/' src/UserDirectory.php
      sed -i 's|    public function initials(array \$ids): array|    /**\n     * @param list<string> $ids\n     * @return list<string>\n     */\n    public function initials(array $ids): array|' src/UserDirectory.php
      sed -i "s|return 'Hallo ' . strtoupper(\$this->find(\$id));|\$name = \$this->find(\$id);\n\n        return \$name === null ? 'Hallo Gast' : 'Hallo ' . strtoupper(\$name);|" src/UserDirectory.php
      phpstan analyse
      ```
  - id: level-reihenfolge
    type: order
    title: Welche Prüfung kommt auf welchem Level dazu?
    description: Bringe die Prüfungen in die Reihenfolge, in der sie beim Hochstufen von Level 0 nach Level 10 hinzukommen.
    items:
      - "Unbekannte Klassen, Methoden von $this, falsche Anzahl an Argumenten (0)"
      - "Rückgabetypen und Typen von Eigenschaften (3)"
      - "Typen der übergebenen Argumente (5)"
      - "Fehlende Typangaben (6)"
      - "Zugriffe und Übergaben bei nullable Typen (8)"
      - "Strenger Umgang mit mixed (9 und 10)"
    hints:
      - Je weiter unten, desto mehr verlangt PHPStan von deinen Typangaben.
---
Eine Methode gibt manchmal `null` zurück, und drei Dateien weiter wird das Ergebnis an `strtoupper()`
übergeben. Im Test mit Beispieldaten passiert nichts. In Produktion fragt jemand nach einer unbekannten ID –
und die Seite stürzt ab. Genau solche Fehler findet [[phpstan|PHPStan]], bevor der Code überhaupt läuft.

## Was PHPStan macht

PHPStan ist ein Werkzeug für [[statische-analyse|statische Analyse]]. Es liest deinen Code, baut daraus ein
Modell aller Klassen, Methoden und [[datentyp|Typen]] und verfolgt für jede Variable, welche Werte an welcher
Stelle möglich sind. Ausgeführt wird dabei nichts.

```bash title="Terminal – Installation im Projekt"
composer require --dev phpstan/phpstan
./vendor/bin/phpstan analyse src --level 5
```

Eine Meldung sieht so aus:

```text title="Ausgabe"
 ------ ---------------------------------------------------------------
  Line   src/UserDirectory.php
 ------ ---------------------------------------------------------------
  24     Parameter #1 $string of function strtoupper expects string,
         string|null given.
         🪪  argument.type
 ------ ---------------------------------------------------------------
 [ERROR] Found 1 error
```

Du bekommst Datei, Zeile, eine Beschreibung und einen **Identifier** wie `argument.type`. Den Identifier
brauchst du, um gezielt nachzulesen oder eine Ausnahme zu formulieren.

## Die Level 0 bis 10

PHPStan ist nicht „an“ oder „aus“, sondern hat [[phpstan-level|Level]]. Jedes Level enthält alle Prüfungen der
niedrigeren und fügt neue hinzu:

| Level | Was dazukommt |
|---|---|
| 0 | Unbekannte Klassen und Funktionen, falsche Anzahl an Argumenten, nie definierte Variablen |
| 1 | Möglicherweise undefinierte Variablen, magische Methoden und Eigenschaften |
| 2 | Unbekannte Methoden auf allen Ausdrücken, PHPDoc wird geprüft |
| 3 | Rückgabetypen und Typen von Eigenschaften |
| 4 | Toter Code, z. B. Bedingungen, die immer falsch sind |
| 5 | Typen der übergebenen Argumente |
| 6 | Fehlende Typangaben |
| 7 | Teilweise falsche Union-Typen |
| 8 | Methodenaufrufe und Übergaben bei nullable Typen |
| 9 | Strenger Umgang mit ausdrücklichem `mixed` |
| 10 | Auch fehlende Typen werden wie `mixed` streng behandelt |

`--level max` steht immer für das höchste Level. Das klingt verlockend, ist aber tückisch: Bringt ein
PHPStan-Update ein neues Level, wird deine Pipeline plötzlich rot.

> [!MERKSATZ]
> Neue Projekte starten auf einem hohen Level (8 oder mehr) und bleiben dort. Bestehende Projekte starten
> niedrig und arbeiten sich Level für Level nach oben.

## Die Konfiguration: phpstan.neon

Statt Pfade und Level jedes Mal einzutippen, legst du eine `phpstan.neon` an. [[neon|NEON]] ist ein Format,
das fast wie YAML aussieht:

```neon title="phpstan.neon"
parameters:
    level: 8
    paths:
        - src
        - tests
    excludePaths:
        - src/Legacy/generated
```

Danach genügt `./vendor/bin/phpstan analyse`. PHPStan findet die Datei automatisch im aktuellen Ordner.
Für Laravel-Projekte gibt es die Erweiterung [Larastan](https://github.com/larastan/larastan), die PHPStan die
„Magie“ von Eloquent und Facades erklärt – ohne sie meldet PHPStan dort viele falsche Fehler.

> [!FEHLER]
> NEON ist wie YAML einrückungsempfindlich. Steht `level: 8` nicht eingerückt unter `parameters:`, ignoriert
> PHPStan es oder bricht mit „Invalid configuration“ ab. Achte auf vier Leerzeichen und den Bindestrich vor jedem Pfad.

## Fehler richtig beheben

Für jede Meldung gibt es drei mögliche Ursachen:

1. **Echter Fehler** – ein Tippfehler wie `$this->name` statt `$this->names`. Beheben.
2. **Fehlende Information** – PHP kennt nur `array`, PHPStan will wissen, *was* darin steckt. Ergänze einen
   [[docblock|PHPDoc-Block]] mit einem genaueren Typ wie `list<string>` oder `array<string, int>`.
3. **Unbehandelter Fall** – `find()` kann `null` liefern, `greeting()` tut so, als ginge das nicht. Entscheide
   fachlich, was passieren soll.

```php title="Vorher → nachher"
// vorher: string|null landet in strtoupper()
return 'Hallo ' . strtoupper($this->find($id));

// nachher: der null-Fall ist entschieden
$name = $this->find($id);

return $name === null ? 'Hallo Gast' : 'Hallo ' . strtoupper($name);
```

Nur wenn PHPStan nachweislich irrt, ist eine Ausnahme erlaubt – mit Identifier und Begründung:
`// @phpstan-ignore argument.type (Wert wird vorher vom Validator garantiert)`.

> [!PRAXIS]
> In Teams gilt oft: Jeder `@phpstan-ignore` wird im Code-Review begründet. So bleibt die Ausnahme eine
> Ausnahme und wird nicht zum Werkzeug, um die Pipeline grün zu bekommen.

## Zusammenfassung

- PHPStan findet Typfehler, ohne den Code auszuführen, und nennt Datei, Zeile und einen Identifier.
- Die **Level 0 bis 10** bauen aufeinander auf; `max` ist immer das höchste und kann bei Updates überraschen.
- Die `phpstan.neon` legt Level, Pfade und Ausnahmen fest und gehört ins Repository.
- Fehler behebst du im Code: Tippfehler korrigieren, Typen mit PHPDoc präzisieren, `null`-Fälle entscheiden.
- `@phpstan-ignore` nur mit Identifier und Begründung – nie, um eine Meldung loszuwerden, die du nicht verstehst.
