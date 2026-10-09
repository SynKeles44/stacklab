---
title: Composer – Pakete für PHP
summary: Wie Composer mit composer.json, composer.lock und vendor/ arbeitet und warum install und update zwei sehr verschiedene Befehle sind.
duration: 25
sources:
  - title: Composer – Basic usage
    url: https://getcomposer.org/doc/01-basic-usage.md
  - title: Composer – Command-line interface (require, install, update)
    url: https://getcomposer.org/doc/03-cli.md
  - title: Composer – Versions and constraints
    url: https://getcomposer.org/doc/articles/versions.md
  - title: Packagist
    url: https://packagist.org/
quiz:
  - type: match
    question: Ordne jeder Datei bzw. jedem Ordner die Aufgabe zu.
    pairs:
      - { left: "composer.json", right: "Wünsche: welche Pakete in welchen Versionsbereichen" }
      - { left: "composer.lock", right: "Tatsächlich installierte Versionen, exakt festgehalten" }
      - { left: "vendor/", right: "Heruntergeladener Code aller Pakete" }
      - { left: "vendor/autoload.php", right: "Lädt Klassen automatisch, sobald du sie brauchst" }
    explanation: composer.json und composer.lock gehören ins Git-Repository, vendor/ nicht – es lässt sich jederzeit aus dem Lockfile wiederherstellen.
  - type: single
    question: Deine Kollegin hat das Projekt neu geklont. Welcher Befehl installiert genau die Versionen, mit denen das Team arbeitet?
    options:
      - composer update
      - composer install
      - composer require
      - composer dump-autoload
    answer: 1
    explanation: composer install liest die composer.lock und installiert exakt diese Versionen. composer update sucht neue Versionen und schreibt ein neues Lockfile.
  - type: cloze
    text: Mit `composer ___ ramsey/uuid` fügst du ein Paket hinzu. Ein Werkzeug wie ein Code-Formatter kommt mit der Option `___` in den Bereich require-dev.
    blanks:
      - [require]
      - [--dev]
    explanation: require trägt das Paket ein, löst Versionen auf, lädt es herunter und aktualisiert das Lockfile – alles in einem Schritt.
  - type: find-bug
    question: Ein Skript bricht mit „Class "Ramsey\Uuid\Uuid" not found“ ab, obwohl das Paket installiert ist. Welche Zeile fehlt bzw. ist falsch?
    language: php
    code: |
      <?php
      require __DIR__ . '/vendor/composer/installed.php';
      use Ramsey\Uuid\Uuid;
      echo Uuid::uuid4()->toString();
    bug_line: 2
    explanation: Eingebunden werden muss `vendor/autoload.php`. Erst diese Datei registriert den Autoloader, der Klassen bei Bedarf nachlädt.
tasks:
  - id: erstes-composer-paket
    type: terminal
    title: Dein erstes Composer-Paket
    description: |
      Im Ordner `uuid-demo` liegt eine minimale `composer.json`. Du nutzt das Paket `ramsey/uuid`,
      das eindeutige IDs (UUIDs) erzeugt.

      1. Füge `ramsey/uuid` mit `composer require` hinzu.
      2. Schau dir an, was entstanden ist: `composer.lock`, der Ordner `vendor/` und mit
         `composer show --tree` der Abhängigkeitsbaum.
      3. Schreibe `app.php`: Binde `vendor/autoload.php` ein und gib `Ramsey\Uuid\Uuid::uuid4()->toString()` aus.
      4. Teste mit `php app.php`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: uuid-demo
    setup: |
      composer init -n -q --name=stacklab/uuid-demo
    checks:
      - type: command
        run: jq -r '.require["ramsey/uuid"] // empty' composer.json
        stdout_matches: "\\d"
        message: ramsey/uuid steht noch nicht unter require in der composer.json.
      - type: file_exists
        path: composer.lock
        message: Es gibt noch keine composer.lock – ist composer require durchgelaufen?
      - type: command
        run: jq -r '.packages[].name' composer.lock | sort | tr '\n' ' '
        stdout_matches: "brick/math"
        message: Im Lockfile fehlen die transitiven Abhängigkeiten. Führe composer require erneut aus.
      - type: file_contains
        path: app.php
        pattern: "vendor/autoload\\.php"
        message: app.php muss vendor/autoload.php einbinden.
      - type: command
        run: php app.php
        stdout_matches: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}\\s*$"
        message: php app.php soll eine UUID (Version 4) ausgeben.
    hints:
      - "`composer require ramsey/uuid` erledigt Eintrag, Download und Lockfile in einem Schritt."
      - "app.php beginnt mit `<?php` und `require __DIR__ . '/vendor/autoload.php';`."
    solution: |
      ```bash
      cd uuid-demo
      composer require ramsey/uuid
      composer show --tree
      cat > app.php <<'EOF'
      <?php
      require __DIR__ . '/vendor/autoload.php';

      use Ramsey\Uuid\Uuid;

      echo Uuid::uuid4()->toString(), PHP_EOL;
      EOF
      php app.php
      ```
  - id: was-ins-repo
    type: dragdrop
    title: Was gehört ins Git-Repository?
    description: Entscheide für jede Datei, ob sie committet wird oder in die .gitignore gehört.
    targets:
      - { id: commit, label: Wird committet }
      - { id: ignore, label: Steht in .gitignore }
    items:
      - { label: composer.json, target: commit }
      - { label: composer.lock, target: commit }
      - { label: vendor/, target: ignore }
      - { label: package.json, target: commit }
      - { label: package-lock.json, target: commit }
      - { label: node_modules/, target: ignore }
    hints:
      - Alles, was sich aus anderen Dateien jederzeit wiederherstellen lässt, gehört nicht ins Repository.
