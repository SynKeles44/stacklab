---
title: PSR-4 und eigene Composer-Pakete
summary: Wie der Autoloader vom Klassennamen zur Datei findet und wie du ein eigenes Composer-Paket per Path-Repository in eine App einbindest.
duration: 25
sources:
  - title: PHP-FIG – PSR-4 Autoloader
    url: https://www.php-fig.org/psr/psr-4/
  - title: Composer – Schema (autoload)
    url: https://getcomposer.org/doc/04-schema.md#autoload
  - title: Composer – Repositories (path)
    url: https://getcomposer.org/doc/05-repositories.md#path
  - title: PHP Manual – Namespaces
    url: https://www.php.net/manual/de/language.namespaces.php
quiz:
  - type: single
    question: "Die composer.json enthält `\"psr-4\": { \"Acme\\\\Shop\\\\\": \"src/\" }`. In welcher Datei sucht der Autoloader die Klasse `Acme\\Shop\\Cart\\Item`?"
    options:
      - src/Acme/Shop/Cart/Item.php
      - src/Cart/Item.php
      - src/Item.php
      - vendor/Acme/Shop/Cart/Item.php
    answer: 1
    explanation: Das Präfix Acme\Shop\ wird durch src/ ersetzt, der Rest Cart\Item wird zu Cart/Item, dazu kommt .php.
  - type: find-bug
    question: "Der Autoloader findet `Stacklab\\Greeter\\Format\\Shout` nicht. Die Datei liegt in `src/Format/Shout.php`. Welche Zeile ist falsch?"
    language: php
    code: |
      <?php

      namespace Stacklab\Greeter;

      final class Shout
      {
          public function apply(string $text): string
          {
              return strtoupper($text) . '!';
          }
      }
    bug_line: 3
    explanation: Bei PSR-4 muss der Namespace zum Ordner passen. Die Datei liegt in src/Format/, also muss der Namespace Stacklab\Greeter\Format lauten.
  - type: multiple
    question: Welche Aussagen über ein Path-Repository stimmen?
    options:
      - Composer holt das Paket aus einem lokalen Ordner statt von Packagist.
      - Standardmäßig legt Composer einen Symlink in vendor/ an.
      - Das Paket braucht trotzdem eine eigene composer.json mit Namen.
      - Path-Repositories funktionieren nur mit Laravel.
    answers: [0, 1, 2]
    explanation: Path-Repositories sind ideal, um ein eigenes Paket neben der App zu entwickeln. Mit Laravel haben sie nichts zu tun.
  - type: cloze
    text: Änderst du den autoload-Abschnitt deiner composer.json, erzeugst du den Autoloader mit `composer ___` neu. PSR-4 ist ein Standard der Gruppe ___.
    blanks:
      - [dump-autoload, dumpautoload, du]
      - [PHP-FIG, FIG, PHP FIG]
    explanation: dump-autoload schreibt die Dateien in vendor/composer/ neu. PHP-FIG veröffentlicht die PSR-Standards.
