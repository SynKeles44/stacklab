---
title: Code-Qualität – Pint, PHPStan und Tests
summary: Einheitlicher Code-Stil mit Pint, Fehler finden ohne Ausführen mit PHPStan und Verhalten absichern mit PHPUnit oder Pest.
duration: 25
sources:
  - title: PHP-FIG – PER Coding Style
    url: https://www.php-fig.org/per/coding-style/
  - title: Laravel Pint – Dokumentation
    url: https://laravel.com/docs/pint
  - title: PHPStan – Rule Levels
    url: https://phpstan.org/user-guide/rule-levels
  - title: PHPStan – PHPDoc-Typen
    url: https://phpstan.org/writing-php-code/phpdoc-types
  - title: PHPUnit – Dokumentation
    url: https://docs.phpunit.de/
  - title: Pest – Dokumentation
    url: https://pestphp.com/docs/installation
quiz:
  - type: match
    question: Ordne jedem Werkzeug seine Aufgabe zu.
    pairs:
      - { left: "Pint", right: "formatiert Code nach einem einheitlichen Stil" }
      - { left: "PHPStan", right: "findet Typfehler, ohne den Code auszuführen" }
      - { left: "PHPUnit / Pest", right: "führt Tests aus und prüft das Verhalten" }
      - { left: "composer.lock", right: "hält die exakten Paketversionen fest" }
    explanation: >
      Die drei Werkzeuge ergänzen sich: Stil, Typen und Verhalten. Keines ersetzt die anderen.
  - type: single
    question: "PHPStan meldet `Parameter #1 $cent of method formatiere() expects int, int|null given.` Was ist die beste Reaktion?"
    options:
      - Den Fall null bewusst behandeln, etwa mit einer Exception oder einem Standardwert.
      - Das Level von PHPStan senken, bis die Meldung verschwindet.
      - Die Meldung in eine Baseline schreiben und vergessen.
      - strict_types entfernen.
    answer: 0
    explanation: >
      PHPStan hat einen echten Fall gefunden: Ein unbekannter Artikel liefert null. Wer das Level senkt, versteckt
      den Fehler nur. Baselines sind für Altlasten gedacht, nicht für neuen Code.
  - type: cloze
    text: "Mit `pint ___` prüfst du nur, ohne Dateien zu ändern. PHPStan startest du mit `phpstan ___ src`."
    blanks:
      - ["--test"]
      - [analyse, analyze]
    explanation: >
      `pint --test` endet mit einem Fehler-Exit-Code, wenn der Stil nicht passt – ideal für die CI. Ohne `--test`
      korrigiert Pint die Dateien direkt.
  - type: multiple
    question: Welche Aussagen über Tests stimmen?
    options:
      - Ein Unit-Test prüft eine kleine Einheit, etwa eine Klasse, ohne Datenbank oder Netzwerk.
      - "`assertSame` vergleicht Wert und Typ, wie `===`."
      - Wenn PHPStan keine Fehler meldet, braucht man keine Tests.
      - Pest ist ein Aufsatz auf PHPUnit mit kürzerer Schreibweise.
    answers: [0, 1, 3]
    explanation: >
      PHPStan prüft Typen, aber nicht, ob die Rechnung stimmt. Ein Preis von 2,50 statt 25,00 Euro ist für
      PHPStan völlig in Ordnung – für deine Kunden nicht.