---
Im Frontend heißt der Paketmanager npm oder Bun, in der PHP-Welt [[composer|Composer]]. Die Ideen sind
dieselben – Manifest, Lockfile, ein Ordner mit fremdem Code –, aber Namen und einige Regeln unterscheiden
sich. Wer beide kennt, fühlt sich in jedem Web-Projekt zu Hause.

## Drei Dinge: composer.json, composer.lock, vendor/

| Datei/Ordner | Gegenstück bei npm | Aufgabe |
|---|---|---|
| [[composer-json\|composer.json]] | package.json | Manifest: Name, gewünschte Pakete, Autoloading |
| [[composer-lock\|composer.lock]] | package-lock.json | Exakte Versionen aller installierten Pakete |
| [[vendor-ordner\|vendor/]] | node_modules/ | Der heruntergeladene Code |

Die Pakete kommen standardmäßig von [[packagist|Packagist]], der zentralen Registry für PHP. Paketnamen
bestehen immer aus **Hersteller und Paket**: `ramsey/uuid`, `laravel/pint`, `monolog/monolog`.

```json title="composer.json"
{
    "name": "stacklab/uuid-demo",
    "require": {
        "php": "^8.4",
        "ramsey/uuid": "^4.9"
    },
    "require-dev": {
        "laravel/pint": "^1.25"
    }
}
```

Auch die PHP-Version selbst ist eine Anforderung: `"php": "^8.4"` verhindert, dass das Projekt auf einem
zu alten Server installiert wird.

## Pakete hinzufügen mit composer require

```bash title="Terminal"
composer require ramsey/uuid          # Laufzeit-Abhängigkeit
composer require --dev laravel/pint   # Entwicklungswerkzeug
```

`composer require` erledigt vier Schritte auf einmal:

1. passende Version auf Packagist suchen (z. B. `^4.9`),
2. den Eintrag in `composer.json` schreiben,
3. alle Pakete samt transitiven Abhängigkeiten nach `vendor/` laden,
4. `composer.lock` aktualisieren.

Die Versionsbereiche funktionieren wie bei npm nach [[semantic-versioning|Semantic Versioning]]:

| Schreibweise | Bedeutung | Beispiel erlaubt |
|---|---|---|
| `^4.9` | ab 4.9, unter 5.0 | 4.9.4, 4.12.0 |
| `~4.9.2` | ab 4.9.2, unter 4.10 | 4.9.7 |
| `4.9.4` | genau diese Version | nur 4.9.4 |
| `@dev` | Entwicklungsstand ohne Release | z. B. ein lokales Paket |

Das Caret `^` ist der Standard, den `composer require` selbst einträgt: Es erlaubt Fehlerbehebungen und neue
Funktionen, aber keine [[breaking-change|Breaking Changes]].

## install oder update?

Diese beiden Befehle werden ständig verwechselt – mit teuren Folgen.

| Befehl | Liest | Schreibt Lockfile? | Wann? |
|---|---|---|---|
| `composer install` | composer.lock | nein | Nach dem Klonen, auf dem Server, in CI |
| `composer update` | composer.json | ja, neu | Wenn du bewusst aktualisieren willst |

> [!MERKSATZ]
> `install` installiert **genau**, was im Lockfile steht. `update` sucht **neue** Versionen und schreibt ein
> neues Lockfile. Auf Servern und in CI läuft deshalb immer `composer install`.

> [!FEHLER]
> **`composer update` „zum Reparieren“ ausführen.** Damit aktualisierst du womöglich dutzende Pakete auf
> einmal – und weißt hinterher nicht, welches Update etwas kaputtgemacht hat. Gezielt aktualisieren:
> `composer update ramsey/uuid`.

## Der Autoloader

PHP-Klassen liegen in vielen Dateien. Statt jede mit `require` einzubinden, erzeugt Composer einen
[[autoloading|Autoloader]]. Du bindest nur eine Datei ein:

```php title="app.php"
<?php
require __DIR__ . '/vendor/autoload.php';

use Ramsey\Uuid\Uuid;

echo Uuid::uuid4()->toString(), PHP_EOL;
```

Sobald PHP die Klasse `Ramsey\Uuid\Uuid` zum ersten Mal braucht, fragt es den Autoloader, und der lädt die
passende Datei aus `vendor/`. Wie er sie findet, lernst du in der nächsten Lektion.

> [!PRAXIS]
> In Laravel bindest du `vendor/autoload.php` nie selbst ein – das erledigen `public/index.php` und
> `artisan` für dich. Fehlt nach dem Klonen der Ordner `vendor/`, kommt sofort ein Fehler. Die Lösung ist
> fast immer ein `composer install`.

## Zusammenfassung

- **composer.json** beschreibt Wünsche, **composer.lock** die exakten Versionen, **vendor/** enthält den Code.
- Paketnamen haben die Form `hersteller/paket` und kommen von **Packagist**.
- `composer require` fügt hinzu, `--dev` für Werkzeuge wie Pint.
- `composer install` folgt dem Lockfile, `composer update` erzeugt ein neues.
- `vendor/autoload.php` lädt alle Klassen bei Bedarf – vendor/ selbst gehört nicht ins Repository.