tasks:
  - id: psr4-pfad
    type: code
    language: php
    title: Baue die PSR-4-Regel nach
    description: |
      Schreibe die Funktion `psr4Path(string $prefix, string $baseDir, string $class): ?string`.
      Sie soll so arbeiten wie der Composer-Autoloader:

      - Beginnt `$class` nicht mit `$prefix`, gib `null` zurück.
      - Sonst ersetze das Präfix durch `$baseDir`, mache aus jedem `\` im Rest ein `/` und hänge `.php` an.
      - `$baseDir` kann mit oder ohne abschließenden `/` übergeben werden.

      Beispiel: `psr4Path('Acme\\Shop\\', 'src/', 'Acme\\Shop\\Cart\\Item')` → `src/Cart/Item.php`
    starter: |
      <?php

      function psr4Path(string $prefix, string $baseDir, string $class): ?string
      {
          // 1. Passt das Präfix?
          // 2. Rest des Klassennamens bestimmen
          // 3. Pfad zusammensetzen
          return null;
      }
    tests:
      - name: Klasse in Unterordner
        code: |
          assert_same('src/Cart/Item.php', psr4Path('Acme\\Shop\\', 'src/', 'Acme\\Shop\\Cart\\Item'));
      - name: Klasse direkt im Basisordner
        code: |
          assert_same('src/Greeter.php', psr4Path('Stacklab\\Greeter\\', 'src/', 'Stacklab\\Greeter\\Greeter'));
      - name: Fremdes Präfix ergibt null
        code: |
          assert_same(null, psr4Path('Acme\\Shop\\', 'src/', 'Other\\Lib\\Thing'));
      - name: Basisordner ohne Schrägstrich
        code: |
          assert_same('lib/A/B/C.php', psr4Path('X\\', 'lib', 'X\\A\\B\\C'));
    solution: |
      <?php

      function psr4Path(string $prefix, string $baseDir, string $class): ?string
      {
          if (!str_starts_with($class, $prefix)) {
              return null;
          }

          $relative = substr($class, strlen($prefix));

          return rtrim($baseDir, '/') . '/' . str_replace('\\', '/', $relative) . '.php';
      }
    hints:
      - "`str_starts_with()` prüft das Präfix, `substr($class, strlen($prefix))` liefert den Rest."
      - "`str_replace('\\\\', '/', $rest)` tauscht Backslashes gegen Schrägstriche. `rtrim($baseDir, '/')` entfernt einen Schrägstrich am Ende."
  - id: eigenes-composer-paket
    type: terminal
    title: Ein eigenes Paket per Path-Repository einbinden
    description: |
      Im Ordner `psr4` liegen zwei Unterordner:

      - `greeter/` – dein Paket `stacklab/greeter` mit den Klassen `Stacklab\Greeter\Greeter`
        (`src/Greeter.php`) und `Stacklab\Greeter\Format\Shout` (`src/Format/Shout.php`).
        Der composer.json fehlt noch das Autoloading.
      - `app/` – eine leere App mit minimaler composer.json.

      1. Ergänze in `greeter/composer.json` ein PSR-4-Autoloading: Namespace `Stacklab\Greeter\` → `src/`.
      2. Registriere in `app` den Ordner `../greeter` als Path-Repository:
         `composer config repositories.greeter path ../greeter`.
      3. Installiere das Paket in der App: `composer require stacklab/greeter:@dev`.
      4. Schreibe `app/index.php`, das den Autoloader einbindet und
         `(new Shout())->apply((new Greeter())->greet('Ada'))` ausgibt – erwartet ist `HALLO, ADA!`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: psr4
    setup: |
      mkdir -p greeter/src/Format app
      cat > greeter/composer.json <<'EOF'
      {
          "name": "stacklab/greeter",
          "description": "Kleine Gruß-Library",
          "type": "library",
          "license": "MIT",
          "require": {
              "php": ">=8.3"
          }
      }
      EOF
      cat > greeter/src/Greeter.php <<'EOF'
      <?php

      namespace Stacklab\Greeter;

      final class Greeter
      {
          public function greet(string $name): string
          {
              return "Hallo, {$name}";
          }
      }
      EOF
      cat > greeter/src/Format/Shout.php <<'EOF'
      <?php

      namespace Stacklab\Greeter\Format;

      final class Shout
      {
          public function apply(string $text): string
          {
              return mb_strtoupper($text) . '!';
          }
      }
      EOF
      cd app && composer init -n -q --name=stacklab/app
    checks:
      - type: command
        run: jq -r '.autoload["psr-4"]["Stacklab\\Greeter\\"] // empty' greeter/composer.json
        stdout_matches: "^src/?$"
        message: 'greeter/composer.json braucht autoload.psr-4 mit "Stacklab\\Greeter\\": "src/".'
      - type: command
        run: jq -r '[.repositories[]? | select(.type == "path") | .url] | join(",")' app/composer.json
        stdout_matches: "greeter"
        message: In app/composer.json fehlt das Path-Repository auf ../greeter.
      - type: command
        run: jq -r '.require["stacklab/greeter"] // empty' app/composer.json
        stdout_matches: "\\S"
        message: Die App hat stacklab/greeter noch nicht per composer require eingebunden.
      - type: dir_exists
        path: app/vendor/stacklab/greeter
        message: vendor/stacklab/greeter fehlt in der App – ist composer require durchgelaufen?
      - type: command
        run: cd app && php index.php
        stdout_matches: "HALLO, ADA!"
        message: app/index.php soll "HALLO, ADA!" ausgeben.
    hints:
      - "Mit jq ergänzt du das Autoloading ohne Editor: `jq '.autoload[\"psr-4\"][\"Stacklab\\\\Greeter\\\\\"] = \"src/\"' composer.json > neu.json && mv neu.json composer.json` (im Ordner greeter)."
      - "In der JSON-Datei steht der Namespace mit doppelten Backslashes: `\"Stacklab\\\\Greeter\\\\\": \"src/\"`."
      - "In index.php brauchst du `use Stacklab\\Greeter\\Greeter;` und `use Stacklab\\Greeter\\Format\\Shout;`."
    solution: |
      ```bash
      cd psr4/greeter
      jq '.autoload["psr-4"]["Stacklab\\Greeter\\"] = "src/"' composer.json > neu.json && mv neu.json composer.json
      cd ../app
      composer config repositories.greeter path ../greeter
      composer require stacklab/greeter:@dev
      cat > index.php <<'EOF'
      <?php
      require __DIR__ . '/vendor/autoload.php';

      use Stacklab\Greeter\Format\Shout;
      use Stacklab\Greeter\Greeter;

      echo (new Shout())->apply((new Greeter())->greet('Ada')), PHP_EOL;
      EOF
      php index.php
      ```
