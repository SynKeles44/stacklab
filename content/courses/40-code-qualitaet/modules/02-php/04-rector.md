---
title: Automatisch umbauen mit Rector
summary: Wie Rector PHP-Code automatisch modernisiert und verbessert, wie du rector.php mit PHP-Sets und vorbereiteten Regelsätzen konfigurierst und Änderungen sicher mit dry-run prüfst.
duration: 25
sources:
  - title: Rector – Documentation
    url: https://getrector.com/documentation
  - title: Rector – Set Lists
    url: https://getrector.com/documentation/set-lists
  - title: Rector – Levels
    url: https://getrector.com/documentation/levels
  - title: Rector – Find Rules
    url: https://getrector.com/find-rule
quiz:
  - type: single
    question: Was unterscheidet Rector von einem Formatter wie Pint?
    options:
      - Rector ändert die Struktur des Codes – z. B. alte Sprachfeatures durch neue ersetzen –, ein Formatter nur das Aussehen.
      - Rector ist nur für JavaScript.
      - Rector prüft nur und ändert nie etwas.
      - Es gibt keinen Unterschied.
    answer: 0
    explanation: Rector arbeitet auf dem Syntaxbaum und kann Code umbauen, Typen ergänzen oder toten Code entfernen. Den Stil danach übernimmt der Formatter.
  - type: match
    question: Ordne jede Umformung der passenden Rector-Regel zu.
    pairs:
      - { left: "array(1, 2) → [1, 2]", right: "LongArrayToShortArrayRector" }
      - { left: "isset($a[0]) ? $a[0] : null → $a[0] ?? null", right: "TernaryToNullCoalescingRector" }
      - { left: "Eigenschaft + Zuweisung im Konstruktor → Constructor Promotion", right: "ClassPropertyAssignToConstructorPromotionRector" }
    explanation: Jede Regel ist eine kleine, genau beschriebene Umformung. Rector listet nach jedem Lauf auf, welche Regeln gegriffen haben.
  - type: multiple
    question: Welche Aussagen über `rector process --dry-run` stimmen?
    options:
      - Es zeigt die Änderungen als Diff, ohne Dateien zu verändern.
      - Es endet mit einem Exit-Code ungleich 0, wenn es etwas ändern würde.
      - Es eignet sich für die CI-Pipeline.
      - Es installiert Rector.
    answers: [0, 1, 2]
    explanation: Der dry-run ist der Prüfmodus von Rector. In der CI macht er sichtbar, dass jemand vergessen hat, Rector lokal laufen zu lassen.
  - type: cloze
    text: "Nach Rector lässt du immer noch den ___ laufen, weil Rector sich nicht um den Code-Stil kümmert."
    blanks:
      - [Formatter, Pint, pint]
    explanation: Rector erzeugt korrekten, aber nicht unbedingt schön formatierten Code. Die Reihenfolge ist Rector → Pint.
