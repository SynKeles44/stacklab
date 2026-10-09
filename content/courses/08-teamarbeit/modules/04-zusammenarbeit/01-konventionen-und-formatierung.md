---
title: Coding-Konventionen und automatische Formatierung
summary: Warum Teams gemeinsame Regeln für Stil und Namen brauchen – PSR-12, PER Coding Style, strict_types – und wie Pint, Linter und .editorconfig sie automatisch durchsetzen.
duration: 25
sources:
  - title: PHP-FIG – PSR-12 Extended Coding Style
    url: https://www.php-fig.org/psr/psr-12/
  - title: PHP-FIG – PER Coding Style
    url: https://www.php-fig.org/per/coding-style/
  - title: PHP-Handbuch – Strikte Typisierung
    url: https://www.php.net/manual/de/language.types.declarations.php#language.types.declarations.strict
  - title: Laravel Docs – Pint
    url: https://laravel.com/docs/13.x/pint
  - title: EditorConfig
    url: https://editorconfig.org/
quiz:
  - type: match
    question: Ordne jedem Bezeichner die übliche PHP-Konvention zu.
    pairs:
      - { left: "Klasse", right: "PascalCase, z. B. OrderService" }
      - { left: "Methode und Variable", right: "camelCase, z. B. calculateTotal" }
      - { left: "Klassenkonstante", right: "UPPER_SNAKE_CASE, z. B. MAX_ITEMS" }
    explanation: Diese Schreibweisen empfehlen PSR-1 und PSR-12 bzw. sind in PHP-Projekten allgemein üblich.
  - type: find-bug
    question: In dieser Datei ist `strict_types` aktiv. In welcher Zeile tritt beim Ausführen ein TypeError auf?
    language: php
    code: |
      <?php

      declare(strict_types=1);

      function addTax(int $cents): int
      {
          return (int) round($cents * 1.19);
      }

      echo addTax("1000");
    bug_line: 10
    explanation: Mit strict_types wandelt PHP den String "1000" nicht automatisch in einen int um. Der Aufruf wirft einen TypeError – ein Fehler, der sonst unbemerkt bliebe.
  - type: match
    question: Welches Werkzeug macht was?
    pairs:
      - { left: "Formatter (z. B. Pint, Prettier)", right: "Schreibt den Code automatisch in den vereinbarten Stil um" }
      - { left: "Linter (z. B. ESLint, PHPStan)", right: "Findet verdächtige Stellen und mögliche Fehler" }
      - { left: ".editorconfig", right: "Stellt Editoren auf Einrückung, Zeilenenden und Zeichensatz ein" }
    explanation: Formatter ändern das Aussehen, Linter suchen Probleme, EditorConfig sorgt schon beim Tippen für die Grundeinstellungen.
  - type: single
    question: Was bewirkt `pint --test`?
    options:
      - Pint prüft nur und meldet Abweichungen mit einem Fehler-Exit-Code, ohne Dateien zu ändern
      - Pint führt die PHPUnit-Tests aus
      - Pint formatiert alle Dateien und committet sie
    answer: 0
    explanation: Der Testmodus eignet sich für CI und Git-Hooks – er ändert nichts, schlägt aber fehl, wenn etwas nicht dem Stil entspricht.
  - type: cloze
    text: "Laravel Pint nutzt ohne Konfiguration das Preset `___`. In einer `pint.json` kannst du z. B. `{\"preset\": \"psr12\"}` einstellen."
    blanks:
      - [laravel]
    explanation: Weitere Presets sind unter anderem psr12, per und symfony.