---
In der letzten Lektion hast du `vendor/autoload.php` eingebunden – und plötzlich kannte PHP hunderte
Klassen. Wie findet der [[autoloading|Autoloader]] die richtige Datei? Die Antwort ist eine einfache
Namensregel. Und wenn du sie kennst, kannst du dein eigenes Paket bauen.

## Namespaces als Adressen

Ein [[namespace|Namespace]] ist der „Nachname“ einer PHP-Klasse. Er verhindert, dass zwei Pakete mit einer
Klasse `Greeter` kollidieren:

```php title="src/Format/Shout.php"
<?php

namespace Stacklab\Greeter\Format;

final class Shout
{
    public function apply(string $text): string
    {
        return mb_strtoupper($text) . '!';
    }
}
```

Der vollständige Name lautet `Stacklab\Greeter\Format\Shout`. Mit `use` kürzt du ihn in anderen Dateien ab.
Die Konvention: Der erste Teil ist der Hersteller (`Stacklab`), der zweite das Paket (`Greeter`).

## Die PSR-4-Regel

[[psr-4|PSR-4]] ist ein Standard der PHP-FIG, einer Gruppe, die gemeinsame Regeln für PHP-Projekte
festlegt. Er sagt: **Namespace-Präfix → Basisordner, Rest des Namens → Unterordner und Dateiname.**

![PSR-4: Das Präfix Acme\Greeter\ wird zu src/, der Rest Format\Upper zu Format/Upper.php](/assets/libraries-pakete-registries/psr4-autoloading.svg)

In der composer.json sieht das so aus:

```json title="composer.json"
"autoload": {
    "psr-4": {
        "Stacklab\\Greeter\\": "src/"
    }
}
```

| Klasse | Datei |
|---|---|
| `Stacklab\Greeter\Greeter` | `src/Greeter.php` |
| `Stacklab\Greeter\Format\Shout` | `src/Format/Shout.php` |