tasks:
  - id: rector-modernisieren
    type: terminal
    title: Alten Code mit Rector modernisieren
    description: |
      Im Ordner `rector-modernisieren` liegt ein Composer-Projekt mit altem PHP-Code in `src/`.

      1. Installiere Rector als Entwicklungsabhängigkeit: `composer require --dev rector/rector`
         (das dauert einen Moment – Composer lädt das Paket aus Packagist).
      2. Lege eine `rector.php` an, die den Ordner `src` bearbeitet, die PHP-Sets für die Version aus der
         `composer.json` aktiviert (`withPhpSets()`) und die vorbereiteten Sets `deadCode`, `codeQuality` und
         `typeDeclarations` einschaltet.
      3. Sieh dir die Änderungen mit `vendor/bin/rector process --dry-run` an.
      4. Wende sie mit `vendor/bin/rector process` an und formatiere danach mit `pint src`.
      5. Ein zweiter `--dry-run` muss jetzt „no changes“ melden.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: rector-modernisieren
    setup: |
      cat > composer.json <<'EOF'
      {
          "name": "stacklab/rector-uebung",
          "type": "project",
          "require": {
              "php": "^8.4"
          },
          "autoload": {
              "psr-4": { "App\\": "src/" }
          }
      }
      EOF
      mkdir -p src
      cat > src/PriceList.php <<'EOF'
      <?php

      namespace App;

      class PriceList
      {
          private $prices;
          private $currency;

          public function __construct($prices, $currency)
          {
              $this->prices = $prices;
              $this->currency = $currency;
          }

          public function first()
          {
              return isset($this->prices[0]) ? $this->prices[0] : null;
          }

          public function labels()
          {
              $labels = array();
              foreach ($this->prices as $price) {
                  $labels[] = $price . ' ' . $this->currency;
              }
              return $labels;
          }

          public function isEmpty()
          {
              if (count($this->prices) === 0) {
                  return true;
              } else {
                  return false;
              }
          }
      }
      EOF
    checks:
      - type: command
        run: test -x vendor/bin/rector && jq -e '."require-dev"."rector/rector"' composer.json
        message: Rector ist noch nicht installiert. Führe composer require --dev rector/rector aus.
      - type: file_contains
        path: rector.php
        pattern: "withPaths\\("
        message: In der rector.php fehlt withPaths() mit dem Ordner src.
      - type: file_contains
        path: rector.php
        pattern: "withPhpSets\\("
        message: Aktiviere in der rector.php die PHP-Sets mit withPhpSets().
      - type: file_contains
        path: rector.php
        pattern: "deadCode:\\s*true"
        message: "Schalte in withPreparedSets() deadCode ein (deadCode: true)."
      - type: command
        run: vendor/bin/rector process --dry-run --no-progress-bar
        message: Rector würde noch Dateien ändern. Führe vendor/bin/rector process ohne --dry-run aus.
      - type: file_contains
        path: src/PriceList.php
        pattern: "__construct\\(\\s*private"
        message: src/PriceList.php ist noch nicht umgebaut (Constructor Promotion fehlt). Hast du rector process ausgeführt?
      - type: command
        run: pint --test src
        message: Nach Rector fehlt noch der Formatter – führe pint src aus.
      - type: command
        run: "php -r 'require \"src/PriceList.php\"; $p = new App\\PriceList([3, 5], \"EUR\"); echo $p->first(), \"|\", implode(\",\", $p->labels()), \"|\", var_export($p->isEmpty(), true);'"
        stdout_equals: "3|3 EUR,5 EUR|false"
        message: Das Verhalten der Klasse hat sich verändert. Setze die Aufgabe zurück und lass nur Rector und Pint arbeiten.
    hints:
      - "Die rector.php beginnt mit `<?php`, dann `use Rector\\Config\\RectorConfig;` und `return RectorConfig::configure()`."
      - "Die vorbereiteten Sets: `->withPreparedSets(deadCode: true, codeQuality: true, typeDeclarations: true)`."
      - "Reihenfolge: `vendor/bin/rector process`, dann `pint src`, dann `vendor/bin/rector process --dry-run`."
    solution: |
      ```bash
      cd rector-modernisieren
      composer require --dev rector/rector
      cat > rector.php <<'EOF'
      <?php

      declare(strict_types=1);

      use Rector\Config\RectorConfig;

      return RectorConfig::configure()
          ->withPaths([__DIR__ . '/src'])
          ->withPhpSets()
          ->withPreparedSets(deadCode: true, codeQuality: true, typeDeclarations: true);
      EOF
      vendor/bin/rector process --dry-run
      vendor/bin/rector process
      pint src
      vendor/bin/rector process --dry-run
      ```
  - id: rector-reihenfolge
    type: order
    title: Rector sicher in einem Projekt einsetzen
    description: Bringe die Schritte in eine sinnvolle Reihenfolge.
    items:
      - Arbeitsstand committen, damit du jede Änderung im Diff siehst
      - Ein einzelnes Set in der rector.php einschalten
      - "rector process --dry-run ausführen und den Diff lesen"
      - rector process ausführen
      - Mit Pint formatieren
      - Tests und PHPStan laufen lassen
      - Änderungen als eigenen Commit speichern
    hints:
      - Vor einer automatischen Massenänderung willst du einen sauberen Ausgangspunkt.
      - Erst ansehen, dann anwenden, dann prüfen.
---
Dein Projekt läuft auf PHP 8.5, aber der Code sieht aus wie 2015: `array()` statt `[]`, Eigenschaften, die
im Konstruktor einzeln zugewiesen werden, `isset() ? : null` statt `??`. Von Hand umbauen hieße, hunderte
Dateien zu öffnen. [[rector|Rector]] erledigt das in Sekunden – und zwar zuverlässig gleich.

## Was Rector macht

Rector ist ein Werkzeug für automatisches [[refactoring|Refactoring]]. Es liest deinen Code in einen
[[abstrakter-syntaxbaum|abstrakten Syntaxbaum]] ein – eine Baumstruktur aus Klassen, Methoden, Ausdrücken –,
wendet darauf **Regeln** an und schreibt den veränderten Code zurück.

Anders als ein [[formatter|Formatter]] ändert Rector die **Struktur**:

```php title="Vorher"
class PriceList
{
    private $prices;

    public function __construct($prices)
    {
        $this->prices = $prices;
    }

    public function first()
    {
        return isset($this->prices[0]) ? $this->prices[0] : null;
    }
}
```