tasks:
  - id: preisliste-pruefen
    type: terminal
    title: Stil und Typen in Ordnung bringen
    description: |
      In einem kleinen Projekt meldet die Qualitätsprüfung Fehler. Du findest sie mit den Werkzeugen und behebst sie.

      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `qualitaet` liegt dann `src/Preisliste.php`.

      1. Führe `phpstan analyse --level=8 src` aus und lies die Meldung genau.
      2. Behebe den Fehler in `anzeigen()`: Gibt es den Artikel nicht, soll eine `InvalidArgumentException`
         geworfen werden (Tipp: `?? throw`). Für bekannte Artikel bleibt die Ausgabe gleich, z. B. `2,50 €`.
      3. Formatiere die Datei mit `pint src`.
      4. Prüfe zum Schluss: `phpstan analyse --level=8 src` und `pint --test src` melden beide keinen Fehler.
    workdir: qualitaet
    setup: |
      mkdir -p src
      cat > src/Preisliste.php <<'PHP'
      <?php
      declare(strict_types=1);

      namespace App;

      final class Preisliste
      {
          /** @param array<string, int> $preise Cent-Beträge je Artikel */
          public function __construct(private array $preise)
          {
          }

          public function preisCent(string $artikel): ?int
          {
              return $this->preise[$artikel] ?? null;
          }

          public function anzeigen(string $artikel) : string
          {
              return $this->formatiere( $this->preisCent($artikel) );
          }

          private function formatiere(int $cent): string
          {
              return number_format($cent / 100, 2, ",", ".")." €";
          }
      }
      PHP
    checks:
      - type: command
        run: phpstan analyse --level=8 src --no-progress --error-format=raw
        message: PHPStan meldet noch Fehler – behandle den Fall, dass preisCent() null liefert.
      - type: command
        run: pint --test src
        message: Der Code-Stil passt noch nicht – führe pint src aus.
      - type: command
        run: php -r 'require "src/Preisliste.php"; $p = new App\Preisliste(["brot" => 250, "kaffee" => 123456]); echo $p->anzeigen("brot"), "|", $p->anzeigen("kaffee");'
        stdout_equals: "2,50 €|1.234,56 €"
        message: Bekannte Artikel sollen weiter wie vorher angezeigt werden, z. B. 2,50 €.
      - type: command
        run: php -r 'require "src/Preisliste.php"; try { (new App\Preisliste([]))->anzeigen("kaese"); echo "keine Exception"; } catch (InvalidArgumentException $e) { echo "ok"; }'
        stdout_equals: "ok"
        message: Ein unbekannter Artikel soll eine InvalidArgumentException auslösen.
    hints:
      - "PHPStan sagt dir Zeile und Grund: `formatiere()` erwartet `int`, bekommt aber `int|null`."
      - "Hole den Wert zuerst in eine Variable: `$cent = $this->preisCent($artikel) ?? throw new \\InvalidArgumentException(\"Unbekannter Artikel: {$artikel}\");` – der Backslash ist nötig, weil die Datei im Namespace `App` liegt."
      - "Danach `pint src` ausführen. Pint korrigiert Leerzeichen, Anführungszeichen und Leerzeilen von selbst."
    solution: |
      ```php
      public function anzeigen(string $artikel): string
      {
          $cent = $this->preisCent($artikel)
              ?? throw new \InvalidArgumentException("Unbekannter Artikel: {$artikel}");

          return $this->formatiere($cent);
      }
      ```

      ```bash
      phpstan analyse --level=8 src
      pint src
      pint --test src
      ```
  - id: qualitaets-ablauf
    type: order
    title: Der Weg einer Änderung
    description: |
      Du hast eine neue Funktion geschrieben. Bring die Schritte in eine sinnvolle Reihenfolge – vom Schreiben bis
      zum Merge.
    items:
      - Code und passenden Test schreiben
      - Code mit pint formatieren
      - phpstan analyse ausführen und Typfehler beheben
      - Tests lokal laufen lassen
      - Commit erstellen und pushen
      - Die CI prüft Stil, Typen und Tests erneut
---
Dein Code läuft. Aber ist er auch lesbar für das Team, frei von versteckten Typfehlern und morgen noch korrekt,
wenn jemand etwas ändert? In professionellen PHP-Projekten beantworten drei Werkzeuge diese Fragen automatisch:
ein Formatierer, ein statischer Analysierer und ein Test-Runner. Diese Lektion zeigt dir alle drei.

## Code-Stil: ein Format für alle

Ob Klammern in eine neue Zeile gehören oder ob man `'` oder `"` schreibt, ist Geschmackssache. In einem Team
kostet Geschmack aber Zeit: Jede Code-Review diskutiert Leerzeichen statt Logik.

Deshalb gibt es einen gemeinsamen Standard: den [[per-coding-style|PER Coding Style]] der PHP-FIG, den Nachfolger
von [[psr-12|PSR-12]]. Ein [[linter|Formatierer]] setzt ihn automatisch durch. In der PHP-Welt ist das oft
[[pint|Pint]]:

```bash title="Terminal"
composer require --dev laravel/pint   # im Projekt installieren
vendor/bin/pint                       # alle Dateien formatieren
vendor/bin/pint --test                # nur prüfen, nichts ändern
vendor/bin/pint --preset=per          # strikt nach PER statt Laravel-Stil
```

Im Übungs-Terminal ist Pint global installiert, dort reicht `pint`. Ohne Konfiguration nutzt Pint den
Laravel-Stil, der auf PER aufbaut. Eine `pint.json` im Projekt legt den Stil fest.

> [!MERKSATZ]
> Stil wird nicht diskutiert, sondern automatisiert. Wer Pint vor jedem Commit laufen lässt, muss nie wieder über
> Leerzeichen streiten.

## Statische Analyse mit PHPStan

PHP prüft Typen erst zur Laufzeit – also dann, wenn die fehlerhafte Zeile tatsächlich ausgeführt wird. Das kann
Wochen dauern. [[phpstan|PHPStan]] liest deinen Code, **ohne ihn auszuführen**, und findet Fehler sofort:

```bash title="Terminal"
phpstan analyse --level=8 src
```

```text
 Line   Preisliste.php
 20     Parameter #1 $cent of method App\Preisliste::formatiere() expects int, int|null given.
```

Die Meldung heißt: `preisCent()` kann `null` liefern, `formatiere()` verträgt aber nur `int`. Für einen
unbekannten Artikel würde das Programm abstürzen – PHPStan hat den Fall gefunden, bevor ein Kunde ihn findet.

| Level | Was zusätzlich geprüft wird (Auswahl) |
|---|---|
| 0–2 | unbekannte Klassen, Methoden und Funktionen, falsche Anzahl Argumente |
| 3–5 | Rückgabetypen, Typen von Properties und Argumenten |
| 6–7 | fehlende Typangaben, teilweise falsche Union-Types |
| 8 | Umgang mit `null` |
| 9–10 | strenger Umgang mit `mixed` |

## Typen, die PHP nicht kennt

PHP kann `array` als Typ prüfen, aber nicht, **was** darin liegt. PHPStan versteht genauere Angaben in
PHPDoc-Kommentaren:

```php
/** @param array<string, int> $preise Artikelname → Cent-Betrag */
public function __construct(private array $preise) {}

/** @return list<Buch> */
public function alle(): array { /* … */ }
```

| PHPDoc-Typ | Bedeutung |
|---|---|
| `list<Buch>` | Liste mit Schlüsseln 0, 1, 2 … und nur `Buch`-Objekten |
| `array<string, int>` | Wörterbuch: Schlüssel `string`, Werte `int` |
| `non-empty-string` | String, der nicht leer ist |
| `positive-int` | Ganzzahl größer als 0 |

Für alte Projekte mit vielen Meldungen gibt es eine Baseline (`phpstan analyse --generate-baseline`). Sie friert
bestehende Fehler ein, sodass nur neue Fehler auffallen.

> [!FEHLER]
> Das Level zu senken, bis die Meldung verschwindet, behebt nichts. Die Meldung beschreibt fast immer einen
> echten Fall, den dein Code nicht behandelt.

## Tests mit PHPUnit und Pest

PHPStan weiß nicht, ob `2,50 €` richtig ist. Das prüfen [[unit-test|Unit-Tests]]. Der Standard ist
[[phpunit|PHPUnit]]:

```php
<?php
// tests/PreislisteTest.php
declare(strict_types=1);

use App\Preisliste;
use PHPUnit\Framework\TestCase;

final class PreislisteTest extends TestCase
{
    public function testZeigtEuroBetrag(): void
    {
        $liste = new Preisliste(['brot' => 250]);

        $this->assertSame('2,50 €', $liste->anzeigen('brot'));
    }

    public function testUnbekannterArtikelWirftException(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new Preisliste([]))->anzeigen('kaese');
    }
}
```

[[pest|Pest]] baut auf PHPUnit auf und ist kürzer – Laravel-Projekte nutzen es oft:

```php
it('zeigt den Euro-Betrag', function () {
    expect((new Preisliste(['brot' => 250]))->anzeigen('brot'))->toBe('2,50 €');
});
```

Installiert werden beide per `composer require --dev`, gestartet mit `vendor/bin/phpunit` oder `vendor/bin/pest`.

## Alles zusammen

Damit niemand die Befehle vergisst, legst du sie als Composer-Skript ab:

```json
"scripts": {
    "check": ["pint --test", "phpstan analyse --level=8 src", "phpunit"]
}
```

`composer check` führt dann alle drei nacheinander aus und bricht beim ersten Fehler ab. Die gleichen Befehle
laufen in der [[continuous-integration|CI]] bei jedem Push.

> [!PRAXIS]
> In vielen Teams darf ein Pull Request erst gemergt werden, wenn Stil-Prüfung, PHPStan und Tests grün sind.
> Das schützt das Projekt, auch wenn jemand unter Zeitdruck arbeitet.

## Zusammenfassung

- Pint formatiert Code nach einem festen Stil; `pint --test` prüft nur und eignet sich für die CI.
- PHPStan findet Typfehler ohne Ausführung; höhere Level prüfen strenger, Level 8 deckt `null`-Fälle auf.
- PHPDoc-Typen wie `list<Buch>` und `array<string, int>` beschreiben, was in Arrays liegt.
- Unit-Tests mit PHPUnit oder Pest prüfen das Verhalten – PHPStan ersetzt sie nicht.
- Ein Composer-Skript wie `composer check` bündelt alle Prüfungen, die CI führt sie bei jedem Push aus.