In JSON muss jeder Backslash verdoppelt werden – deshalb `"Stacklab\\Greeter\\"`. Nach Änderungen am
`autoload`-Abschnitt erzeugst du den Autoloader neu: `composer dump-autoload`.

> [!MERKSATZ]
> Bei PSR-4 gilt: **Ordner = Namespace, Dateiname = Klassenname.** Groß- und Kleinschreibung müssen
> exakt stimmen – Linux-Server unterscheiden `shout.php` und `Shout.php`.

## Ein eigenes Paket anlegen

Ein Composer-Paket ist nur ein Ordner mit `composer.json` und Code:

```text
greeter/
├── composer.json      ← name, type, license, autoload
└── src/
    ├── Greeter.php
    └── Format/Shout.php
```

Um es in einer App zu nutzen, ohne es zu veröffentlichen, gibt es das
[[path-repository|Path-Repository]]: Du sagst Composer „Suche Pakete auch in diesem Ordner“.

```bash title="Im Ordner app/"
composer config repositories.greeter path ../greeter
composer require stacklab/greeter:@dev
```

Composer legt in `vendor/stacklab/greeter` einen [[symlink|Symlink]] auf deinen Ordner an. Änderungen am
Paket wirken sofort in der App. `@dev` erlaubt eine Entwicklungsversion ohne festen Release.

> [!FEHLER]
> **Klasse verschoben, Namespace vergessen.** Liegt `Shout.php` in `src/Format/`, aber im Code steht
> `namespace Stacklab\Greeter;`, meldet PHP „Class not found“. Ordner und Namespace müssen immer
> zusammenpassen.

> [!PRAXIS]
> In größeren Laravel-Projekten liegen eigene Pakete oft in einem Ordner `packages/` neben der App und
> werden per Path-Repository eingebunden. So lässt sich ein Modul sauber abgrenzen und später als eigenes
> Paket auslagern.

## Fehlersuche: „Class not found“

Die häufigste Meldung rund ums Autoloading lautet `Class "…" not found`. Fast immer liegt es an einer von
fünf Ursachen – geh sie der Reihe nach durch:

| Prüfen | Typischer Fehler |
|---|---|
| Ist `vendor/autoload.php` eingebunden? | Skript startet ohne `require` des Autoloaders |
| Passt der Namespace zum Ordner? | Datei in `src/Format/`, Namespace ohne `\Format` |
| Stimmt die Schreibweise? | `shout.php` statt `Shout.php` – auf Linux ein Unterschied |
| Steht das Präfix im `autoload`-Abschnitt? | Präfix fehlt oder endet nicht mit `\\` im JSON |
| Wurde der Autoloader neu erzeugt? | `composer dump-autoload` vergessen |

```bash title="Was kennt der Autoloader?"
cat vendor/composer/autoload_psr4.php   # alle Präfixe und ihre Ordner
composer dump-autoload                  # Autoloader neu erzeugen
```

> [!TIPP]
> Mit `composer dump-autoload --optimize` erzeugt Composer eine fertige Liste aller Klassen. Das ist auf
> Produktionsservern schneller, weil PHP nicht mehr nach Dateien suchen muss.
## Zusammenfassung

- Ein **Namespace** ist der vollständige Name einer Klasse, z. B. `Stacklab\Greeter\Greeter`.
- **PSR-4**: Präfix → Basisordner, Rest → Unterordner, Klassenname → Dateiname mit `.php`.
- Im JSON verdoppelst du Backslashes; nach Änderungen hilft `composer dump-autoload`.
- Ein eigenes Paket braucht nur eine `composer.json` mit `name` und `autoload` plus Code.
- Bei „Class not found“ prüfst du Autoloader, Namespace, Schreibweise und `composer dump-autoload`.
- Ein **Path-Repository** bindet einen lokalen Ordner per Symlink ein: `composer require hersteller/paket:@dev`.