tasks:
  - id: konventionen-anwenden
    type: code
    language: php
    title: Code nach Team-Konvention schreiben
    description: |
      Im Team gilt: Klassen in PascalCase, Methoden in camelCase, Konstanten in UPPER_SNAKE_CASE,
      Typangaben für alle Parameter und Rückgaben, Beträge in Cent als `int`.

      Schreibe die Klasse `PriceCalculator` mit

      - der Konstante `DEFAULT_TAX_RATE` mit dem Wert `19`,
      - der Methode `netFromGross(int $grossCents, int $taxRate = self::DEFAULT_TAX_RATE): int`, die aus
        einem Bruttobetrag den Nettobetrag berechnet und auf ganze Cent rundet:
        `round($grossCents * 100 / (100 + $taxRate))`.
    starter: |
      <?php

      class PriceCalculator
      {
          // Konstante und Methode ergänzen
      }
    tests:
      - name: Konstante ist richtig benannt
        code: |
          assert_same(19, PriceCalculator::DEFAULT_TAX_RATE);
      - name: Normalfall mit 19 Prozent
        code: |
          assert_same(10000, (new PriceCalculator())->netFromGross(11900));
      - name: Null Cent bleiben null
        code: |
          assert_same(0, (new PriceCalculator())->netFromGross(0));
      - name: Ermäßigter Satz und Rundung
        code: |
          $calc = new PriceCalculator();
          assert_same(10000, $calc->netFromGross(10700, 7));
          assert_same(84, $calc->netFromGross(100));
    hints:
      - "Eine Klassenkonstante schreibst du als `public const DEFAULT_TAX_RATE = 19;`."
      - "`round()` liefert einen float – wandle das Ergebnis mit `(int)` in einen int um."
    solution: |
      <?php

      class PriceCalculator
      {
          public const DEFAULT_TAX_RATE = 19;

          public function netFromGross(int $grossCents, int $taxRate = self::DEFAULT_TAX_RATE): int
          {
              return (int) round($grossCents * 100 / (100 + $taxRate));
          }
      }
  - id: pint-einrichten
    type: terminal
    title: Pint mit PSR-12 einrichten
    description: |
      Im Ordner `m4-pint` liegt ein kleines PHP-Projekt. Die Datei `src/Cart.php` ist uneinheitlich
      formatiert. Euer Team hat sich auf PSR-12 geeinigt. Pint ist im Übungs-Terminal bereits installiert.

      1. Lege im Projektordner eine `pint.json` an, die das Preset `psr12` einstellt.
      2. Prüfe mit `pint --test`, was nicht passt.
      3. Formatiere den Code mit `pint`.
      4. Committe `pint.json` und die formatierte Datei mit einer Message vom Typ `style` oder `chore`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: m4-pint
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p src
      cat > src/Cart.php <<'PHP'
      <?php
      namespace App;
      class  Cart{
      private array $items=[];
      function add( string $sku,int $priceInCents ){ $this->items[$sku]=$priceInCents ;}
      public function total():int{
      return array_sum( $this->items );
      }
      }
      PHP
      git add . && git commit -q -m "feat(SHOP-60): add cart"
    checks:
      - type: command
        run: jq -r .preset pint.json
        stdout_equals: psr12
        message: "Es fehlt eine pint.json mit `{\"preset\": \"psr12\"}`."
      - type: command
        run: pint --test >/dev/null 2>&1 && echo ok
        stdout_equals: ok
        message: "`pint --test` meldet noch Stilfehler. Führe `pint` aus."
      - type: command
        run: git status --porcelain | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Es gibt noch nicht committete Änderungen. Committe pint.json und src/Cart.php.
      - type: command
        run: git log -1 --format=%s
        stdout_matches: "^(style|chore)(\\([^)]+\\))?: \\S"
        message: Der letzte Commit soll eine Message vom Typ `style:` oder `chore:` haben.
      - type: command
        run: git ls-files pint.json
        stdout_equals: pint.json
        message: pint.json ist noch nicht im Repository.
    hints:
      - "`echo '{\"preset\": \"psr12\"}' > pint.json` legt die Konfiguration an."
      - "Erst `pint --test` (nur prüfen), dann `pint` (korrigieren), dann `git add -A` und committen."
    solution: |
      ```bash
      cd m4-pint
      echo '{"preset": "psr12"}' > pint.json
      pint --test
      pint
      git add pint.json src/Cart.php
      git commit -m "style: format code with pint psr12 preset"
      ```
---

Öffne eine Datei, und die Klammern stehen mal hinter der Funktion, mal darunter. Mal heißt es `$userId`,
mal `$user_id`, mal `$uid`. Im Review gibt es drei Kommentare zu Leerzeichen – und der echte Logikfehler
geht unter. Gemeinsame Konventionen und Werkzeuge, die sie automatisch durchsetzen, lösen beides.

## Warum Konventionen?

Code wird viel öfter gelesen als geschrieben. Folgen alle denselben Regeln, erkennt dein Gehirn Muster
sofort und kann sich auf den Inhalt konzentrieren. Ein [[styleguide|Styleguide]] ist das Regelwerk dafür.