```php title="Nachher"
class PriceList
{
    public function __construct(private $prices)
    {
    }

    public function first()
    {
        return $this->prices[0] ?? null;
    }
}
```

Die Bedeutung bleibt gleich – der Code ist kürzer und moderner. Jede Regel ist eine kleine, getestete Umformung
mit einem Namen wie `TernaryToNullCoalescingRector`.

Rector kennt mehrere hundert solcher Regeln: für neue PHP-Versionen, für Typangaben, gegen toten Code, aber
auch für Framework-Upgrades wie von einer Laravel- oder PHPUnit-Version zur nächsten. Welche es gibt, findest
du in der Regelsuche auf der Rector-Website. Nach jedem Lauf listet Rector auf, welche Regeln gegriffen haben –
so verstehst du jede Änderung und kannst sie im Review erklären.

## Installation und rector.php

Rector installierst du pro Projekt als Entwicklungsabhängigkeit:

```bash title="Terminal"
composer require --dev rector/rector
vendor/bin/rector     # ohne Konfiguration bietet Rector an, eine rector.php anzulegen
```

Die Konfiguration ist PHP-Code mit einer verketteten Schreibweise:

```php title="rector.php"
<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;

return RectorConfig::configure()
    ->withPaths([__DIR__ . '/src', __DIR__ . '/tests'])
    ->withPhpSets()
    ->withPreparedSets(deadCode: true, codeQuality: true, typeDeclarations: true);
```

| Methode | Wirkung |
|---|---|
| `withPaths()` | Welche Ordner Rector bearbeitet |
| `withPhpSets()` | Alle Regeln, um Code auf die PHP-Version aus der `composer.json` zu bringen |
| `withPreparedSets()` | Fertige [[regelsatz\|Regelsätze]], z. B. `deadCode`, `codeQuality`, `typeDeclarations` |
| `withSkip()` | Regeln oder Pfade ausnehmen |

`withPhpSets()` ohne Argument liest die PHP-Version aus `require.php` in der [[composer-json|composer.json]].
Alternativ gibst du sie fest vor, z. B. `withPhpSets(php84: true)`.

## Prüfen mit dry-run

Rector ändert viele Dateien auf einmal. Deshalb gibt es den Prüfmodus [[dry-run|dry-run]]:

```bash title="Terminal"
vendor/bin/rector process --dry-run
# 1 file with changes
# ---------- begin diff ----------
# -        return isset($this->prices[0]) ? $this->prices[0] : null;
# +        return $this->prices[0] ?? null;
# Applied rules:
#  * TernaryToNullCoalescingRector
echo $?   # 2 → Rector würde etwas ändern

vendor/bin/rector process    # jetzt wirklich ändern
```

Der Exit-Code ist ungleich 0, solange Rector etwas ändern würde. So kann die CI-Pipeline prüfen, dass niemand
vergessen hat, Rector laufen zu lassen.

> [!FEHLER]
> Rector auf ein Projekt mit uncommitteten Änderungen loslassen. Danach weißt du nicht mehr, was von dir und
> was von Rector stammt. **Erst committen**, dann Rector – dann ist jede automatische Änderung ein eigener,
> gut lesbarer Diff.

## Rector, Pint und PHPStan zusammen

Die drei PHP-Werkzeuge greifen ineinander:

1. **Rector** baut den Code um.
2. **Pint** bringt das Ergebnis in den Projektstil – Rector kümmert sich nicht um Leerzeilen und Einrückung.
3. **PHPStan** und die Tests prüfen, dass alles noch stimmt.

> [!MERKSATZ]
> Rector → Pint → PHPStan. Erst umbauen, dann formatieren, dann prüfen.

Gerade die Sets `typeDeclarations` und `deadCode` machen den Code für PHPStan besser lesbar: Rector ergänzt
Rückgabetypen, die sich sicher ableiten lassen, und entfernt unerreichbaren Code.

> [!PRAXIS]
> Bei großen Projekten schaltet man Sets **einzeln** ein: ein Set, ein Pull Request, ein Review. Für einige
> Sets gibt es Level-Methoden wie `withTypeCoverageLevel(0)`, die Regel für Regel freischalten – du erhöhst
> die Zahl schrittweise.

## Zusammenfassung

- **Rector** baut PHP-Code automatisch um – moderne Syntax, Typen, weniger toter Code.
- Konfiguriert wird mit `rector.php`: `withPaths()`, `withPhpSets()`, `withPreparedSets()`.
- `rector process --dry-run` zeigt den Diff und endet mit Fehlercode, wenn es etwas ändern würde.
- Vor Rector immer committen, damit die automatischen Änderungen ein eigener Diff sind.
- Reihenfolge: Rector → Pint → PHPStan und Tests.