| Ohne Konventionen | Mit Konventionen |
|---|---|
| Jede Datei sieht anders aus | Code wirkt wie aus einer Hand |
| Reviews drehen sich um Klammern | Reviews drehen sich um Logik |
| Diffs voller Formatierungsänderungen | Diffs zeigen nur echte Änderungen |

> [!MERKSATZ]
> Welche Regel genau gilt, ist weniger wichtig, als **dass** alle dieselbe befolgen – und dass ein Werkzeug
> sie prüft statt eines Menschen.

## PSR-12, PER und strict_types

Für PHP beschreibt [[psr-12|PSR-12]] einen verbreiteten Code-Stil; sein Nachfolger
[[per-coding-style|PER Coding Style]] ergänzt neuere Sprachmerkmale. Typische Regeln: 4 Leerzeichen
Einrückung, die Klammer von Klassen und Methoden auf eigener Zeile, bei `if` und `foreach` auf derselben,
Sichtbarkeit bei jeder Methode.

```php title="PSR-12-konform mit strict_types"
<?php

declare(strict_types=1);

namespace App\Shop;

final class OrderService
{
    public function total(array $items): int
    {
        if ($items === []) {
            return 0;
        }

        return array_sum(array_column($items, 'priceInCents'));
    }
}
```

`declare(strict_types=1);` schaltet die [[strict-types|strikte Typprüfung]] ein: Ein String, wo ein `int`
erwartet wird, löst einen `TypeError` aus, statt still umgewandelt zu werden. Die Zeile muss die erste
Anweisung sein und gilt nur für ihre Datei – deshalb steht sie in Teams meist in **jeder** Datei.

## Namenskonventionen

Eine [[namenskonvention|Namenskonvention]] legt fest, wie Dinge heißen:

| Was | Schreibweise | Beispiel |
|---|---|---|
| Klasse, Interface | PascalCase | `InvoiceRepository` |
| Methode, Variable | camelCase | `findOpenOrders`, `$totalInCents` |
| Konstante | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

Dazu kommen Team-Regeln: Namen auf Englisch, sprechend statt abgekürzt (`$customer` statt `$c`), Einheiten
im Namen (`$timeoutInSeconds`), Wahrheitswerte mit `is`/`has` (`$isPaid`). Festgehalten wird das alles in
einer `CONTRIBUTING.md`.

## Werkzeuge setzen den Stil durch

Ein [[formatter|Formatter]] schreibt Code automatisch im vereinbarten Stil neu – die Logik bleibt gleich.
Für PHP gibt es [[pint|Laravel Pint]], für JavaScript Prettier. Ein [[linter|Linter]] sucht dagegen nach
verdächtigem Code. Pint nutzt ohne Konfiguration das Preset `laravel`; andere stellst du in `pint.json` ein:

```bash title="Pint im Alltag"
echo '{"preset": "psr12"}' > pint.json
pint --test   # nur prüfen, Exit-Code 1 bei Abweichungen
pint          # Dateien korrigieren
```

Die Datei `.editorconfig` ([[editorconfig|EditorConfig]]) stellt zusätzlich jeden Editor auf Einrückung,
Zeilenenden und Zeichensatz ein. `pint --test` läuft in Teams im Pre-Commit-[[git-hook|Hook]] und als
Pflicht-Check in der [[ci-pipeline|CI-Pipeline]].

> [!FEHLER]
> **Formatierung und Feature in einem Pull Request.** Wer nebenbei 40 Dateien umformatiert, versteckt die
> eigentliche Änderung. Führt ein Team einen Formatter ein, gehört das in **einen** eigenen Commit, dessen
> Hash in `.git-blame-ignore-revs` landet, damit `git blame` ihn überspringt.

> [!PRAXIS]
> Taucht im Review derselbe Stilkommentar zum zweiten Mal auf, ist das ein Signal: Diese Regel gehört in
> die Formatter- oder Linter-Konfiguration, nicht in die Köpfe der Reviewer:innen.

## Zusammenfassung

- Konventionen lassen Code wie aus einer Hand wirken und entlasten Reviews.
- PSR-12 und PER Coding Style sind verbreitete PHP-Standards; `declare(strict_types=1);` gehört in jede Datei.
- Klassen in PascalCase, Methoden und Variablen in camelCase, Konstanten in UPPER_SNAKE_CASE.
- Formatter wie Pint setzen den Stil automatisch durch; `pint --test` prüft in Hook und CI.
- Formatierung kommt in eigene Commits, nie gemischt mit Features.
